"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function ActionRow({
  title,
  subtitle,
  onClick,
  className,
}: {
  title: string
  subtitle?: string
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        `
        w-full text-left rounded-lg
        p-3 sm:p-4 lg:p-5
        border-2 border-white/20 bg-black/20
        hover:border-white/40 hover:bg-white/10
        transition-all duration-200
        `,
        className,
      )}
    >
      <div className="flex flex-col items-start">
        <span className="text-sm sm:text-base font-semibold text-white">{title}</span>
        {subtitle ? (
          <span className="text-xs sm:text-sm text-white/70 mt-1">{subtitle}</span>
        ) : null}
      </div>
    </button>
  )
}
