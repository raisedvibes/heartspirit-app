"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CircleCard } from "@/components/circles/circle-card"
import { createClient } from "@/lib/supabase/client"

type CircleRow = {
  id: string
  name: string
  description: string | null
  frequency: string | null
  image_url: string | null
  tags: string[] | null
  is_published: boolean
  starts_at: string | null
  join_url: string | null
  created_at: string
  updated_at: string
}

export default function CirclesPage() {
  const [circles, setCircles] = useState<CircleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      setLoading(true)
      setLoadError(null)

      const { data, error } = await supabase
        .from("circles")
        .select("id,name,description,frequency,image_url,tags,is_published,starts_at,payment_url,created_at,updated_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })

      if (error) {
        setLoadError(error.message)
        setCircles([])
      } else {
        const rows = (data ?? []) as Record<string, unknown>[]
        setCircles(
          rows.map(({ payment_url, ...rest }) => ({
            ...(rest as Omit<CircleRow, "join_url">),
            join_url: typeof payment_url === "string" ? payment_url : null,
          }))
        )
      }

      setLoading(false)
    }

    load()
  }, [])

  const hasCircles = useMemo(() => circles.length > 0, [circles])

  const handleJoin = (circle: CircleRow) => {
    const url = circle.join_url?.trim()
    if (!url) {
      alert("Circle link isn’t set yet for this circle. Please check back soon.")
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6 w-full pt-4">
            <Link href="/dashboard" className="shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl bg-black/25 border border-white/25 text-white hover:bg-black/35 hover:text-white shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] backdrop-blur-md"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Circles */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            {loading ? (
              <div className="text-sm text-white/70">Loading circles…</div>
            ) : loadError ? (
              <div className="text-sm text-white/70">
                <div className="font-medium text-white">Couldn’t load circles</div>
                <div className="mt-1">{loadError}</div>
              </div>
            ) : hasCircles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {circles.map((circle, index) => (
                  <motion.div
                    key={circle.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * index, duration: 0.45 }}
                  >
                    <CircleCard
                      circle={{
                        id: circle.id,
                        name: circle.name,
                        description: circle.description ?? "",
                        frequency: circle.frequency ?? "",
                        image: circle.image_url ?? "/placeholder.svg",
                        tags: circle.tags ?? [],
                      }}
                      isJoined={false}
                      onJoin={() => handleJoin(circle)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-white/20 border border-white/30 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white/80" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No circles found</h3>
                <p className="text-white/70">No circles yet. Check back soon.</p>
              </motion.div>
            )}
          </motion.section>
        </motion.div>
      </main>
    </div>
  )
}
