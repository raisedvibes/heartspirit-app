import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AMBIENT_SOUNDS_ENABLED_KEY = "heartspirit.ambient_sounds.enabled"

/** Bundled forest ambience — same asset path Metro resolves at build time. */
const SESSION_AMBIENCE = require("@/assets/audio/Forest-creek-noise-and-singing-birds-relaxing-nature-sounds.mp3")

const TARGET_VOLUME = 0.35

let rootAmbientSound: Audio.Sound | null = null

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

export async function ensureAmbientAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  })
}

/**
 * Root-session ambient: starts once when the app shell mounts (not tied to auth).
 * Loops until stopRootAmbientPlayback / unload.
 */
export async function startRootAmbientPlayback(): Promise<void> {
  if (rootAmbientSound) {
    console.log("[audio] skip — session ambient already loaded")
    return
  }

  const enabled = await getAmbientSoundsEnabled()
  if (!enabled) {
    console.log("[audio] skipped — ambient disabled in user preferences")
    return
  }

  console.log("[audio] loading")

  try {
    await ensureAmbientAudioMode()

    const created = await Audio.Sound.createAsync(
      SESSION_AMBIENCE,
      {
        shouldPlay: true,
        volume: TARGET_VOLUME,
        isLooping: true,
        isMuted: false,
      },
      (status) => {
        if (!status.isLoaded && "error" in status && status.error) {
          console.warn("[audio] playback status error:", status.error)
        }
      }
    )

    const sound = created.sound
    rootAmbientSound = sound

    await sound.setIsMutedAsync(false)
    await sound.setVolumeAsync(TARGET_VOLUME)

    console.log("[audio] playAsync called")
    await sound.playAsync()

    const after = await sound.getStatusAsync()
    if (!after.isLoaded) {
      throw new Error("[audio] sound failed to load — status not loaded after playAsync")
    }

    console.log("[audio] success")
  } catch (error) {
    console.warn("[audio] error", error)
    if (rootAmbientSound) {
      try {
        await rootAmbientSound.unloadAsync()
      } catch (unloadErr) {
        console.warn("[audio] unload after failed start:", unloadErr)
      }
      rootAmbientSound = null
    }
    throw error
  }
}

export async function stopRootAmbientPlayback(): Promise<void> {
  const sound = rootAmbientSound
  if (!sound) return
  rootAmbientSound = null
  try {
    await sound.stopAsync()
  } catch (e) {
    console.warn("[audio] stopAsync error:", e)
  }
  try {
    await sound.unloadAsync()
  } catch (e) {
    console.warn("[audio] unloadAsync error:", e)
  }
}
