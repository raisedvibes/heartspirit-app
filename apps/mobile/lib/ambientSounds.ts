import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av"
import AsyncStorage from "@react-native-async-storage/async-storage"

const AMBIENT_SOUNDS_ENABLED_KEY = "heartspirit.ambient_sounds.enabled"

const STARTUP_AMBIENCE = require("../assets/audio/Forest-creek-noise-and-singing-birds-relaxing-nature-sounds.mp3")
const TARGET_VOLUME = 0.32
const FADE_IN_MS = 500
const FADE_OUT_AFTER_MS = 4000
const FADE_OUT_MS = 900

let startupPlayInFlight = false

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

export async function playStartupAmbienceIfNeeded(): Promise<void> {
  if (startupPlayInFlight) return

  const enabled = await getAmbientSoundsEnabled()
  if (!enabled) return

  startupPlayInFlight = true
  let sound: Audio.Sound | null = null

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    })

    const created = await Audio.Sound.createAsync(
      STARTUP_AMBIENCE,
      { shouldPlay: false, volume: 0, isLooping: false }
    )
    sound = created.sound

    await sound.playAsync()
    await fadeVolume(sound, 0, TARGET_VOLUME, FADE_IN_MS)

    await new Promise((resolve) => setTimeout(resolve, FADE_OUT_AFTER_MS))
    await fadeVolume(sound, TARGET_VOLUME, 0, FADE_OUT_MS)
    await sound.stopAsync()
  } catch (error) {
    console.log("[ambient] startup ambience failed", error)
  } finally {
    if (sound) {
      try {
        await sound.unloadAsync()
      } catch {}
    }
    startupPlayInFlight = false
  }
}
