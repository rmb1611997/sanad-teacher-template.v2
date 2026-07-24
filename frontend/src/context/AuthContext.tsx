import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react"
import { AuthContext, type User } from "./authContextInstance"
import { checkSession, logout as apiLogout } from "../services/api"
import { setCsrfToken } from "../services/apiClient"

// The JWT itself never touches JavaScript: the backend issues it exclusively as an
// HttpOnly Secure cookie, and the browser attaches it to every request automatically
// (see apiClient's `credentials: "include"`). Nothing here ever stores a real access
// token — `user.token` is only a non-secret in-memory marker so existing `getToken()`
// truthiness checks across the app keep working unchanged. Session state itself is
// verified against the backend on load via `checkSession()`, since there is no local
// storage left to read it from.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    checkSession().then((data) => {
      if (data?.loggedIn) {
        setUser({
          id: data.id,
          name: data.name,
          phone: data.phone,
          role: data.role,
          token: "cookie-session",
          permissions: data.permissions ?? null,
        })
        setCsrfToken(data.csrfToken ?? null)
      }
      setAuthLoading(false)
    })
  }, [])

  const login = useCallback((user: User) => {
    setUser(user)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    apiLogout()
    setCsrfToken(null)
  }, [])

  const getToken = useCallback(() => {
    return user?.token ?? null
  }, [user])

  const value = useMemo(
    () => ({ user, isLoggedIn: !!user, authLoading, login, logout, getToken }),
    [user, authLoading, login, logout, getToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
