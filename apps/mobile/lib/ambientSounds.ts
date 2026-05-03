import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AMBIENT_SOUNDS_ENABLED_KEY = "heartspirit.ambient_sounds.enabled"
/** After first successful startup ambience, following launches use the shorter tail. */
const STARTUP_AMBIENCE_ONCE_KEY = "heartspirit.startup_ambience.completed_once"

const STARTUP_AMBIENCE = require("@/assets/audio/Forest-creek-noise-and-singing-birds-relaxing-nature-sounds.mp3")

const TARGET_VOLUME = 0.32
const FADE_IN_MS = 500
const FADE_OUT_MS = 900

/** Hold after fade-in before fade-out: first-ever completion uses long tail (~6–8s total); later opens shorter. */
const HOLD_FIRST_MS = 5400
const HOLD_RETURNING_MS = 1400

let activeStartupSound: Audio.Sound | null = null

async function fadeVolume(
  sound: Audio.Sound,
  from: number,
  to: number,
  durationMs: number
) {
  const steps = Math.max(1, Math.round(durationMs / 100))
  const delta = (to - from) / steps

  for (let i = 1; i <= steps; i++) {
    const next = Math.max(0, Math.min(1, from + delta * i))
    await sound.setVolumeAsync(next)
    if (i < steps) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

async function getHoldAfterFadeInMs(): Promise<number> {
  try {
    const once = await AsyncStorage.getItem(STARTUP_AMBIENCE_ONCE_KEY)
    return once === "1" ? HOLD_RETURNING_MS : HOLD_FIRST_MS
  } catch {
    return HOLD_FIRST_MS
  }
}

export async function getAmbientSoundsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(AMBIENT_SOUNDS_ENABLED_KEY)
    if (raw == null) return true
    return raw === "true"
  } catch {
    return true
  }
}

export async function setAmbientSoundsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AMBIENT_SOUNDS_ENABLED_KEY, enabled ? "true" : "false")
  } catch {}
}

/** Sets mixing-friendly playback mode; call early so the first startup clip can play reliably. */
export async function ensureAmbientAudioMode(): Promise<void> {
  if (__DEV__) console.log("[ambient] setting audio mode (mix + silent switch playback)")
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  })
  if (__DEV__) console.log("[ambient] audio mode set")
}

export async function playStartupAmbienceIfNeeded(): Promise<void> {
  if (activeStartupSound) {
    if (__DEV__) console.log("[ambient] skip startup — previous startup ambience still active")
    return
  }

  const enabled = await getAmbientSoundsEnabled()
  if (!enabled) {
    if (__DEV__) console.log("[ambient] startup skipped — ambient sounds disabled in settings")
    return
  }

  let sound: Audio.Sound | null = null

  try {
    await ensureAmbientAudioMode()

    const holdMs = await getHoldAfterFadeInMs()
    if (__DEV__) {
      console.log("[ambient] loading startup MP3 asset, hold phase ms:", holdMs)
    }

    const created = await Audio.Sound.createAsync(
      STARTUP_AMBIENCE,
      { shouldPlay: false, volume: 0, isLooping: false }
    )
    sound = created.sound
    activeStartupSound = sound

    if (__DEV__) console.log("[ambient] calling playAsync()")
    await sound.playAsync()

    await fadeVolume(sound, 0, TARGET_VOLUME, FADE_IN_MS)

    await new Promise((resolve) => setTimeout(resolve, holdMs))
    await fadeVolume(sound, TARGET_VOLUME, 0, FADE_OUT_MS)
    await sound.stopAsync()

    try {
      await AsyncStorage.setItem(STARTUP_AMBIENCE_ONCE_KEY, "1")
    } catch (storageErr) {
      if (__DEV__) console.warn("[ambient] could not persist startup ambience completion flag", storageErr)
    }

    if (__DEV__) console.log("[ambient] startup ambience completed successfully")
  } catch (error) {
    if (__DEV__) console.warn("[ambient] startup ambience failed", error)
    else console.log("[ambient] startup ambience failed", error)
    throw error
  } finally {
    if (sound) {
      try {
        await sound.unloadAsync()
      } catch (unloadErr) {
        if (__DEV__) console.warn("[ambient] unloadAsync after startup failed", unloadErr)
      }
    }
    activeStartupSound = null
  }
}
