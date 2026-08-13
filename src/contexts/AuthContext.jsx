import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TEACHER_EMAILS = ['clebel@emmawillard.org', 'gegan@emmawillard.org', 'dpetulla@emmawillard.org']

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchRole(currentUser) {
    if (!currentUser) { setRole(null); return }
    const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
    if (data) {
      setRole(data.role)
    } else {
      // Profile doesn't exist yet (user predates trigger) — create it now
      const derivedRole = TEACHER_EMAILS.includes(currentUser.email) ? 'teacher' : 'student'
      await supabase.from('profiles').insert({
        id: currentUser.id,
        role: derivedRole,
        email: currentUser.email,
        username: currentUser.user_metadata?.username || currentUser.user_metadata?.full_name || null,
      }).catch(() => {})
      setRole(derivedRole)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      await fetchRole(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      fetchRole(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
