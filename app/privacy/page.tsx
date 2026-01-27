"use client"

import { Navigation } from "@/components/layout/navigation"
import TranslucentCard from "@/components/ui/translucent-card"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <Navigation />

      <main className="app-main max-w-3xl mx-auto px-4 pb-24">
        <div className="space-y-4 pt-6">
          <TranslucentCard>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Privacy Policy</h1>
                <p className="text-sm text-muted-foreground">
                  Effective date: January 26, 2026
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Heartspirit is built as a privacy-first wellness application. We collect only what is
                necessary to operate the service and provide support. Your private wellness content
                (like journal entries) is designed to remain on your device.
              </p>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">1) What We Collect</h2>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>
                    <span className="text-foreground/90 font-medium">Contact information:</span>{" "}
                    such as email (for account access and support).
                  </li>
                  <li>
                    <span className="text-foreground/90 font-medium">Community content (optional):</span>{" "}
                    if you choose to post in Circles (posts, comments, and related metadata).
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">2) What We Do Not Collect</h2>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Your private journal entries are not uploaded to our servers.</li>
                  <li>Your ritual history and check-ins are designed to remain on your device.</li>
                  <li>We do not sell personal data.</li>
                  <li>We do not run third-party ad tracking or data brokerage.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">3) How Your Data Is Stored</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Heartspirit uses a hybrid storage model:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>
                    <span className="text-foreground/90 font-medium">On-device storage:</span>{" "}
                    Journal entries, ritual completion, and personal reflections are stored locally
                    on your device.
                  </li>
                  <li>
                    <span className="text-foreground/90 font-medium">Server storage:</span>{" "}
                    App content (such as practices, audio/video media URLs, and app updates) are delivered
                    from our servers. If you participate in community features, your posts may be stored
                    so they can be displayed to others.
                  </li>
                </ul>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you delete the app, clear browser/app storage, or change devices, on-device data
                  may be permanently lost unless you export it.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">4) Analytics & Tracking</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We do not use third-party advertising trackers (such as ad pixels) to track you across
                  other apps or websites. If analytics are used in the future, we will update this policy
                  and provide clear options where required.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">5) How We Use Your Data</h2>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>To provide account access and service functionality</li>
                  <li>To respond to support requests</li>
                  <li>To provide community features you choose to use</li>
                  <li>To keep the platform safe and prevent misuse</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">6) Your Choices & Controls</h2>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>You can clear local history in the app settings.</li>
                  <li>You can export your local data from the app.</li>
                  <li>
                    If you use community features, you may request deletion of your posts by contacting support.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">7) Data Security</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We take reasonable measures to protect the platform. However, no method of storage or
                  transmission is 100% secure. You are responsible for maintaining the security of your
                  device and access to your account.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">8) Children’s Privacy</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Heartspirit is not intended for children under 13. If you believe a child has provided
                  us personal information, contact us and we will delete it.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-semibold">9) Contact Us</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you have questions or requests about privacy, contact:
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span>{" "}
                  <a className="underline" href="mailto:support@heartspirit.earth">
                    support@heartspirit.earth
                  </a>
                </p>
              </section>

              <p className="text-xs text-muted-foreground pt-2">
                We may update this policy as Heartspirit evolves. Updates will be posted on this page.
              </p>
            </div>
          </TranslucentCard>
        </div>
      </main>
    </div>
  )
}
