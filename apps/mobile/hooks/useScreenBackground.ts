import { useCallback, useEffect, useState } from "react"
import type { ImageSourcePropType } from "react-native"
import { getSupabaseClient } from "@/lib/supabaseClient"

const DEFAULT_FERN = require("@/assets/images/fern.background.png") as ImageSourcePropType

function isValidBackgroundUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim()
  return !!trimmed && trimmed.startsWith("http")
}

/**
 * Fetches screen background from Supabase app_backgrounds, with safe fallback to local asset.
 * Use for tab pages, login, signup, auth index.
 *
 * Flow:
 * 1. Start with local default (never blank)
 * 2. Fetch remote URL by page_key when configured
 * 3. Use remote only when valid and successfully loaded
 * 4. Revert to local on: no row, null/empty URL, error, or remote image load failure
 */
export function useScreenBackground(
  pageKey: string,
  defaultAsset: ImageSourcePropType = DEFAULT_FERN
): { source: ImageSourcePropType; onError: () => void } {
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null)
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function load() {
      const supabase = getSupabaseClient()
      if (!supabase) return

      const { data, error } = await supabase
        .from("app_backgrounds")
        .select("image_url")
        .eq("page_key", pageKey)
        .eq("is_active", true)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()

      const url = data?.image_url
      const isValid = isValidBackgroundUrl(url)

      if (!error && isValid && isMounted) {
        setRemoteUrl(url!.trim())
      } else if (isMounted) {
        setRemoteUrl(null)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [pageKey])

  const onError = useCallback(() => {
    setUseLocalFallback(true)
    setRemoteUrl(null)
  }, [])

  const source =
    (useLocalFallback || !remoteUrl ? defaultAsset : { uri: remoteUrl }) as ImageSourcePropType

  return { source, onError }
}
