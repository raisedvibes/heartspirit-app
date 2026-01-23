"use client"

import React from "react"

import { cn } from "@/lib/utils"

export default function TranslucentCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        // Glass base (your approved look)
        "rounded-2xl bg-black/25 backdrop-blur-xl shadow-md ring-1 ring-white/10",
        // ✅ Force readable content on glass
        "text-white",
        // ✅ Make lucide/react svg icons inherit currentColor
        "[&_svg]:text-current",
        // Keep nested shadcn Card transparent
        "[&>*]:bg-transparent [&>*]:shadow-none [&>*]:border-0",
        className
      )}
    >
      {children}
    </div>
  )
}
