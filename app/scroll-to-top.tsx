"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function ScrollToTop({ selector }: { selector?: string }) {
  const pathname = usePathname()
  const search = useSearchParams()

  useEffect(() => {
    if (!selector) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    } else {
      document.querySelector<HTMLElement>(selector)
        ?.scrollTo({ top: 0, left: 0, behavior: "auto" })
    }
  }, [pathname, search])

  return null
}
