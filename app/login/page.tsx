"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// ✅ Create a Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    window.location.href = "/dashboard"
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* 🎥 Video Background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/283015_small-8jDnrzEeL7dNYzMKF9NBoGZn8bJtYC.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-sm mx-auto"
      >
        {/* Header */}
        <div className="flex items-center mb-8 text-white">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 mr-2 text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <span className="text-lg font-semibold">heartspirit</span>
        </div>

        {/* Login Form */}
        <Card className="p-6 bg-white/90 backdrop-blur-md border shadow-lg">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">{"Enter Your Portal"}</h1>
              <p className="text-muted-foreground">{""}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full w-10 p-0 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-accent hover:text-accent/80">
                  Forgot password?
                </Link>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-500">{error}</p>}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-base font-semibold"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full"
                  />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Sign Up */}
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Don't have an account? </span>
              <Link href="/signup" className="text-sm text-accent hover:text-accent/80 font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
