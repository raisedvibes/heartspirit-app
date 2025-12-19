"use client"
import { useState } from "react"

export default function TestVoice() {
  const [loading, setLoading] = useState(false)

  async function testVoice() {
    setLoading(true)
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Testing voice connection" }),
    })
    console.log("Status:", res.status, "Type:", res.headers.get("Content-Type"))
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      new Audio(url).play()
    } else {
      console.error(await res.text())
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <button
        onClick={testVoice}
        disabled={loading}
        className="px-6 py-3 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700"
      >
        {loading ? "Testing..." : "Test Voice Connection"}
      </button>
    </div>
  )
}
