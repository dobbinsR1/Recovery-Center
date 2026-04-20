import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  getInitialSession,
  signUpWithPassword,
  signInWithPassword,
  signOutCurrentUser,
  subscribeToAuthChanges,
} from '../recovery/data/recoveryRepository'
import { isSupabaseConfigured } from '../../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    getInitialSession().then((sessionUser) => {
      if (mounted) {
        setUser(sessionUser)
        setLoading(false)
      }
    })

    const unsubscribe = subscribeToAuthChanges((sessionUser) => {
      setUser(sessionUser)
      setLoading(false)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isSupabaseConfigured,
      signUpWithPassword,
      signInWithPassword,
      signOutCurrentUser,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return value
}
