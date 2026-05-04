import * as React from "react"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabaseClient"
import { syncRitualsStoreWithAuthUserId } from "./ritualsStore"

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
}

const AuthContext = React.createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      syncRitualsStoreWithAuthUserId(null).catch(() => {})
      setLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        setSession(s)
        setUser(s?.user ?? null)
        await syncRitualsStoreWithAuthUserId(s?.user?.id ?? null)
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      void syncRitualsStoreWithAuthUserId(s?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext)
}
