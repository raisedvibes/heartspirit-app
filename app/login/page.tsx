"use client"

import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Added: nicer messaging for unconfirmed email state
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeEmail, setNoticeEmail] = useState<string>("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setNotice(null)
    setNoticeEmail("")

    const email = formData.email.trim()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: formData.password,
    })

    setIsLoading(false)

    if (error) {
      console.log("LOGIN ERROR:", error)

      // ✅ Guard: common case when email confirmations are enabled
      const msg = (error.message || "").toLowerCase()
      if (
        msg.includes("email") &&
        (msg.includes("confirm") || msg.includes("confirmed") || msg.includes("verify") || msg.includes("verification"))
      ) {
        setNoticeEmail(email)
        setNotice("Your portal isn’t activated yet. Confirm your email, then sign in.")
        return
      }

      setError(error.message)
      return
    }

    // ✅ Extra guard: if a session exists but email isn't confirmed (rare, but safe)
    const user = data?.user
    if (user && !user.email_confirmed_at) {
      await supabase.auth.signOut()
      setNoticeEmail(email)
      setNotice("Your portal isn’t activated yet. Confirm your email, then sign in.")
      return
    }

    window.location.href = "/dashboard"
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source
          src="https://tajqnuta9fwavw6h.public.blob.vercel-storage.com/desktop.heartspirit.mp4"
          type="video/mp4"
          media="(min-width: 769px)"
        />
        <source
          src="https://tajqnuta9fwavw6h.public.blob.vercel-storage.com/mobilevideo.heartspirit.mp4"
          type="video/mp4"
          media="(max-width: 768px)"
        />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Header */}
      <div className="absolute top-6 left-6 z-20 text-white">
        <h1 className="text-xl font-semibold tracking-wide">heartspirit</h1>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-sm mx-auto pt-10"
      >
        <Card className="p-6 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg text-white">
          <div className="space-y-6 text-white">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-wide">Enter Your Portal</h1>
            </div>

            {/* ✅ Notice (activation guidance) */}
            {notice && (
              <div className="rounded-xl border border-white/20 bg-white/10 p-4 text-sm text-white/80 space-y-2">
                <p>{notice}</p>
                {noticeEmail && <p className="text-xs text-white/60">Email: {noticeEmail}</p>}
                <p className="text-xs text-white/60">
                  If you don’t see the message, check spam/promotions.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm text-white/80">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm text-white/80">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pr-10 bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full w-10 p-0 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-white/60" />
                    ) : (
                      <Eye className="w-4 h-4 text-white/60" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-white/70 hover:text-white/90 underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-400">{error}</p>}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-white py-6 text-base font-semibold rounded-xl"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Sign Up */}
            <div className="text-center">
              <span className="text-sm text-white/70">Don&apos;t have an account? </span>
              <Link
                href="/signup"
                className="text-sm text-white/70 hover:text-white/90 underline-offset-4 hover:underline"
              >
                Create account
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
