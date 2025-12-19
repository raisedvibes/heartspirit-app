"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import PracticeTimer from "@/components/practice/practice-timer"
import practices from "@/data/practices.json"
import type { Practice } from "@/types/practice"
import { ArrowLeft } from "lucide-react"
import { BottomNav } from "@/components/layout/bottom-nav"

// Helper: split "Title - Description" into parts
function splitTitleAndDescription(title: string) {
  const [main, ...rest] = title.split(" - ")
  return { mainTitle: main.trim(), description: rest.join(" - ").trim() || "" }
}

// Helper: remove any leading "1. ", "2) ", etc. from step text
function cleanStep(text: string) {
  return text.replace(/^\s*\d+[.)]\s*/, "")
}

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const practiceId = params.id as string

  // If your Practice type expects `description`, make it optional in the type:
  // type Practice = { id: string; title: string; description?: string; ... }
  const practice: Practice | undefined = (practices as any[]).find((p) => p.id === practiceId)

  if (!practice) {
    return (
      <>
        <main className="app-main max-w-6xl mx-auto px-4">
          <div className="mx-auto w-full max-w-2xl py-6 sm:py-8">
            <Card className="p-6 text-center">
              <h1 className="text-xl font-semibold mb-4">Practice Not Found</h1>
              <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            </Card>
          </div>
        </main>
        <BottomNav />
      </>
    )
  }

  const { mainTitle, description } = splitTitleAndDescription(practice.title)

  return (
    <>
      <main className="app-main max-w-6xl mx-auto px-4 pb-24">
        <div className="mx-auto w-full max-w-2xl py-6 sm:py-8">
          {/* Back button */}
          <Button variant="outline" size="icon" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Main card */}
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Category + duration */}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground font-medium">
                  {practice.category}
                </span>
                <span className="text-sm text-muted-foreground">{practice.duration} min</span>
              </div>

              {/* Title + description (derived from title) */}
              <h1 className="text-2xl font-bold">{mainTitle}</h1>
              {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}

              {/* Steps */}
              <div className="space-y-3">
                {practice.steps.map((step: any, index: number) => {
                  const raw = typeof step === "string" ? step : (step?.description ?? "")
                  if (!raw) return null
                  const text = cleanStep(raw)
                  return (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Timer only */}
              <div className="pt-4 border-t">
                <PracticeTimer duration={practice.duration} />
              </div>
            </div>
          </Card>
        </div>
      </main>

      <BottomNav />
    </>
  )
}
