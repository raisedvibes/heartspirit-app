"use client"

import { Navigation } from "@/components/layout/navigation"
import TranslucentCard from "@/components/ui/translucent-card"

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <Navigation />

      <main className="app-main max-w-3xl mx-auto px-4 pb-24">
        <div className="space-y-4 pt-6">
          <TranslucentCard>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Terms of Use</h1>
                <p className="text-sm text-muted-foreground">
                  Effective date: January 26, 2026
                </p>
              </div>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">1) Acceptance of These Terms</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  By accessing or using Heartspirit (“the App”), you agree to these Terms of Use. If you do not
                  agree, do not use the App.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">2) Wellness Disclaimer</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Heartspirit provides educational and wellness content (such as breathwork, rituals, reflection prompts,
                  and guided practices). The App is not a medical service and does not provide medical advice,
                  diagnosis, or treatment.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Always consult a qualified healthcare professional regarding any medical condition. If you are
                  experiencing a medical emergency, call emergency services immediately.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">3) Eligibility</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You must be at least 13 years old to use the App.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">4) Your Account</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you create an account, you are responsible for maintaining its security and for all activity
                  under your account. You agree to provide accurate information.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">5) Acceptable Use</h2>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Do not use the App for unlawful purposes.</li>
                  <li>Do not attempt to reverse engineer, disrupt, or exploit the App.</li>
                  <li>Do not post abusive, harmful, or infringing content in community spaces.</li>
                  <li>Respect the privacy and wellbeing of other community members.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">6) Community Content (Circles)</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you post content to community areas, you understand it may be visible to other users. You are
                  responsible for what you share, including ensuring you do not post sensitive personal information
                  you do not want to be public.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We may remove content that violates these Terms or creates harm in the community.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">7) Intellectual Property</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The App and its content (including text, audio, video, design, and branding) are owned by Heartspirit
                  or its licensors and are protected by applicable laws. You may not copy or redistribute content
                  outside of personal use without written permission.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">8) Termination</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We may suspend or terminate access to the App if you violate these Terms or misuse the platform.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">9) Limitation of Liability</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To the fullest extent permitted by law, Heartspirit shall not be liable for indirect, incidental,
                  special, consequential, or punitive damages, or any loss of data, arising from your use of the App.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">10) Changes to These Terms</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We may update these Terms from time to time. Updated Terms will be posted on this page.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">11) Contact</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For questions about these Terms, contact:
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span>{" "}
                  <a className="underline" href="mailto:support@heartspirit.earth">
                    support@heartspirit.earth
                  </a>
                </p>
              </section>

              <p className="text-xs text-muted-foreground pt-2">
                Thank you for being part of Heartspirit. This is a space for grounded healing and respectful community.
              </p>
            </div>
          </TranslucentCard>
        </div>
      </main>
    </div>
  )
}
