"use client"

import { motion } from "framer-motion"
import { Navigation } from "@/components/layout/navigation"

const practices = [
  { id: 1, title: "Focused Breath Awareness", duration: "5 min" },
  { id: 3, title: "Heart Coherence", duration: "7 min" },
  { id: 4, title: "Grounding Visualization", duration: "5 min" },
  { id: 5, title: "Nadi Shodhana", duration: "4 min" },
  { id: 6, title: "Stillness Check-In", duration: "3 min" },
]

export default function EnergyPage() {
  return (
    <div className="flex flex-col min-h-screen max-w-full overflow-hidden">
      <Navigation />

      <main className="flex-1 flex items-start justify-center px-3 pt-16 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md lg:max-w-2xl"
        >
          {/* Gradient-matched translucent container */}
          <div className="p-4 bg-white/20 backdrop-blur-md shadow-md rounded-2xl border border-white/30">
            <div className="flex flex-col gap-3">
              {practices.map((p) => (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full text-left p-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 shadow-inner transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-base text-white">{p.title}</span>
                    <span className="text-sm text-white/70">{p.duration}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
