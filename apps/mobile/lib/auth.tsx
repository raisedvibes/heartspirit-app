import * as React from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Session, User } from "@supabase/supabase-js"
import { getSupabaseClient } from "./supabaseClient"
import { syncRitualsStoreWithAuthUserId } from "./ritualsStore"

const RECOVERY_PENDING_KEY = "heartspirit:pendingPasswordRecovery"

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  pendingPasswordRecovery: boolean
  markPendingPasswordRecovery: () => void
  clearPendingPasswordRecovery: () => void
}

const AuthContext = React.createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  pendingPasswordRecovery: false,
  markPendingPasswordRecovery: () => {},
  clearPendingPasswordRecovery: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [pendingPasswordRecovery, setPendingPasswordRecovery] = React.useState(false)

  const clearPendingPasswordRecovery = React.useCallback(() => {
    setPendingPasswordRecovery(false)
    void AsyncStorage.removeItem(RECOVERY_PENDING_KEY)
  }, [])

  const markPendingPasswordRecovery = React.useCallback(() => {
    setPendingPasswordRecovery(true)
    void AsyncStorage.setItem(RECOVERY_PENDING_KEY, "1")
  }, [])

  React.useEffect(() => {
    void AsyncStorage.getItem(RECOVERY_PENDING_KEY).then((value) => {
      if (value === "1") setPendingPasswordRecovery(true)
    })
  }, [])

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
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") {
        markPendingPasswordRecovery()
      }
      if (event === "SIGNED_OUT") {
        setPendingPasswordRecovery(false)
        void AsyncStorage.removeItem(RECOVERY_PENDING_KEY)
      }
      setSession(s)
      setUser(s?.user ?? null)
      void syncRitualsStoreWithAuthUserId(s?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [markPendingPasswordRecovery])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        pendingPasswordRecovery,
        markPendingPasswordRecovery,
        clearPendingPasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return React.useContext(AuthContext)
}
