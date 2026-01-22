"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type NextCircle = {
  id: string
  name: string
  description: string | null
  starts_at: string | null
  frequency: "Weekly" | "Monthly"
}

export function Circles() {
  const [nextCircle, setNextCircle] = useState<NextCircle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadNext = async () => {
      setLoading(true)

      const now = new Date().toISOString()

      const { data } = await supabase
        .from("circles")
        .select("id,name,description,starts_at,frequency")
        .eq("is_published", true)
        .not("starts_at", "is", null)
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle()

      setNextCircle(data ?? null)
      setLoading(false)
    }

    loadNext()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-card rounded-xl p-6 shadow-md border border-border/50 h-full flex flex-col"
    >
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-accent" />
          <h3 className="text-base font-semibold text-card-foreground">
            Circles
          </h3>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading upcoming circle…
          </p>
        ) : nextCircle ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-card-foreground">
              Next: {nextCircle.name}
            </p>

            {nextCircle.starts_at && (
              <p className="text-xs text-muted-foreground">
                {new Date(nextCircle.starts_at).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}{" "}
                • {nextCircle.frequency}
              </p>
            )}

            {nextCircle.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {nextCircle.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming circles scheduled.
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="mt-4 flex justify-end">
        <Link
          href="/circles"
          className="
            rounded-xl border border-white/30
            px-3 py-1.5 text-sm
            text-muted-foreground
            hover:bg-white/10 transition-all
          "
        >
          Learn more
        </Link>
      </div>
    </motion.div>
  )
}
