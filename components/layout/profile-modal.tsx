"use client"
import { Button } from "@/components/ui/button"
import { User, Settings, LogOut, Edit } from "lucide-react"
import Link from "next/link"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed top-16 left-4 right-4 max-w-sm mx-auto bg-card rounded-lg shadow-lg border z-50 p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Profile Picture */}
          <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-accent" />
          </div>

          {/* User Info */}
          <div className="text-center">
            <h3 className="font-semibold text-[rgba(13,38,28,1)]">Sarah Johnson</h3>
            <p className="text-sm text-muted-foreground">sarah@example.com</p>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent text-gray-500" onClick={onClose}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start hover:text-red-700 hover:bg-red-50 bg-transparent text-[rgba(13,38,28,1)]"
              onClick={onClose}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Settings Link */}
          <Link href="/settings" className="w-full" onClick={onClose}>
            <Button variant="ghost" className="w-full text-sm text-muted-foreground">
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
