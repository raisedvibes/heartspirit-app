"use client"

import { useState } from "react"

export function useVoicePortal() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  async function speak(text: string, extras?: { energyLevel?: number; meta?: any }) {
    try {
      setIsSpeaking(true)
      console.log("[v0] Calling /api/speak with text:", text)

      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ...extras }),
      })

      const ct = res.headers.get("Content-Type") || ""
      console.log("[v0] Response status:", res.status, "Content-Type:", ct)

      if (!res.ok || !ct.startsWith("audio/")) {
        console.error("[v0] API returned non-audio response")

        // Try to parse as JSON error first
        let errorMessage = `Request failed with status ${res.status}`
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
          console.error("[v0] JSON error:", errorData)
        } catch {
          // If not JSON, try to get text
          const bodyText = await res.text().catch(() => "")
          if (bodyText) errorMessage = bodyText
          console.error("[v0] Text error:", bodyText)
        }

        throw new Error(errorMessage)
      }

      console.log("[v0] Creating audio blob from response")
      const blob = await res.blob()
      console.log("[v0] Blob size:", blob.size, "type:", blob.type)

      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audio.onerror = (e) => {
        console.error("[v0] Audio playback error:", e)
        URL.revokeObjectURL(url)
      }

      audio.onended = () => {
        console.log("[v0] Audio playback completed")
        URL.revokeObjectURL(url)
      }

      console.log("[v0] Starting audio playback")
      await audio.play()
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      console.error("[v0] Voice portal error:", errorMsg)
      alert(`Voice error: ${errorMsg}`)
    } finally {
      setIsSpeaking(false)
    }
  }

  return {
    speak,
    isSpeaking,
  }
}
