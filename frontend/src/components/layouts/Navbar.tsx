import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { PanelRight, GraduationCap, Briefcase, BookOpen, BarChart3, User as UserIcon, LogOut, LayoutDashboard } from "lucide-react"
import { siteConfig } from "../../config/site"
import useDarkMode from "../../hooks/useDarkMode"
import { useAuth } from "../../context/useAuth"
import AnnouncementsBell from "./AnnouncementsBell"

interface NavbarProps {
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
}

function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const { dark, toggle } = useDarkMode()
  const { user, isLoggedIn, authLoading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const avatarRef = useRef<HTMLDivElement>(null)

  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    setOpen(false)
    setAvatarOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleLogout() {
    setAvatarOpen(false)
    logout()
    navigate("/")
  }

  const inManagementArea = location.pathname.startsWith("/teacher")

  function handleAvatarClick() {
    if (inManagementArea) {
      navigate("/")
    } else {
      setAvatarOpen((v) => !v)
    }
  }

  const links: { label: string; to: string }[] = []

  return (
    <motion.nav
      className="fixed top-0 inset-x-0 z-60 px-3 sm:px-4 pt-3"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div
        className={`relative max-w-7xl mx-auto rounded-3xl transition-all duration-500 ${
          scrolled
            ? "bg-card/80 backdrop-blur-xl border border-border shadow-xl shadow-black/10"
            : "bg-card/40 backdrop-blur-md border border-transparent"
        }`}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -inset-x-6 -top-6 h-16 bg-linear-to-b from-primary/10 to-transparent blur-2xl opacity-70" />

        <div className="relative px-4 sm:px-6 py-3 flex items-center justify-between">

          <div className="flex items-center gap-3">
            {/* Sidebar Toggle */}
            {onToggleSidebar && (
              <motion.button
                onClick={onToggleSidebar}
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition ${
                  sidebarOpen
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-card text-text hover:border-primary hover:text-primary"
                }`}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.9 }}
                title={sidebarOpen ? "طي القائمة الجانبية" : "توسيع القائمة الجانبية"}
              >
                <PanelRight className="w-5 h-5" />
              </motion.button>
            )}

            {/* Logo */}
            <Link to="/" className="group flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/25 blur-md"
                  animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.05, 0.9] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.img
                  src={siteConfig.logo}
                  alt={siteConfig.name}
                  className="relative w-16 h-16 object-contain drop-shadow-lg"
                  whileHover={{ scale: 1.12, rotate: 6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 12 }}
                />
              </div>
              <span className="relative text-2xl font-extrabold tracking-tight bg-linear-to-l from-primary via-secondary to-primary bg-size-[200%_auto] bg-clip-text text-transparent transition-[background-position] duration-700 group-hover:bg-position-[100%_0]">
                {siteConfig.name}
              </span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => {
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`relative text-sm font-bold transition-colors py-1 ${
                    active ? "text-primary" : "text-text hover:text-primary"
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">

            {/* Announcements */}
            {isLoggedIn && user?.role !== "teacher" && !inManagementArea && <AnnouncementsBell />}

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={toggle}
              className="w-10 h-10 rounded-2xl border border-border bg-card flex items-center justify-center text-lg hover:border-primary transition"
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.span
                key={dark ? "sun" : "moon"}
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {dark ? "☀️" : "🌙"}
              </motion.span>
            </motion.button>

          {authLoading ? null : isLoggedIn ? (
            <div className="relative" ref={avatarRef}>
              <motion.button
                onClick={handleAvatarClick}
                className={`relative w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition ring-2 ${
                  avatarOpen ? "ring-primary" : "ring-transparent"
                } bg-linear-to-br ${
                  user?.role === "teacher" ? "from-primary to-primary/60" : "from-secondary to-secondary/60"
                } hover:opacity-90 shadow-md`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={inManagementArea ? "الصفحة الرئيسية" : user?.name}
              >
                <span className="text-sm">{user?.name?.charAt(0)?.toUpperCase() ?? "?"}</span>
                <span className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center">
                  {user?.role === "teacher" ? (
                    <Briefcase className="w-2.5 h-2.5 text-primary" />
                  ) : (
                    <GraduationCap className="w-2.5 h-2.5 text-secondary" />
                  )}
                </span>
              </motion.button>

              <AnimatePresence>
                {avatarOpen && !inManagementArea && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="px-4 py-4 bg-linear-to-br from-primary/10 to-primary/5 border-b border-border flex items-center gap-3 justify-end text-right">
                      <div>
                        <p className="font-bold text-secondary text-sm truncate max-w-40">{user?.name}</p>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          user?.role === "teacher" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"
                        }`}>
                          {user?.role === "teacher" ? "مدرس" : "طالب"}
                        </span>
                      </div>
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 bg-linear-to-br ${
                        user?.role === "teacher" ? "from-primary to-primary/60" : "from-secondary to-secondary/60"
                      }`}>
                        {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                    </div>

                    <div className="py-1.5">
                      {user?.role === "teacher" ? (
                        <Link
                          to="/teacher"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text hover:bg-primary/5 hover:text-primary transition text-right justify-end"
                        >
                          إدارة المنصة
                          <LayoutDashboard className="w-4 h-4" />
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/student-courses"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text hover:bg-primary/5 hover:text-primary transition text-right justify-end"
                          >
                            كورساتي
                            <BookOpen className="w-4 h-4" />
                          </Link>
                          <Link
                            to="/student-stats"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text hover:bg-primary/5 hover:text-primary transition text-right justify-end"
                          >
                            إحصائياتي
                            <BarChart3 className="w-4 h-4" />
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text hover:bg-primary/5 hover:text-primary transition text-right justify-end"
                          >
                            إحصائيات كورساتي
                            <LayoutDashboard className="w-4 h-4" />
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text hover:bg-primary/5 hover:text-primary transition text-right justify-end"
                          >
                            الملف الشخصي
                            <UserIcon className="w-4 h-4" />
                          </Link>
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition text-right justify-end border-t border-border"
                    >
                      تسجيل الخروج
                      <LogOut className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-bold text-text hover:text-primary transition px-4 py-2"
              >
                تسجيل الدخول
              </Link>

              <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/register"
                  className="relative overflow-hidden bg-linear-to-l from-primary to-primary/80 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                >
                  إنشاء حساب
                </Link>
              </motion.div>
            </>
          )}

        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-2">
          {isLoggedIn && user?.role !== "teacher" && !inManagementArea && <AnnouncementsBell />}

          <motion.button
            onClick={toggle}
            className="w-9 h-9 rounded-2xl border border-border bg-card flex items-center justify-center text-base"
            whileTap={{ scale: 0.9 }}
          >
            {dark ? "☀️" : "🌙"}
          </motion.button>

          <motion.button
            className="relative w-9 h-9 rounded-2xl border border-border bg-card flex items-center justify-center text-primary"
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.9 }}
          >
            <motion.span
              animate={{ rotate: open ? 90 : 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {open ? "✕" : "☰"}
            </motion.span>
          </motion.button>
        </div>

      </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="md:hidden mt-2 bg-card/95 backdrop-blur-xl border border-border rounded-3xl px-6 py-5 shadow-xl shadow-black/10 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-4">
              {links.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={link.to}
                    className="block text-text hover:text-primary transition font-medium text-right"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div className="border-t border-border pt-4 flex flex-col gap-3">
                {authLoading ? null : isLoggedIn ? (
                  <>
                    {inManagementArea ? (
                      <Link to="/" className="text-primary font-medium text-right">
                        الصفحة الرئيسية
                      </Link>
                    ) : user?.role === "teacher" ? (
                      <Link to="/teacher" className="text-primary font-medium text-right">
                        إدارة المنصة
                      </Link>
                    ) : (
                      <>
                        <Link to="/student-courses" className="text-primary font-medium text-right">
                          كورساتي
                        </Link>
                        <Link to="/dashboard" className="text-primary font-medium text-right">
                          إحصائيات كورساتي
                        </Link>
                        <Link to="/my-stats" className="text-primary font-medium text-right">
                          إحصائياتي
                        </Link>
                        <Link to="/profile" className="text-primary font-medium text-right">
                          الملف الشخصي
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-red-500 font-medium text-right"
                    >
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-primary font-medium text-right"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary text-white py-3 rounded-xl font-bold text-center"
                    >
                      إنشاء حساب
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.nav>
  )
}

export default Navbar