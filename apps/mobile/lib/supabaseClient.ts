import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

/** Returns Supabase client for non-Next.js apps (e.g. Expo). Returns null if env vars are not set. */
export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("[Supabase] Env vars missing. URL:", !!url, "Key:", !!anon)
    }
    return null
  }
  _client = createClient(url, anon, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: { fetch },
  })
  return _client
}
