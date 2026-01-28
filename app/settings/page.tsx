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
import { ArrowLeft, User, Bell, Shield, HelpCircle, Edit, Download, Trash2, ChevronDown } from "lucide-react"

const supabase = createClient()

export default function SettingsPage() {
  // Notifications
  const [dailyCheckIn, setDailyCheckIn] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)
  const [communityCircles, setCommunityCircles] = useState(false)
  const [checkInTime, setCheckInTime] = useState("09:00")

  // Privacy / local data
  const [saveHistoryOnDevice, setSaveHistoryOnDevice] = useState(true)

  // Profile (Supabase)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name: string; email: string }>({ full_name: "", email: "" })

  const [editOpen, setEditOpen] = useState(false)
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
        setProfileError(null)
        setProfileLoading(true)

        const { data: authData, error: authErr } = await supabase.auth.getUser()
        if (authErr) throw authErr

        const user = authData?.user
        if (!user) {
          setProfileLoading(false)
          return
        }

        const fallbackEmail = user.email ?? ""

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name,email")
          .eq("id", user.id)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          // Create the row if missing
          const { error: insertErr } = await supabase.from("profiles").insert({
            id: user.id,
            email: fallbackEmail || null,
            full_name: null,
          })
          if (insertErr) throw insertErr

          setProfile({ full_name: "", email: fallbackEmail })
        } else {
          setProfile({
            full_name: data.full_name ?? "",
            email: data.email ?? fallbackEmail,
          })
        }
      } catch (e: any) {
        setProfileError(e?.message ?? "Could not load profile")
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

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
      <div className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-background/40 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-accent" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${openSections[section] ? "rotate-180" : ""}`} />
      </div>
    </button>
  )

  const openEditProfile = () => {
    setProfileError(null)
    setEditName(profile.full_name ?? "")
    setEditEmail(profile.email ?? "")
    setEditOpen(true)
  }

  const saveProfileToSupabase = async () => {
    try {
      setProfileError(null)
      setSaveProfileLoading(true)

      const name = editName.trim()
      const email = editEmail.trim()

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr) throw authErr
      if (!authData?.user) throw new Error("Not signed in")

      const user = authData.user

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name || null,
          email: email || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile({ full_name: name, email })
      setEditOpen(false)
    } catch (e: any) {
      setProfileError(e?.message ?? "Could not save profile")
    } finally {
      setSaveProfileLoading(false)
    }
  }

  // TODO: wire these to your local storage / IndexedDB layer
  const handleExportData = async () => {
    console.log("Export data (local)")
  }

  const handleClearHistory = async () => {
    console.log("Clear history (local)")
  }

  const handleToggleSaveHistory = (next: boolean) => {
    setSaveHistoryOnDevice(next)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5">
      <Navigation />

      <main className="app-main max-w-6xl mx-auto px-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Profile & Contact (contact info) */}
          <TranslucentCard>
            <SectionHeader section="profile" icon={User} title="Profile & Contact" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.profile ? "max-h-[520px]" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30">
                  <div>
                    <p className="font-medium text-sm">
                      {profileLoading ? "Loading..." : profile.full_name || "Your name"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {profileLoading ? "" : profile.email || "your@email.com"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={openEditProfile}
                    disabled={profileLoading}
                    className="bg-accent hover:bg-accent text-accent-foreground"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>

                {profileError && <p className="text-xs text-destructive px-1">{profileError}</p>}

                <p className="text-xs text-muted-foreground px-1">
                  We only use your contact info for account access and support. Your journal + ritual history stays on your device.
                </p>

                {editOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-background/95 backdrop-blur border border-border/40 shadow-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">Edit Profile</h3>
                        <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
                          Close
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          This updates the email we use for support and contact. Your sign-in email may require a separate change.
                        </p>
                      </div>

                      {profileError && <p className="text-xs text-destructive">{profileError}</p>}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-accent hover:bg-accent text-accent-foreground"
                          onClick={saveProfileToSupabase}
                          disabled={saveProfileLoading}
                        >
                          {saveProfileLoading ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TranslucentCard>

          {/* Notifications */}
          <TranslucentCard>
            <SectionHeader section="notifications" icon={Bell} title="Notifications" />
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openSections.notifications ? "max-h-[520px]" : "max-h-0"
              }`}
            >
              <div className="p-4 pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="daily-checkin" className="text-sm font-medium">
                      Daily Check-In
                    </Label>
                    <p className="text-xs text-muted-foreground">Remind me to check in daily</p>
                  </div>
                  <Switch id="daily-checkin" checked={dailyCheckIn} onCheckedChange={setDailyCheckIn} />
                </div>

                {dailyCheckIn && (
                  <div className="ml-2 space-y-2">
                    <Label htmlFor="checkin-time" className="text-sm font-medium">
                      Reminder Time
                    </Label>
                    <Input
                      id="checkin-time"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-28 h-8"
                    />
                    <p className="text-xs text-muted-foreground">Reminders depend on device/browser support.</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="weekly-report" className="text-sm font-medium">
                      Weekly Reflection
                    </Label>
                    <p className="text-xs text-muted-foreground">A gentle weekly recap (generated on your device)</p>
                  </div>
                  <Switch id="weekly-report" checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="community-circles" className="text-sm font-medium">
                      Community Circles
                    </Label>
                    <p className="text-xs text-muted-foreground">Circle activity notifications</p>
                  </div>
                  <Switch id="community-circles" checked={communityCircles} onCheckedChange={setCommunityCircles} />
                </div>
              </div>
            </div>
          </TranslucentCard>

          {/* Privacy & Data */}
          <TranslucentCard>
            <SectionHeader section="privacy" icon={Shield} title="Privacy & Data" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.privacy ? "max-h-[620px]" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-4">
                <div className="rounded-lg bg-background/25 border border-border/30 p-3 space-y-2">
                  <p className="text-sm font-medium">What we keep</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                    <li>Your email/contact info (for account access + support)</li>
                    <li>App content you stream (practices, audio/video) is delivered from our servers</li>
                    <li>Community content (only if you post in Circles)</li>
                  </ul>

                  <p className="text-sm font-medium pt-2">What we don’t keep</p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                    <li>Your journal entries are not stored on our servers</li>
                    <li>Your ritual history and check-ins are not stored on our servers</li>
                    <li>We don’t sell your personal data</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="save-history" className="text-sm font-medium">
                      Save my history on this device
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Keeps your journal, check-ins, and ritual history stored locally on your device.
                    </p>
                  </div>
                  <Switch id="save-history" checked={saveHistoryOnDevice} onCheckedChange={handleToggleSaveHistory} />
                </div>

                <div className="space-y-2">
                  <Button onClick={handleExportData} variant="outline" size="sm" className="w-full justify-start h-9 bg-transparent">
                    <Download className="w-3 h-3 mr-2" />
                    Export My Data
                  </Button>

                  <Button
                    onClick={handleClearHistory}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive h-9 bg-transparent"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Clear Local History
                  </Button>

                  <p className="text-[11px] leading-snug text-muted-foreground px-1">
                    Clearing local history removes journal entries, ritual completion, and check-ins from this device. This can’t be undone.
                  </p>
                </div>
              </div>
            </div>
          </TranslucentCard>

          {/* Support & Legal */}
          <TranslucentCard>
            <SectionHeader section="support" icon={HelpCircle} title="Support & Legal" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.support ? "max-h-96" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-2">
                <Link href="/support" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-background/40">
                    Help
                  </Button>
                </Link>

                <Link href="/privacy" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-background/40">
                    Privacy Policy
                  </Button>
                </Link>

                <Link href="/terms" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-background/40">
                    Terms of Use
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
