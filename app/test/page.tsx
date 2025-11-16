"use client"
import { useState } from "react"

export default function TestPage() {
  const [text, setText] = useState("Welcome to HeartSpirit. How's your energy today?")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSpeak = async () => {
    setLoading(true)
    setAudioUrl(null)
    try {
      const res = await fetch(`${window.location.origin}/api/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-gradient-to-br from-emerald-50 to-green-100">
      <h1 className="text-2xl font-bold">🎙️ AI Voice Test</h1>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-80 border rounded p-2" />
      <button
        onClick={handleSpeak}
        disabled={loading}
        className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
      >
        {loading ? "Generating..." : "Speak"}
      </button>
      {audioUrl && <audio controls autoPlay src={audioUrl} className="mt-4" />}
    </div>
  )
}
