"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, ArrowLeft } from "lucide-react"
import mantras from "@/data/mantras.json"

export default function WordPage() {
  const todayISO = new Date().toISOString().slice(0, 10)
  const todayMantra = mantras.find((m) => m.date === todayISO)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5 max-w-full overflow-x-hidden">
      <Navigation />
      <main className="app-main max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          {/* Back link should match muted-foreground (gray) not white */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Card className="p-6 bg-card rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageSqaure className="w-5 h-5 text-accent" />
              {/* Headings use card-foreground */}
              <h3 className="text-base font-semibold text-card-foreground">Word</h3>
            </div>

            <CardContent className="p-0">
              {/* Body text uses muted-foreground */}
              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line italic">
                {todayMantra
                  ? `“${todayMantra.text}”`
                  : "No mantra available for today. Check back tomorrow or update your list."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
