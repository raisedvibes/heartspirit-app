"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Heart, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 🎥 Video Background */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/283015_small-8jDnrzEeL7dNYzMKF9NBoGZn8bJtYC.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center flex-1 px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto space-y-8"
        >
          {/* Logo/Brand */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-2xl"
          >
            heartspirit
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/90 leading-relaxed drop-shadow-lg"
          >
            Your portal to energy alignment.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <div className="flex flex-col items-center space-y-2 text-white">
              <Sparkles className="w-8 h-8" />
              <h3 className="font-semibold">Daily Rituals</h3>
              <p className="text-sm text-white/80">{""}</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-white">
              <Heart className="w-8 h-8" />
              <h3 className="font-semibold">Energy Tracking</h3>
              <p className="text-sm text-white/80">{""}</p>
            </div>
            <div className="flex flex-col items-center space-y-2 text-white">
              <Users className="w-8 h-8" />
              <h3 className="font-semibold">Community Circles</h3>
              <p className="text-sm text-white/80">{""}</p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-6 text-lg font-semibold shadow-xl"
              >
                Begin Your Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg font-semibold shadow-xl"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
