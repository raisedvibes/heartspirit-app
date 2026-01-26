"use client"

import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import TranslucentCard from "@/components/ui/translucent-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Bug, ShieldCheck, FileText } from "lucide-react"

export default function SupportPage() {
  const mailto = "mailto:support@heartspirit.earth?subject=Heartspirit%20Support%20Request"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <Navigation />

      <main className="app-main max-w-3xl mx-auto px-4 pb-24">
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-3 px-1">
            <Link href="/settings">
              <Button variant="ghost" size="icon" aria-label="Back to settings">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Support</h1>
          </div>

          <TranslucentCard>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">Need help?</h2>
                <p className="text-sm text-muted-foreground">
                  Email us and we’ll get back to you. If something feels urgent or medical, please contact a licensed
                  professional or emergency services.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full justify-start bg-accent hover:bg-accent text-accent-foreground"
                  onClick={() => {
                    window.location.href = mailto
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => {
                    window.location.href =
                      "mailto:support@heartspirit.earth?subject=Bug%20Report%20(Heartspirit)&body=What%20happened%3F%0A%0ASteps%20to%20reproduce%3A%0A1.%20%0A2.%20%0A%0AWhat%20did%20you%20expect%20to%20happen%3F%0A%0ADevice%2FBrowser%3A%0A"
                  }}
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report a Bug
                </Button>
              </div>

              <div className="rounded-lg border border-border/30 bg-background/25 p-4 space-y-2">
                <h3 className="text-sm font-semibold">Quick answers</h3>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Where is my journal saved?</p>
                  <p className="text-sm text-muted-foreground">
                    Your journal and personal history are stored locally on your device. If you delete the app or clear
                    storage, that data may be lost unless you export it first.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">Can you recover my journal?</p>
                  <p className="text-sm text-muted-foreground">
                    Since journal entries stay on your device, we generally can’t recover them. Exporting your data is
                    the best way to keep a backup.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">What data do you keep?</p>
                  <p className="text-sm text-muted-foreground">
                    We keep only what’s needed for account access and support (like your email). Practices/content are
                    delivered from our servers. Community posts are stored only if you choose to post.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link href="/privacy" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                </Link>

                <Link href="/terms" className="block">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Terms of Use
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground">
                Support email:{" "}
                <a className="underline" href="mailto:support@heartspirit.earth">
                  support@heartspirit.earth
                </a>
              </p>
            </div>
          </TranslucentCard>
        </div>
      </main>
    </div>
  )
}
