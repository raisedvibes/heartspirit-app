"use client"

import { Navigation } from "@/components/layout/navigation"
import { TranslucentCard } from "@/components/ui/translucent-card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Bell, Palette, Database, HelpCircle, Edit, Download, Trash2, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SettingsPage() {
  const [dailyCheckIn, setDailyCheckIn] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [communityCircles, setCommunityCircles] = useState(false)
  const [ritualHistory, setRitualHistory] = useState(true)
  const [checkInTime, setCheckInTime] = useState("09:00")
  const [theme, setTheme] = useState("system")
  const [focusWord, setFocusWord] = useState("")

  const [openSections, setOpenSections] = useState({
    profile: false,
    notifications: false,
    personalization: false,
    data: false,
    support: false,
  })

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

          {/* Profile & Account */}
          <TranslucentCard>
            <SectionHeader section="profile" icon={User} title="Profile & Account" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.profile ? "max-h-96" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30">
                  <div>
                    <p className="font-medium text-sm">Sarah Johnson</p>
                    <p className="text-xs text-muted-foreground">sarah.johnson@email.com</p>
                  </div>
                  <Button size="sm" className="bg-accent hover:bg-accent text-accent-foreground">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </TranslucentCard>

          {/* Notifications */}
          <TranslucentCard>
            <SectionHeader section="notifications" icon={Bell} title="Notifications" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.notifications ? "max-h-96" : "max-h-0"}`}>
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
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="weekly-report" className="text-sm font-medium">
                      Weekly Energy Report
                    </Label>
                    <p className="text-xs text-muted-foreground">Get weekly insights</p>
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

          {/* Personalization */}
          <TranslucentCard>
            <SectionHeader section="personalization" icon={Palette} title="Personalization" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.personalization ? "max-h-96" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-sm font-medium">
                    Theme
                  </Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="focus-word" className="text-sm font-medium">
                    Focus Word/Intent
                  </Label>
                  <Input
                    id="focus-word"
                    placeholder="Enter your daily focus word..."
                    value={focusWord}
                    onChange={(e) => setFocusWord(e.target.value)}
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">Appears in your daily check-ins</p>
                </div>
              </div>
            </div>
          </TranslucentCard>

          {/* Data & Tracking */}
          <TranslucentCard>
            <SectionHeader section="data" icon={Database} title="Data & Tracking" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.data ? "max-h-96" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="ritual-history" className="text-sm font-medium">
                      Ritual History
                    </Label>
                    <p className="text-xs text-muted-foreground">Track ritual completion</p>
                  </div>
                  <Switch id="ritual-history" checked={ritualHistory} onCheckedChange={setRitualHistory} />
                </div>

                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start h-9 bg-transparent">
                    <Download className="w-3 h-3 mr-2" />
                    Export Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive h-9 bg-transparent"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Clear Data
                  </Button>
                </div>
              </div>
            </div>
          </TranslucentCard>

          {/* Support & Legal */}
          <TranslucentCard>
            <SectionHeader section="support" icon={HelpCircle} title="Support & Legal" />
            <div className={`overflow-hidden transition-all duration-300 ${openSections.support ? "max-h-96" : "max-h-0"}`}>
              <div className="p-4 pt-0 space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-background/40">
                  Help
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-background/40">
                  Contact Support
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-background/40">
                  Privacy Policy
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-9 hover:bg-background/40">
                  Terms of Use
                </Button>
              </div>
            </div>
          </TranslucentCard>
        </div>
      </main>
    </div>
  )
}
