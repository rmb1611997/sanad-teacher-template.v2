import { createContext } from "react"

export interface User {
  id: number
  name: string
  phone: string
  role: "student" | "teacher"
  token: string
  /** null/undefined = full teacher access. An array restricts the sidebar/routes to those page keys (staff accounts). */
  permissions?: string[] | null
}

export interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  /** True until the initial cookie-session check (on app load) resolves. */
  authLoading: boolean
  login: (user: User) => void
  logout: () => void
  getToken: () => string | null
}

export const AuthContext = createContext<AuthContextType | null>(null)
