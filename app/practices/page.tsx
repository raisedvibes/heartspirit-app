"use client"

import { motion } from "framer-motion"
import { PracticeCard } from "@/components/practice/practice-card"
import practicesData from "@/data/practices.json"
import type { Practice } from "@/types/practice"
import { Navigation } from "@/components/layout/navigation"
import { BottomNav } from "@/components/layout/bottom-nav"

const practices = practicesData as Practice[]

export default function PracticesPage() {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4 pb-24 md:pb-28">
        <div className="mx-auto w-full max-w-4xl pt-10 pb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Practice Library</h1>
            <p className="text-muted-foreground">
              Discover guided practices to support your system—one step at a time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {practices.map((practice, index) => (
              <motion.div
                key={practice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
              >
                <PracticeCard practice={practice} />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
