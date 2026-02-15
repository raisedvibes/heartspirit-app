import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { JetBrains_Mono } from "next/font/google"
import { Alegreya_Sans } from "next/font/google"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

import ScrollToTop from "./scroll-to-top"
import { BottomNav } from "@/components/layout/bottom-nav"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

const alegreyaSans = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-alegreya",
})

export const metadata: Metadata = {
  title: "HeartSpirit App",
  description: "Your wellness companion for energy tracking, journaling, and mindful practices",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${alegreyaSans.variable}`}>
      {/* Source of truth: background + default text color live here */}
      <body className="font-sans antialiased min-h-screen bg-background bg-cover bg-center bg-fixed text-white">
        <Suspense fallback={<div className="min-h-screen" />}>
          <ScrollToTop />
        </Suspense>

        {/* App content */}
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-pulse text-white/70">Loading...</div>
            </div>
          }
        >
          {children}
        </Suspense>

        {/* Bottom navigation (mobile-only) */}
        <BottomNav />

        {/* <Analytics /> */}
      </body>
    </html>
  )
}
