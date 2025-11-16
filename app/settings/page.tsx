"use client"

import { Navigation } from "@/components/layout/navigation"
import { Card } from "@/components/ui/card"
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
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
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

          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection("profile")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-accent" />
                <h2 className="text-base font-semibold">Profile & Account</h2>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.profile ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openSections.profile ? "max-h-96" : "max-h-0"}`}
            >
              <div className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Sarah Johnson</p>
                    <p className="text-xs text-muted-foreground">sarah.johnson@email.com</p>
                  </div>
                  <Button
  size="sm"
  className="bg-accent hover:bg-accent text-accent-foreground"
>
  <Edit className="w-3 h-3 mr-1" />
  Edit
</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection("notifications")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-accent" />
                <h2 className="text-base font-semibold">Notifications</h2>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${openSections.notifications ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openSections.notifications ? "max-h-96" : "max-h-0"}`}
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
          </Card>

          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection("personalization")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-accent" />
                <h2 className="text-base font-semibold">Personalization</h2>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${openSections.personalization ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openSections.personalization ? "max-h-96" : "max-h-0"}`}
            >
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
          </Card>

          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection("data")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-accent" />
                <h2 className="text-base font-semibold">Data & Tracking</h2>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.data ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openSections.data ? "max-h-96" : "max-h-0"}`}
            >
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
          </Card>

          <Card className="overflow-hidden">
            <button
              onClick={() => toggleSection("support")}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-accent" />
                <h2 className="text-base font-semibold">Support & Legal</h2>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${openSections.support ? "rotate-180" : ""}`} />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openSections.support ? "max-h-96" : "max-h-0"}`}
            >
              <div className="p-4 pt-0 space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start h-9">
                  Help
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-9">
                  Contact Support
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-9">
                  Privacy Policy
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start h-9">
                  Terms of Use
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
