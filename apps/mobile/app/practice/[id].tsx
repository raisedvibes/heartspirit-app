import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Stack, router, useLocalSearchParams } from "expo-router"
import {
  View,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  AppState,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import {
  Audio,
  AVPlaybackStatus,
  InterruptionModeAndroid,
  InterruptionModeIOS,
  ResizeMode,
  Video,
} from "expo-av"

import ScreenContent from "@/components/layout/ScreenContent"
import TranslucentCard from "@/components/ui/TranslucentCard"
import BottomFade from "@/components/ui/BottomFade"
import { GLASS } from "@/components/ui/glass"
import { ThemedText } from "@/components/themed-text"
import { getSupabaseClient } from "@/lib/supabaseClient"
import {
  cancelScheduledNotification,
  schedulePracticeTimerCompletion,
} from "@/lib/ritualNotifications"
import { getOfflineCacheData, OfflineCacheKeys, setOfflineCache } from "@/lib/offlineCache"

const CHIME_URL =
  "https://tajqnuta9fwavw6h.public.blob.vercel-storage.com/triangle-percussion-ding-smartsound-fx-3-3-00-03.mp3"
const SILENT_LOOP_SOURCE = require("@/assets/audio/silence.mp3")

type PracticeRecord = {
  id: string
  title: string
  short_summary: string | null
  description: string | null
  duration: number | null
  category: string | null
  instruction_bullets: string[] | null
  mantra: string | null
  timer_minutes: number | null
  timer_enabled?: boolean | null
  has_chime: boolean
  media_url: string | null
  audio_url: string | null
  media_type: string | null
  cover_image: string | null
  thumbnail_url: string | null
}

function splitTitleAndDescription(title: string) {
  const [main, ...rest] = title.split(" - ")
  return {
    mainTitle: main.trim(),
    titleDescription: rest.join(" - ").trim() || "",
  }
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function PracticeDetailScreen() {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [practice, setPractice] = useState<PracticeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVideo, setShowVideo] = useState(false)

  const [audioReady, setAudioReady] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [audioPositionMillis, setAudioPositionMillis] = useState(0)
  const [audioDurationMillis, setAudioDurationMillis] = useState(0)

  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [hasTimerStarted, setHasTimerStarted] = useState(false)
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null)
  const [usingCachedPractice, setUsingCachedPractice] = useState(false)

  const practiceSoundRef = useRef<Audio.Sound | null>(null)
  const chimeSoundRef = useRef<Audio.Sound | null>(null)
  const silentSoundRef = useRef<Audio.Sound | null>(null)
  const silentLoopStartedByTimerRef = useRef(false)
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerNotificationIdRef = useRef<string | null>(null)

  const contentMinHeight = Math.max(420, windowHeight - insets.top - 96)

  const titleParts = practice ? splitTitleAndDescription(practice.title) : null
  const mediaUrl = practice?.media_url?.trim() || null
  const audioUrl = practice?.audio_url?.trim() || null
  const mediaType = practice?.media_type?.trim()?.toLowerCase() || null

  const videoUrl = mediaType === "video" ? mediaUrl : null
  const resolvedAudioUrl = audioUrl || (mediaType === "audio" ? mediaUrl : null)
  const timerMinutes = useMemo(() => {
    if (!practice) return null
    const raw = practice.timer_minutes ?? practice.duration
    return typeof raw === "number" && raw > 0 ? raw : null
  }, [practice])

  const showPracticeTimer =
    practice != null && practice.timer_enabled !== false && timerMinutes != null

  const hasChime = practice?.has_chime ?? true

  const unloadPracticeSound = useCallback(async () => {
    const currentSound = practiceSoundRef.current
    if (!currentSound) return

    try {
      currentSound.setOnPlaybackStatusUpdate(null)
      await currentSound.unloadAsync()
    } catch (error) {
      console.log("[practice audio] unload failed", error)
    } finally {
      practiceSoundRef.current = null
      setAudioReady(false)
      setIsAudioPlaying(false)
      setAudioPositionMillis(0)
      setAudioDurationMillis(0)
    }
  }, [])

  const unloadChimeSound = useCallback(async () => {
    const currentSound = chimeSoundRef.current
    if (!currentSound) return

    try {
      await currentSound.unloadAsync()
    } catch (error) {
      console.log("[practice chime] unload failed", error)
    } finally {
      chimeSoundRef.current = null
    }
  }, [])

  const stopSilentLoopForTimer = useCallback(async () => {
    const currentSound = silentSoundRef.current
    if (!currentSound) {
      silentLoopStartedByTimerRef.current = false
      return
    }

    try {
      await currentSound.stopAsync()
      await currentSound.unloadAsync()
    } catch (error) {
      console.log("[practice silence] stop failed", error)
    } finally {
      silentSoundRef.current = null
      silentLoopStartedByTimerRef.current = false
    }
  }, [])

  const ensureSilentLoopForTimer = useCallback(async () => {
    if (isAudioPlaying || isVideoPlaying) return
    if (silentSoundRef.current) return

    try {
      const { sound } = await Audio.Sound.createAsync(SILENT_LOOP_SOURCE, {
        shouldPlay: true,
        isLooping: true,
        volume: 0,
        progressUpdateIntervalMillis: 1000,
      })
      await sound.setIsLoopingAsync(true)
      await sound.setVolumeAsync(0)
      await sound.playAsync()
      silentSoundRef.current = sound
      silentLoopStartedByTimerRef.current = true
    } catch (error) {
      console.log("[practice silence] failed to start", error)
    }
  }, [isAudioPlaying, isVideoPlaying])

  useEffect(() => {
    if ((isAudioPlaying || isVideoPlaying) && silentSoundRef.current) {
      void stopSilentLoopForTimer()
    }
  }, [isAudioPlaying, isVideoPlaying, stopSilentLoopForTimer])

  const stopTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }, [])

  const getRemainingFromEndAt = useCallback((endAt: number | null) => {
    if (!endAt) return 0
    return Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
  }, [])

  const cancelTimerNotification = useCallback(async () => {
    await cancelScheduledNotification(timerNotificationIdRef.current)
    timerNotificationIdRef.current = null
  }, [])

  const ensureAudioMode = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })
    } catch (error) {
      console.log("[practice audio] setAudioModeAsync failed", error)
    }
  }, [])

  const ensureChimeLoaded = useCallback(async () => {
    if (!hasChime) return null

    if (chimeSoundRef.current) {
      return chimeSoundRef.current
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: CHIME_URL },
        { shouldPlay: false, progressUpdateIntervalMillis: 250, volume: 1 }
      )
      await sound.setVolumeAsync(1)
      chimeSoundRef.current = sound
      return sound
    } catch (error) {
      console.log("[practice chime] failed to load", error)
      return null
    }
  }, [hasChime])

  const playChime = useCallback(async () => {
    if (!hasChime) return

    try {
      const sound = await ensureChimeLoaded()
      if (!sound) return

      await sound.setVolumeAsync(1)
      await sound.setPositionAsync(0)
      await sound.playAsync()
    } catch (error) {
      console.log("[practice chime] playback failed", error)
    }
  }, [ensureChimeLoaded, hasChime])

  const loadPracticeAudio = useCallback(
    async (url: string) => {
      setAudioLoading(true)
      setAudioError(null)

      try {
        await ensureAudioMode()
        await unloadPracticeSound()

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: url },
          {
            shouldPlay: false,
            progressUpdateIntervalMillis: 500,
          }
        )

        sound.setOnPlaybackStatusUpdate((playbackStatus: AVPlaybackStatus) => {
          if (!playbackStatus.isLoaded) {
            if (playbackStatus.error) {
              console.log("[practice audio] playback status error", playbackStatus.error)
              setAudioError("Audio failed to play.")
              setAudioReady(false)
              setIsAudioPlaying(false)
            }
            return
          }

          setAudioReady(true)
          setIsAudioPlaying(playbackStatus.isPlaying)
          setAudioPositionMillis(playbackStatus.positionMillis ?? 0)
          setAudioDurationMillis(playbackStatus.durationMillis ?? 0)

          if (playbackStatus.didJustFinish) {
            setIsAudioPlaying(false)
          }
        })

        practiceSoundRef.current = sound

        if (status.isLoaded) {
          setAudioReady(true)
          setAudioPositionMillis(status.positionMillis ?? 0)
          setAudioDurationMillis(status.durationMillis ?? 0)
        } else {
          setAudioError("Audio failed to load.")
          setAudioReady(false)
        }
      } catch (error) {
        console.log("[practice audio] failed to load", error)
        setAudioError("Audio failed to load.")
        setAudioReady(false)
      } finally {
        setAudioLoading(false)
      }
    },
    [ensureAudioMode, unloadPracticeSound]
  )

  const handleToggleAudio = useCallback(async () => {
    const sound = practiceSoundRef.current
    if (!sound) return

    try {
      const status = await sound.getStatusAsync()
      if (!status.isLoaded) return

      if (status.isPlaying) {
        await sound.pauseAsync()
      } else {
        await sound.playAsync()
      }
    } catch (error) {
      console.log("[practice audio] toggle failed", error)
      setAudioError("Audio controls failed.")
    }
  }, [])

  const handleResetAudio = useCallback(async () => {
    const sound = practiceSoundRef.current
    if (!sound) return

    try {
      const status = await sound.getStatusAsync()
      if (!status.isLoaded) return

      await sound.stopAsync()
      await sound.setPositionAsync(0)
    } catch (error) {
      console.log("[practice audio] reset failed", error)
    }
  }, [])

  const startTimer = useCallback(async () => {
    if (!timerMinutes) return

    const baseSeconds = timeLeft > 0 ? timeLeft : timerMinutes * 60
    const endAt = Date.now() + baseSeconds * 1000
    setTimeLeft(baseSeconds)
    setTimerEndAt(endAt)

    setHasTimerStarted(true)
    setIsTimerRunning(true)

    await ensureSilentLoopForTimer()
    await cancelTimerNotification()
    timerNotificationIdRef.current = await schedulePracticeTimerCompletion(
      "Practice complete",
      practice?.title ? `${practice.title} is complete.` : "Your practice is complete.",
      baseSeconds
    )
    await playChime()
  }, [
    cancelTimerNotification,
    ensureSilentLoopForTimer,
    playChime,
    practice?.title,
    timeLeft,
    timerMinutes,
  ])

  const pauseTimer = useCallback(async () => {
    const remaining = getRemainingFromEndAt(timerEndAt)
    setTimeLeft(remaining)
    setTimerEndAt(null)
    setIsTimerRunning(false)
    await stopSilentLoopForTimer()
    await cancelTimerNotification()
  }, [cancelTimerNotification, getRemainingFromEndAt, stopSilentLoopForTimer, timerEndAt])

  const resetTimer = useCallback(async () => {
    setIsTimerRunning(false)
    setHasTimerStarted(false)
    setTimerEndAt(null)
    setTimeLeft(timerMinutes ? timerMinutes * 60 : 0)
    await stopSilentLoopForTimer()
    await cancelTimerNotification()
  }, [cancelTimerNotification, stopSilentLoopForTimer, timerMinutes])

  useEffect(() => {
    let cancelled = false

    async function loadPractice() {
      if (!id || typeof id !== "string") {
        setLoading(false)
        return
      }

      const cacheKey = OfflineCacheKeys.practice.detail(id)
      const supabase = getSupabaseClient()
      if (!supabase) {
        const cachedPractice = await getOfflineCacheData<PracticeRecord>(cacheKey)
        setPractice(cachedPractice)
        setUsingCachedPractice(Boolean(cachedPractice))
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("practices")
        .select(
          "id, title, short_summary, description, duration, category, instruction_bullets, mantra, timer_minutes, timer_enabled, has_chime, media_url, audio_url, media_type, cover_image, thumbnail_url"
        )
        .eq("id", id)
        .single()

      if (cancelled) return

      if (error) {
        console.log("[practice] failed loading practice", error.message)
        const cachedPractice = await getOfflineCacheData<PracticeRecord>(cacheKey)
        setPractice(cachedPractice)
        setUsingCachedPractice(Boolean(cachedPractice))
      } else {
        console.log("[practice media]", {
          id: data?.id,
          title: data?.title,
          media_url: data?.media_url,
          audio_url: data?.audio_url,
          media_type: data?.media_type,
          thumbnail_url: data?.thumbnail_url,
          timer_minutes: data?.timer_minutes,
          duration: data?.duration,
          has_chime: data?.has_chime,
        })
        setShowVideo(false)
        setPractice(data)
        setUsingCachedPractice(false)
        void setOfflineCache(cacheKey, data as PracticeRecord)
      }

      setLoading(false)
    }

    loadPractice()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    ensureAudioMode()
  }, [ensureAudioMode])

  useEffect(() => {
    setIsTimerRunning(false)
    setHasTimerStarted(false)
    setTimerEndAt(null)
    const allowed = practice?.timer_enabled !== false
    setTimeLeft(
      allowed && timerMinutes ? timerMinutes * 60 : 0
    )
    void cancelTimerNotification()
  }, [cancelTimerNotification, timerMinutes, practice?.timer_enabled])

  useEffect(() => {
    let cancelled = false

    async function prepareAudio() {
      if (!resolvedAudioUrl) {
        await unloadPracticeSound()
        setAudioError(null)
        return
      }

      if (!cancelled) {
        await loadPracticeAudio(resolvedAudioUrl)
      }
    }

    prepareAudio()

    return () => {
      cancelled = true
    }
  }, [resolvedAudioUrl, loadPracticeAudio, unloadPracticeSound])

  useEffect(() => {
    if (!isTimerRunning) {
      stopTimerInterval()
      return
    }

    if (!timerEndAt) {
      setIsTimerRunning(false)
      return
    }

    const syncTimerFromClock = () => {
      const remaining = getRemainingFromEndAt(timerEndAt)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        stopTimerInterval()
        setTimerEndAt(null)
        setIsTimerRunning(false)
        void stopSilentLoopForTimer()
        void cancelTimerNotification()
        void playChime()
      }
    }

    syncTimerFromClock()
    timerIntervalRef.current = setInterval(syncTimerFromClock, 1000)

    return () => {
      stopTimerInterval()
    }
  }, [
    cancelTimerNotification,
    getRemainingFromEndAt,
    isTimerRunning,
    playChime,
    stopSilentLoopForTimer,
    stopTimerInterval,
    timerEndAt,
  ])

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && isTimerRunning && timerEndAt) {
        setTimeLeft(getRemainingFromEndAt(timerEndAt))
      }
    })
    return () => sub.remove()
  }, [getRemainingFromEndAt, isTimerRunning, timerEndAt])

  useEffect(() => {
    return () => {
      stopTimerInterval()
      void cancelTimerNotification()
      void unloadPracticeSound()
      void unloadChimeSound()
      void stopSilentLoopForTimer()
    }
  }, [
    cancelTimerNotification,
    stopSilentLoopForTimer,
    stopTimerInterval,
    unloadPracticeSound,
    unloadChimeSound,
  ])

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require("@/assets/images/fern.background.png")}
        style={styles.bg}
        resizeMode="cover"
      >
        <ScreenContent bottomPaddingOverride={0}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.contentWrap, { minHeight: contentMinHeight }]}>
              <View style={styles.topRow}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.9)" />
                  <ThemedText type="defaultSemiBold" style={styles.backText}>
                    Back
                  </ThemedText>
                </Pressable>

                <View style={styles.headerBlock}>
                  <ThemedText type="title" style={styles.recommendedHeader}>
                    Recommended
                  </ThemedText>
                </View>
              </View>

              <TranslucentCard style={styles.card}>
                {loading ? (
                  <View style={styles.centerBlock}>
                    <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                    <ThemedText type="muted" style={styles.statusText}>
                      Loading practice…
                    </ThemedText>
                  </View>
                ) : !practice ? (
                  <View style={styles.centerBlock}>
                    <ThemedText type="defaultSemiBold" style={styles.notFoundTitle}>
                      Practice not found
                    </ThemedText>
                    <ThemedText type="muted" style={styles.statusText}>
                      We couldn’t load this practice.
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    <View style={styles.metaRow}>
                      {practice.category ? (
                        <View style={styles.pill}>
                          <ThemedText type="muted" style={styles.pillText}>
                            {practice.category}
                          </ThemedText>
                        </View>
                      ) : null}

                      {typeof practice.duration === "number" ? (
                        <ThemedText type="muted" style={styles.metaText}>
                          {practice.duration} min
                        </ThemedText>
                      ) : null}
                    </View>

                    <ThemedText type="title" style={styles.title}>
                      {titleParts?.mainTitle ?? practice.title}
                    </ThemedText>

                    <ThemedText type="muted" style={styles.practiceGuideText}>
                      {showPracticeTimer
                        ? "Start with guidance here, then continue with the practice timer below."
                        : "Start with guidance here."}
                    </ThemedText>
                    {usingCachedPractice ? (
                      <ThemedText type="muted" style={styles.cachedNotice}>
                        Offline mode - showing saved practice from this device.
                      </ThemedText>
                    ) : null}

                    {videoUrl && (
                      <View style={styles.mediaBlock}>
                        {!showVideo && practice.thumbnail_url ? (
                          <Pressable onPress={() => setShowVideo(true)} style={styles.videoPosterWrap}>
                            <ImageBackground
                              source={{ uri: practice.thumbnail_url }}
                              style={styles.video}
                              imageStyle={styles.videoPosterImage}
                              resizeMode="cover"
                            >
                              <View style={styles.playOverlay}>
                                <View style={styles.playButton}>
                                  <MaterialIcons name="play-arrow" size={42} color="#fff" />
                                </View>
                              </View>
                            </ImageBackground>
                          </Pressable>
                        ) : (
                          <Video
                            source={{ uri: videoUrl }}
                            useNativeControls
                            resizeMode={ResizeMode.COVER}
                            style={styles.video}
                            isLooping={false}
                            shouldPlay={showVideo}
                            isMuted={false}
                            volume={1}
                            onPlaybackStatusUpdate={(status) => {
                              if (!status.isLoaded) {
                                setIsVideoPlaying(false)
                                return
                              }
                              setIsVideoPlaying(status.isPlaying)
                            }}
                          />
                        )}
                      </View>
                    )}

                    {resolvedAudioUrl && (
                      <View style={styles.audioCard}>
                        <View style={styles.audioHeaderRow}>
                          <ThemedText type="defaultSemiBold" style={styles.audioLabel}>
                            Audio
                          </ThemedText>

                          {audioLoading ? (
                            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                          ) : (
                            <ThemedText type="muted" style={styles.audioMeta}>
                              {audioDurationMillis > 0
                                ? formatClock(Math.floor(audioDurationMillis / 1000))
                                : "Ready"}
                            </ThemedText>
                          )}
                        </View>

                        <View style={styles.audioButtonsRow}>
                          <Pressable
                            onPress={handleToggleAudio}
                            disabled={!audioReady || audioLoading}
                            style={[
                              styles.audioButton,
                              (!audioReady || audioLoading) && styles.audioButtonDisabled,
                            ]}
                          >
                            <MaterialIcons
                              name={isAudioPlaying ? "pause" : "play-arrow"}
                              size={20}
                              color="#fff"
                            />
                            <ThemedText type="defaultSemiBold" style={styles.audioButtonText}>
                              {isAudioPlaying ? "Pause" : "Play"}
                            </ThemedText>
                          </Pressable>

                          <Pressable
                            onPress={handleResetAudio}
                            disabled={!audioReady || audioLoading}
                            style={[
                              styles.audioSecondaryButton,
                              (!audioReady || audioLoading) && styles.audioButtonDisabled,
                            ]}
                          >
                            <MaterialIcons name="replay" size={18} color="rgba(255,255,255,0.92)" />
                            <ThemedText type="defaultSemiBold" style={styles.audioSecondaryButtonText}>
                              Reset
                            </ThemedText>
                          </Pressable>
                        </View>

                        <View style={styles.audioProgressTrack}>
                          <View
                            style={[
                              styles.audioProgressFill,
                              {
                                width:
                                  audioDurationMillis > 0
                                    ? `${Math.min(
                                        100,
                                        Math.max(0, (audioPositionMillis / audioDurationMillis) * 100)
                                      )}%`
                                    : "0%",
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.audioTimeRow}>
                          <ThemedText type="muted" style={styles.audioMeta}>
                            {formatClock(Math.floor(audioPositionMillis / 1000))}
                          </ThemedText>
                          <ThemedText type="muted" style={styles.audioMeta}>
                            {audioDurationMillis > 0
                              ? formatClock(Math.floor(audioDurationMillis / 1000))
                              : "--:--"}
                          </ThemedText>
                        </View>

                        {!!audioError && (
                          <ThemedText type="muted" style={styles.audioError}>
                            {audioError}
                          </ThemedText>
                        )}
                      </View>
                    )}

                    {!!titleParts?.titleDescription && (
                      <ThemedText type="muted" style={styles.description}>
                        {titleParts.titleDescription}
                      </ThemedText>
                    )}

                    {!!practice.short_summary && (
                      <ThemedText type="muted" style={styles.description}>
                        {practice.short_summary}
                      </ThemedText>
                    )}

                    {!!practice.description && (
                      <ThemedText type="muted" style={styles.description}>
                        {practice.description}
                      </ThemedText>
                    )}

                    {practice.instruction_bullets && practice.instruction_bullets.length > 0 && (
                      <View style={styles.instructionsBlock}>
                        {practice.instruction_bullets.map((step, index) => (
                          <View key={`${index}-${step}`} style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                              <ThemedText type="defaultSemiBold" style={styles.stepNumberText}>
                                {index + 1}
                              </ThemedText>
                            </View>
                            <ThemedText type="muted" style={styles.stepText}>
                              {step}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    )}

                    {!!practice.mantra && (
                      <View style={styles.mantraBlock}>
                        <ThemedText type="defaultSemiBold" style={styles.mantraLabel}>
                          Mantra
                        </ThemedText>
                        <ThemedText type="muted" style={styles.mantraText}>
                          {practice.mantra}
                        </ThemedText>
                      </View>
                    )}

                    {showPracticeTimer ? (
                      <View style={styles.timerCard}>
                        <View style={styles.timerHeaderRow}>
                          <ThemedText type="defaultSemiBold" style={styles.timerLabel}>
                            Practice Timer
                          </ThemedText>
                          <ThemedText type="muted" style={styles.timerMeta}>
                            {timerMinutes} min
                          </ThemedText>
                        </View>

                        <ThemedText type="title" style={styles.timerClock}>
                          {formatClock(timeLeft)}
                        </ThemedText>

                        <View style={styles.timerButtonsRow}>
                          {!isTimerRunning ? (
                            <Pressable onPress={() => void startTimer()} style={styles.timerStartButton}>
                              <ThemedText type="defaultSemiBold" style={styles.timerStartButtonText}>
                                {hasTimerStarted ? "Resume" : "Start"}
                              </ThemedText>
                            </Pressable>
                          ) : (
                            <Pressable onPress={pauseTimer} style={styles.timerPauseButton}>
                              <ThemedText type="defaultSemiBold" style={styles.timerPauseButtonText}>
                                Pause
                              </ThemedText>
                            </Pressable>
                          )}

                          <Pressable onPress={resetTimer} style={styles.timerResetButton}>
                            <ThemedText type="defaultSemiBold" style={styles.timerResetButtonText}>
                              Reset
                            </ThemedText>
                          </Pressable>
                        </View>

                        <ThemedText type="muted" style={styles.timerHint}>
                          After this practice, check in with your energy.
                          {"\n"}How has it shifted?
                        </ThemedText>
                      </View>
                    ) : null}
                  </>
                )}
              </TranslucentCard>
            </View>
          </ScrollView>
        </ScreenContent>
      </ImageBackground>

      <BottomFade />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1 },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
  },

  contentWrap: {
    flexGrow: 1,
    gap: 16,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  backText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
  },

  headerBlock: {
    alignItems: "flex-end",
  },

  recommendedHeader: {
    fontSize: 24,
    fontWeight: "600",
  },

  card: {
    flex: 1,
    padding: 18,
    justifyContent: "flex-start",
  },

  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 10,
  },

  statusText: {
    fontSize: 14,
    textAlign: "center",
  },

  notFoundTitle: {
    fontSize: 18,
    textAlign: "center",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(18, 24, 20, 0.38)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  pillText: {
    fontSize: 12,
  },

  metaText: {
    fontSize: 12,
  },

  title: {
    fontSize: 26,
    marginBottom: 10,
  },

  practiceGuideText: {
    fontSize: 14,
    lineHeight: 17,
    opacity: 0.9,
    marginBottom: 6,
  },
  cachedNotice: {
    marginBottom: 8,
    fontSize: 11,
    opacity: 0.72,
  },

  mediaBlock: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },

  videoPosterWrap: {
    width: "100%",
  },

  videoPosterImage: {
    borderRadius: 16,
  },

  playOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },

  audioCard: {
    marginVertical: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: GLASS.bgDark,
    borderWidth: 1,
    borderColor: GLASS.borderDark,
    gap: 12,
  },

  audioHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  audioLabel: {
    fontSize: 15,
  },

  audioMeta: {
    fontSize: 12,
  },

  audioButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },

  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(53,122,70,0.95)",
  },

  audioSecondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(18, 24, 20, 0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  audioButtonDisabled: {
    opacity: 0.45,
  },

  audioButtonText: {
    color: "#fff",
    fontSize: 14,
  },

  audioSecondaryButtonText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
  },

  audioProgressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  audioProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
  },

  audioTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  audioError: {
    fontSize: 12,
    color: "rgba(255,210,210,0.95)",
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },

  instructionsBlock: {
    marginTop: 8,
    gap: 12,
  },

  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 14,
    backgroundColor: GLASS.bgDark,
    borderWidth: 1,
    borderColor: GLASS.borderDark,
  },

  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  stepNumberText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.95)",
  },

  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  mantraBlock: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: GLASS.bgDark,
    borderWidth: 1,
    borderColor: GLASS.borderDark,
  },

  mantraLabel: {
    fontSize: 13,
    marginBottom: 6,
  },

  mantraText: {
    fontSize: 14,
    lineHeight: 20,
  },

  timerCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: GLASS.bgDark,
    borderWidth: 1,
    borderColor: GLASS.borderDark,
    gap: 12,
  },

  timerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  timerLabel: {
    fontSize: 15,
  },

  timerMeta: {
    fontSize: 12,
  },

  timerClock: {
    fontSize: 34,
    textAlign: "center",
    marginTop: 4,
  },

  timerButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
  },

  timerStartButton: {
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#2f8f4e",
  },

  timerPauseButton: {
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(70,70,70,0.95)",
  },

  timerResetButton: {
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.78)",
  },

  timerStartButtonText: {
    color: "#fff",
    fontSize: 14,
  },

  timerPauseButtonText: {
    color: "#fff",
    fontSize: 14,
  },

  timerResetButtonText: {
    color: "#111",
    fontSize: 14,
  },

  timerHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 4,
  },
})