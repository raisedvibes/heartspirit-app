"use client"

import { motion } from "framer-motion"
import { PracticeCard } from "@/components/practice/practice-card"
import practicesData from "@/data/practices.json"
import type { Practice } from "@/types/practice"

const practices = practicesData as Practice[]

export default function PracticesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <main className="app-main max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Practice Library</h1>
          <p className="text-muted-foreground">
            Discover guided practices to enhance your well-being and inner growth
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practices.map((practice, index) => (
            <motion.div
              key={practice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <PracticeCard practice={practice} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
