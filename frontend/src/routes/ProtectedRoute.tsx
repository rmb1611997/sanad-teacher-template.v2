import { Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../context/useAuth"

interface Props {
  children: React.ReactNode
  role?: "student" | "teacher"
}

function ProtectedRoute({ children, role }: Props) {
  const { isLoggedIn, user, authLoading } = useAuth()

  // Wait for the cookie-session check to resolve before deciding to redirect —
  // otherwise a page refresh would briefly look "logged out" and bounce to /login.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
