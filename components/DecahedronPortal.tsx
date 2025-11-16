"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import * as THREE from "three"
import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

export function DecahedronPortal() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [statusText, setStatusText] = useState("Tap to speak")
  const [userName, setUserName] = useState("friend")
  const recognitionRef = useRef<any>(null)
  const listeningTimeoutRef = useRef<any>(null)
  const cooldownRef = useRef(false)

  // 🔹 Load user for greeting
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const name = user.user_metadata?.name || user.email?.split("@")[0] || "friend"
        setUserName(name)
        console.log("[v0] User loaded:", name)
      }
    }
    fetchUser()
  }, [])

  // 🔹 Setup speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onstart = () => {
        console.log("🎙️ Listening...")
        setIsListening(true)
        setStatusText("Listening...")
        listeningTimeoutRef.current = setTimeout(() => {
          stopListening()
          setStatusText("Tap to speak")
        }, 10000)
      }

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log("🧠 Transcript:", transcript)
        setStatusText("Processing...")
        stopListening()
        await speakResponse(transcript)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("[v0] Speech recognition error:", event.error)
        setStatusText("Error - Tap to retry")
        stopListening()
      }

      recognitionRef.current.onend = () => setIsListening(false)
    }

    return () => {
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current)
    }
  }, [])

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log("[v0] Recognition already stopped")
      }
    }
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current)
      listeningTimeoutRef.current = null
    }
    setIsListening(false)
  }

  // 🔹 Speak greeting → listen
  async function speakQuestion() {
    try {
      const greetingText = `How’s your energy, ${userName}?`
      setIsSpeaking(true)
      setStatusText("Speaking...")

      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: greetingText, isGreeting: true }),
      })
      if (!res.ok) throw new Error(`Voice API failed: ${res.status}`)

      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)

      audio.onerror = (e) => {
        console.error("[v0] Audio playback error (greeting):", e)
        setIsSpeaking(false)
        setStatusText("Error - Tap to retry")
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        setIsSpeaking(false)
        setStatusText("Listening...")
        setTimeout(() => {
          try {
            recognitionRef.current.start()
          } catch (e) {
            console.error("[v0] Failed to start recognition:", e)
            setStatusText("Error - Tap to retry")
          }
        }, 300)
      }

      await audio.play()
    } catch (err) {
      console.error("[v0] Voice playback failed:", err)
      setIsSpeaking(false)
      setStatusText("Error - Tap to retry")
    }
  }

  // 🔹 Speak response
  async function speakResponse(userInput: string) {
    try {
      setIsSpeaking(true)
      setStatusText("Speaking...")

      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userInput }),
      })
      if (!res.ok) throw new Error(`Voice API failed: ${res.status}`)

      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)
      const transcript = decodeURIComponent(res.headers.get("X-Transcript") || "")
      console.log("[v0] Response:", transcript)

      const audio = new Audio(audioUrl)
      audio.onerror = (e) => {
        console.error("[v0] Audio playback error (response):", e)
        setIsSpeaking(false)
        setStatusText("Error - Tap to retry")
      }

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        setIsSpeaking(false)
        cooldownRef.current = true
        setStatusText("Processing...")
        setTimeout(() => {
          cooldownRef.current = false
          setStatusText("Tap to speak")
        }, 1000)
      }

      await audio.play()
    } catch (err) {
      console.error("[v0] Voice playback failed:", err)
      setIsSpeaking(false)
      setStatusText("Error - Tap to retry")
    }
  }

  const handleClick = async () => {
    if (cooldownRef.current || isSpeaking) return
    if (isListening) {
      stopListening()
      setStatusText("Tap to speak")
    } else {
      if (!recognitionRef.current) {
        alert("Speech Recognition is not supported in your browser")
        return
      }
      await speakQuestion()
    }
  }

  return (
    <div className="relative w-full h-[420px] flex items-center justify-center overflow-hidden bg-transparent">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 60 }}>
        <ambientLight intensity={0.65} color="#fff2d6" />
        <pointLight position={[3, 3, 3]} intensity={1.3} color="#ffdf91" />
        <pointLight position={[-3, -2, -5]} intensity={0.9} color="#a87435" />
        <EarthGoldOrb onClick={handleClick} isListening={isListening} isSpeaking={isSpeaking} />
        <Stars radius={80} depth={40} count={1000} factor={2.2} fade speed={0.3} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
      </Canvas>

      <motion.div
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        animate={{
          opacity: isListening ? [1, 0.7, 1] : isSpeaking ? [1, 0.6, 1] : [0.8, 1, 0.8],
          y: isListening ? [0, -5, 0] : isSpeaking ? [0, -6, 0] : [0, -4, 0],
        }}
        transition={{ duration: isListening ? 2 : 3.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="absolute text-amber-200 text-lg font-semibold tracking-wide cursor-pointer select-none drop-shadow-[0_0_10px_rgba(255,213,140,0.8)]"
      >
        {statusText}
      </motion.div>
    </div>
  )
}

// 🌎 Earth-Gold Orb
function EarthGoldOrb({
  onClick,
  isListening,
  isSpeaking,
}: { onClick?: () => void; isListening?: boolean; isSpeaking?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    meshRef.current.rotation.x = Math.sin(t * 0.4) * 0.4
    meshRef.current.rotation.y = t * 0.5

    if (matRef.current) {
      const baseHue = isListening ? 0.15 : 0.1
      const hue = baseHue + Math.sin(t * 0.25) * 0.01
      const saturation = isListening || isSpeaking ? 0.75 : 0.65
      const color = new THREE.Color().setHSL(hue, saturation, 0.45)
      matRef.current.color.copy(color)
      const emissiveIntensity = isListening || isSpeaking ? 1.0 : 0.8
      matRef.current.emissive.copy(color).multiplyScalar(emissiveIntensity + Math.sin(t * 2) * 0.25)
    }
  })

  return (
    <mesh ref={meshRef} geometry={new THREE.SphereGeometry(1.25, 128, 128)} onClick={onClick}>
      <meshPhysicalMaterial
        ref={matRef}
        transmission={0.85}
        roughness={0.15}
        metalness={0.7}
        thickness={0.9}
        clearcoat={0.9}
        clearcoatRoughness={0.2}
        iridescence={0.2}
        envMapIntensity={1.2}
      />
    </mesh>
  )
}
