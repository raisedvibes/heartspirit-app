"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import TranslucentCard from "@/components/ui/translucent-card"
import PracticeTimer from "@/components/practice/practice-timer"
import practices from "@/data/practices.json"
import type { Practice } from "@/types/practice"
import { ArrowLeft } from "lucide-react"
import { BottomNav } from "@/components/layout/bottom-nav"

function splitTitleAndDescription(title: string) {
  const [main, ...rest] = title.split(" - ")
  return { mainTitle: main.trim(), description: rest.join(" - ").trim() || "" }
}

function cleanStep(text: string) {
  return text.replace(/^\s*\d+[.)]\s*/, "")
}

export default function PracticePage() {
  const params = useParams()
  const router = useRouter()
  const practiceId = params.id as string

  const practice: Practice | undefined = (practices as any[]).find((p) => p.id === practiceId)

  if (!practice) {
    return (
      <>
        <main className="app-main max-w-6xl mx-auto px-4 pb-24">
          <div className="mx-auto w-full max-w-2xl py-6 sm:py-8">
            <TranslucentCard className="p-6 text-center">
              <h1 className="text-xl font-semibold mb-4 text-card-foreground">Practice Not Found</h1>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="bg-transparent border-white/40 hover:border-accent/60"
              >
                Back to Dashboard
              </Button>
            </TranslucentCard>
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="mb-6 bg-transparent border-white/40 hover:border-accent/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <TranslucentCard className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 border border-white/30 px-2 py-1 text-xs text-card-foreground font-medium">
                  {practice.category}
                </span>
                <span className="text-sm text-muted-foreground">{practice.duration} min</span>
              </div>

              <h1 className="text-2xl font-bold text-card-foreground">{mainTitle}</h1>
              {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}

              <div className="space-y-3">
                {practice.steps?.map((step: any, index: number) => {
                  const raw = typeof step === "string" ? step : (step?.description ?? "")
                  if (!raw) return null
                  const text = cleanStep(raw)

                  return (
                    <div key={index} className="flex gap-3 p-3 rounded-lg bg-white/10 border border-white/20">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground text-sm flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-card-foreground/90">{text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pt-4 border-t border-white/20">
                <PracticeTimer duration={practice.duration} />
              </div>
            </div>
          </TranslucentCard>
        </div>
      </main>

      <BottomNav />
    </>
  )
}
