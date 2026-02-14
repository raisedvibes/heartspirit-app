"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import TranslucentCard from "@/components/ui/translucent-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  HelpCircle,
  Edit,
  Download,
  Trash2,
  ChevronDown,
} from "lucide-react"

const supabase = createClient()

export default function SettingsPage() {

  const [dailyCheckIn, setDailyCheckIn] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [communityCircles, setCommunityCircles] = useState(false)
  const [checkInTime, setCheckInTime] = useState("09:00")
  const [saveHistoryOnDevice, setSaveHistoryOnDevice] = useState(true)

  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name: string; email: string }>({ full_name: "", email: "" })

  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [saveProfileLoading, setSaveProfileLoading] = useState(false)

  const [openSections, setOpenSections] = useState({
    profile: false,
    notifications: false,
    privacy: false,
    support: false,
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true)
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user
        if (!user) return

        const fallbackEmail = user.email ?? ""

        const { data } = await supabase
          .from("profiles")
          .select("full_name,email")
          .eq("id", user.id)
          .maybeSingle()

        setProfile({
          full_name: data?.full_name ?? "",
          email: data?.email ?? fallbackEmail,
        })
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // 🔹 EXACT VISUAL MATCH to back arrow hover
  // keeps transparent base, but same glow feel
  const glassHover =
    [
      "ring-1 ring-transparent",
      "hover:bg-black/35 hover:text-white",
      "hover:ring-white/25",
      "hover:shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)]",
      "hover:backdrop-blur-md",
      "transition-colors",
    ].join(" ")

  const SectionHeader = ({
    section,
    icon: Icon,
    title,
  }: {
    section: keyof typeof openSections
    icon: React.ElementType
    title: string
  }) => (
    <button onClick={() => toggleSection(section)} className="w-full p-2">
      <div className={`flex items-center justify-between rounded-xl px-3 py-3 ${glassHover}`}>
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${openSections[section] ? "rotate-180" : ""}`} />
      </div>
    </button>
  )

  return (
    <div className="min-h-screen text-white">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4">
        <div className="space-y-4">

          {/* Back arrow */}
          <div className="flex items-center mb-6 pt-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl bg-black/25 border border-white/25 text-white hover:bg-black/35 hover:text-white shadow-[0_12px_40px_-26px_rgba(0,0,0,0.8)] backdrop-blur-md"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Profile */}
          <TranslucentCard>
            <SectionHeader section="profile" icon={User} title="Profile & Contact" />
            <div className={`overflow-hidden transition-all ${openSections.profile ? "max-h-[700px]" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-3">
                {!editingProfile ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {profileLoading ? "Loading..." : profile.full_name || "Your name"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {profile.email || "your@email.com"}
                      </p>
                    </div>

                    <Button size="sm" onClick={() => setEditingProfile(true)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
                    <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" />
                  </div>
                )}
              </div>
            </div>
          </TranslucentCard>

          {/* Notifications */}
          <TranslucentCard>
            <SectionHeader section="notifications" icon={Bell} title="Notifications" />
            <div className={`overflow-hidden transition-all ${openSections.notifications ? "max-h-[400px]" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-4">
                <div className="flex justify-between">
                  <Label>Daily Check-In</Label>
                  <Switch checked={dailyCheckIn} onCheckedChange={setDailyCheckIn} />
                </div>
              </div>
            </div>
          </TranslucentCard>

          {/* Privacy */}
          <TranslucentCard>
            <SectionHeader section="privacy" icon={Shield} title="Privacy & Data" />
            <div className={`overflow-hidden transition-all ${openSections.privacy ? "max-h-[500px]" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-3">
                <p className="text-sm">Your journal and ritual history stay on your device.</p>
              </div>
            </div>
          </TranslucentCard>

          {/* Support */}
          <TranslucentCard>
            <SectionHeader section="support" icon={HelpCircle} title="Support & Legal" />
            <div className={`overflow-hidden transition-all ${openSections.support ? "max-h-96" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-2">
                <Link href="/support">
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${glassHover}`}>
                    Help
                  </Button>
                </Link>
                <Link href="/privacy">
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${glassHover}`}>
                    Privacy Policy
                  </Button>
                </Link>
              </div>
            </div>
          </TranslucentCard>

        </div>
      </main>
    </div>
  )
}
