"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Eye, EyeOff, Leaf, Check } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match")
      return
    }
    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms and Privacy Policy")
      return
    }

    setIsLoading(true)
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.name } },
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    window.location.href = "/dashboard"
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const strength = passwordStrength(formData.password)

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      {/* Video Background */}
      <video autoPlay loop muted playsInline preload="auto" className="absolute inset-0 w-full h-full object-cover z-0">
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

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 w-full max-w-sm mx-auto"
      >
        {/* Header */}
        <div className="flex items-center mb-10 text-white">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0 mr-4 text-white hover:bg-white/10 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-3">
          
            <h1 className="text-xl font-semibold tracking-wide">heartspirit</h1>
          </div>
        </div>

        {/* Signup Card */}
        <Card className="p-6 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-lg text-white">
          <div className="space-y-6 text-white">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-wide">Create Account</h1>
              <p className="text-white/70">Start today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm text-white/80">Full Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
              </div>

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
                    placeholder="Create a password"
                    className="pr-10 bg-white/10 border-white/20 text-white placeholder-white/50"
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
                      <EyeOff className="w-4 h-4 text-white/60" />
                    ) : (
                      <Eye className="w-4 h-4 text-white/60" />
                    )}
                  </Button>
                </div>

                {/* Strength Bar */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strength >= level ? "bg-accent" : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-white/70">
                      <div className={`flex items-center ${formData.password.length >= 8 ? "text-accent" : ""}`}>
                        <Check className="w-3 h-3 mr-1" />
                        8+ characters
                      </div>
                      <div className={`flex items-center ${/[A-Z]/.test(formData.password) ? "text-accent" : ""}`}>
                        <Check className="w-3 h-3 mr-1" />
                        Uppercase
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm text-white/80">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="Confirm your password"
                    className="pr-10 bg-white/10 border-white/20 text-white placeholder-white/50"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full w-10 p-0 hover:bg-transparent"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-white/60" />
                    ) : (
                      <Eye className="w-4 h-4 text-white/60" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  className="mt-1 border-white/40 data-[state=checked]:bg-accent"
                />
                <label htmlFor="terms" className="text-sm text-white/70 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-accent hover:text-accent/80">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-accent hover:text-accent/80">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Error */}
              {error && <p className="text-sm text-red-400">{error}</p>}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !formData.agreeToTerms}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-6 text-base font-semibold disabled:opacity-50 rounded-xl"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full"
                  />
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center">
              <span className="text-sm text-white/70">Already have an account? </span>
              <Link href="/login" className="text-sm text-accent hover:text-accent/80 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
