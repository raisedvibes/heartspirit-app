"use client"

import { cn } from "@/lib/utils"

/**
 * Default export (keeps existing imports working):
 *   import TranslucentCard from "@/components/ui/translucent-card"
 */
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
        "rounded-2xl bg-white/20 backdrop-blur-md shadow-md border border-white/30 text-white",
        "[&>*]:bg-transparent [&>*]:shadow-none [&>*]:border-0",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Named export (fixes any leftover imports like):
 *   import { TranslucentCard } from "@/components/ui/translucent-card"
 */
export { TranslucentCard }
