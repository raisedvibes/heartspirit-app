import * as Linking from "expo-linking"

import { getSupabaseClient } from "./supabaseClient"

function parseParamsFromUrl(url: string): URLSearchParams {
  const hashIndex = url.indexOf("#")
  const queryIndex = url.indexOf("?")
  let paramString = ""
  if (hashIndex !== -1) {
    paramString = url.substring(hashIndex + 1)
  } else if (queryIndex !== -1) {
    paramString = url.substring(queryIndex + 1)
  }
  return new URLSearchParams(paramString)
}

export function getPasswordResetRedirectUrl(): string {
  return Linking.createURL("reset-password")
}

export function isPasswordRecoveryUrl(url: string): boolean {
  if (!url.includes("reset-password")) return false
  const params = parseParamsFromUrl(url)
  return (
    params.get("type") === "recovery" ||
    params.has("access_token") ||
    params.has("code")
  )
}

/** Parses Supabase recovery redirect tokens/code and establishes a session. */
export async function createSessionFromAuthUrl(url: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || !url) return false

  const params = parseParamsFromUrl(url)
  const code = params.get("code")
  const accessToken = params.get("access_token")
  const refreshToken = params.get("refresh_token")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return !error
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    return !error
  }

  return false
}
