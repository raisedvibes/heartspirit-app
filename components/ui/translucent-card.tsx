"use client"

import { cn } from "@/lib/utils"

export function TranslucentCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        // Main glass look
        "rounded-2xl bg-white/20 backdrop-blur-md shadow-md border border-white/30 text-white",
        // Force children (like <CardContent>) to drop backgrounds & shadows
        "[&>*]:bg-transparent [&>*]:shadow-none [&>*]:border-0",
        className
      )}
    >
      {children}
    </div>
  )
}
