"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Track (background) always white
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-gray-300 shadow-xs transition-all outline-none " +
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 bg-white",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Dot (thumb) changes color depending on state
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform shadow-sm " +
            "data-[state=unchecked]:bg-gray-400 data-[state=checked]:bg-accent " +
            "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
