import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabaseServer"
import { getOrCreateSessionId } from "@/lib/session"
import { classifyIntent } from "@/lib/brain"
import { findRecommendedPractice } from "@/lib/findPractice"

export const runtime = "nodejs"

type SpeakBody = {
  text: string
  energyLevel?: number // optional, 1-4 from your UI if you want
  meta?: Record<string, any>
  isGreeting?: boolean // Flag to indicate this is just a greeting, not a practice request
}

// ElevenLabs Text-to-Speech
async function ttsElevenLabs(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY!
  const voiceId = process.env.ELEVENLABS_VOICE_ID!

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`

  console.log("[v0] ElevenLabs request URL:", url)
  console.log("[v0] Voice ID:", voiceId)
  console.log("[v0] API Key present:", !!apiKey)

  const payload = {
    text,
    model_id: "eleven_turbo_v2_5", // safe default; update if you prefer
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.2,
      use_speaker_boost: true,
    },
  }

  console.log("[v0] Sending TTS request with text:", text.substring(0, 50))

  // ✅ single fetch request only
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(payload),
  })

  // 🌿 Debug log
  console.log("[v0] TTS response status:", res.status)
  console.log("[v0] TTS response Content-Type:", res.headers.get("Content-Type"))

  if (!res.ok) {
    const err = await res.text().catch(() => "")
    console.error("[v0] ElevenLabs error response:", err)
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${err}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  console.log("[v0] Audio buffer size:", buffer.length, "bytes")
  return buffer
}

// Main API route
export async function POST(req: NextRequest) {
  console.log("[v0] /api/speak POST request received")

  try {
    const body = (await req.json()) as SpeakBody
    const text = (body?.text || "").trim()
    console.log("[v0] Request text:", text)

    if (!text) {
      return NextResponse.json({ error: "Missing 'text'." }, { status: 400 })
    }

    if (body?.isGreeting) {
      console.log("[v0] Greeting request detected, skipping practice logic")
      const audio = await ttsElevenLabs(text)
      console.log("[v0] Greeting audio generated, size:", audio.length)

      return new NextResponse(audio, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(audio.length),
          "X-Transcript": encodeURIComponent(text),
          "Cache-Control": "no-store",
        },
      })
    }

    const sessionId = await getOrCreateSessionId()
    const intent = classifyIntent(text)
    console.log("[v0] Session ID:", sessionId, "Intent:", intent)

    const supa = await supabaseServer()

    // Store user message
    console.log("[v0] Storing user message in Supabase...")
    const { data: userMsg, error: userErr } = await supa
      .from("messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: text,
        intent,
        meta: body?.meta ?? null,
        energy_level: body?.energyLevel ?? null,
      })
      .select()
      .single()

    if (userErr) {
      console.error("[v0] Supabase user message insert error:", userErr)
      throw userErr
    }
    console.log("[v0] User message stored, ID:", userMsg.id)

    // For now, we'll use the intent classifier, but this should be enhanced
    // to extract energy/feeling from the user's actual words
    const energy = intent.energy || "Moderate"
    const feelingtone = intent.feeling || "Neutral"
    console.log("[v0] Extracted - Energy:", energy, "Feeling:", feelingtone)

    // Look up best matching practice
    console.log("[v0] Finding recommended practice...")
    const practice = await findRecommendedPractice(energy, feelingtone)
    console.log("[v0] Recommended practice:", practice?.title || "none")

    let reply: string
    if (practice) {
      reply = `Let's practice ${practice.title}. ${practice.description}`
    } else {
      reply = "I hear you. Let's take a moment to center ourselves with some gentle breathing."
    }
    console.log("[v0] Reply text:", reply.substring(0, 50))

    // Generate audio
    console.log("[v0] Calling ElevenLabs TTS...")
    const audio = await ttsElevenLabs(reply)
    console.log("[v0] Audio generated successfully, size:", audio.length)

    // Store assistant message
    console.log("[v0] Storing assistant message in Supabase...")
    const { error: asstErr } = await supa.from("messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: reply,
      intent,
      reply_to_id: userMsg.id,
    })
    if (asstErr) {
      console.error("[v0] Supabase assistant message insert error:", asstErr)
      console.error("[v0] Warning: Failed to store assistant message, but continuing with audio response")
    } else {
      console.log("[v0] Assistant message stored successfully")
    }

    // Return audio to client
    console.log("[v0] Returning audio/mpeg response")
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "X-Transcript": encodeURIComponent(reply),
        "Cache-Control": "no-store",
      },
    })
  } catch (e: any) {
    console.error("[v0] API /api/speak error:", e)
    console.error("[v0] Error stack:", e?.stack)
    return new NextResponse(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "X-Error": e?.message ?? "Unknown error",
      },
    })
  }
}
