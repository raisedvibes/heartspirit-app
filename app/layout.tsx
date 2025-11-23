import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

import ScrollToTop from "./scroll-to-top"
import { BottomNav } from "@/components/layout/bottom-nav"

export const metadata: Metadata = {
  title: "HeartSpirit App",
  description: "Your wellness companion for energy tracking, journaling, and mindful practices",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-background bg-cover bg-center bg-fixed text-white">
        <Suspense fallback={<div className="min-h-screen" />}>
          <ScrollToTop />
        </Suspense>

        {/* 🌿 Global background — inherited by all pages */}
        <div className="min-h-screen">
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
              </div>
            }
          >
            {children}
          </Suspense>
        </div>

        {/* Bottom navigation (mobile-only) */}
        <BottomNav />

        {/* <Analytics /> */}
      </body>
    </html>
  )
  import { Alegreya_Sans } from "next/font/google";

const alegreya = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"], // pick what you need
  variable: "--font-alegreya"
});

export const metadata = {
  title: "Heartspirit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={alegreya.variable}>
      <body>{children}</body>
    </html>
  );
}

}
