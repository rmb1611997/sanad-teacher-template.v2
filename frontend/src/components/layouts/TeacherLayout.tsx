import { useState } from "react"
import { Link, Outlet, useLocation, Navigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../../context/useAuth"
import Navbar from "./Navbar"
import {
  LayoutDashboard, BookOpen, Users, FileQuestion,
  ChevronLeft, PlayCircle, FileText,
  Link as LinkIcon, ListTodo, Megaphone, KeyRound, Search, Ban, BarChart3, ClipboardList, TrendingUp, Eye, Grid3x3, Briefcase, UserCog, FileBarChart2
} from "lucide-react"

const navGroups: { label?: string; items: { label: string; path: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    items: [
      { label: "الرئيسية", path: "/teacher", icon: LayoutDashboard },
      { label: "الاحصائيات", path: "/teacher/reports", icon: BarChart3 },
      { label: "ادارة الاشعارات", path: "/teacher/announcements", icon: Megaphone },
    ],
  },
  {
    label: "المحتوى التعليمي",
    items: [
      { label: "إدارة الكورسات", path: "/teacher/course-content", icon: LayoutDashboard },
      { label: "إضافة وتعديل الكورسات", path: "/teacher/courses", icon: BookOpen },
      { label: "إضافة وتعديل المجموعات", path: "/teacher/groups", icon: Users },
      { label: "إضافة وتعديل فئات الكورسات", path: "/teacher/categories", icon: Grid3x3 },
      { label: "إضافة وتعديل الفيديوهات", path: "/teacher/videos", icon: PlayCircle },
      { label: "إضافة وتعديل المذكرات", path: "/teacher/notes", icon: FileText },
      { label: "إضافة وتعديل الروابط", path: "/teacher/links", icon: LinkIcon },
    ],
  },
  {
    label: "الاختبارات والواجبات",
    items: [
      { label: "إضافة وتعديل الإختبارات", path: "/teacher/exams", icon: FileQuestion },
      { label: "إضافة وتعديل الواجبات", path: "/teacher/assignments", icon: ClipboardList },
      { label: "إدارة مجموعات الاسئلة", path: "/teacher/question-groups", icon: FileQuestion },
      { label: "بنك الاسئلة", path: "/teacher/question-bank", icon: ListTodo },
    ],
  },
  {
    label: "الأكواد والاشتراكات",
    items: [
      { label: "إنشاء اكواد", path: "/teacher/codes", icon: KeyRound },
      { label: "تفاصيل كود اشتراك", path: "/teacher/code-details", icon: Search },
      { label: "إالغاء وحظر الاشتراك", path: "/teacher/subscription-control", icon: Ban },
    ],
  },
  {
    label: "التقارير والإحصائيات",
    items: [
      { label: "إحصائيات الاختبارات و الواجبات", path: "/teacher/exam-stats", icon: TrendingUp },
      { label: "إحصائيات المشاهدات", path: "/teacher/video-stats", icon: Eye },
      { label: "التقارير الشاملة", path: "/teacher/comprehensive-reports", icon: FileBarChart2 },
    ],
  },
  {
    label: "المستخدمون",
    items: [
      { label: "جدول المستخدمون", path: "/teacher/students", icon: Users },
      { label: "تفاصيل كود الطالب", path: "/teacher/student-code-details", icon: Search },
      { label: "تعديل بيانات الطالب", path: "/teacher/edit-student", icon: UserCog },
      { label: "جدول الاشتراكات", path: "/teacher/subscriptions", icon: BookOpen },
      { label: "إدارة الموظفون", path: "/teacher/staff", icon: Users },
    ],
  },
]

function permKeyFromPath(path: string) {
  return path.replace(/^\/teacher\/?/, "")
}

function TeacherLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function isActive(path: string) {
    if (path === "/teacher") return location.pathname === "/teacher"
    return location.pathname.startsWith(path)
  }

  // null/undefined permissions = full teacher, no restriction. An array restricts to those page keys.
  const permissions = user?.permissions
  const isRestricted = Array.isArray(permissions)

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const key = permKeyFromPath(item.path)
        if (!key) return true
        return !isRestricted || permissions.includes(key)
      }),
    }))
    .filter((group) => group.items.length > 0)

  if (isRestricted) {
    const currentKey = permKeyFromPath(location.pathname)
    if (currentKey && !permissions.includes(currentKey)) {
      return <Navigate to="/teacher" replace />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">

      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

      {/* Mobile Overlay — only relevant when the sidebar is fully expanded on small screens */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — on large screens it never fully disappears, it only collapses to an icon rail */}
      <motion.aside
        className={`fixed top-20 right-0 h-[calc(100%-5rem)] bg-card border-l border-border z-50 flex flex-col shadow-2xl shadow-black/5 transition-[width,transform] duration-300 ${
          sidebarOpen ? "w-72 translate-x-0" : "w-20 translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Teacher Info */}
        <div className={`p-3.5 mx-3 mt-3 bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl ${sidebarOpen ? "text-right" : "flex justify-center"}`}>
          <div className={`flex items-center gap-2.5 ${sidebarOpen ? "" : "justify-center"}`}>
            <div className="relative w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-md">
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0)?.toUpperCase() ?? "م"}</span>
              <span className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center">
                <Briefcase className="w-2.5 h-2.5 text-primary" />
              </span>
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="font-bold text-secondary text-[15px] truncate">{user?.name}</p>
                <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/15 text-primary">
                  مدرس
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto overflow-x-hidden">
          {visibleNavGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-1" : ""}>
              {group.label && sidebarOpen && (
                <p className="px-3 pt-4 pb-1.5 text-xs font-bold text-muted/70 tracking-wide">
                  {group.label}
                </p>
              )}
              {group.label && !sidebarOpen && (
                <div className="pt-4 pb-1.5 flex justify-center">
                  <div className="w-6 border-t border-border" />
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={sidebarOpen ? undefined : item.label}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-right group ${
                        sidebarOpen ? "" : "justify-center px-0"
                      } ${
                        active
                          ? "bg-primary text-white shadow-md shadow-primary/25"
                          : "text-text hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        active ? "bg-white/20" : "bg-primary/10 text-primary group-hover:bg-primary/15"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {sidebarOpen && (
                        <>
                          <span className="font-medium text-sm leading-tight flex-1">{item.label}</span>
                          {active && (
                            <ChevronLeft className="w-3.5 h-3.5 opacity-70 shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-screen pt-20 transition-[margin] duration-300 ${sidebarOpen ? "lg:mr-72" : "lg:mr-20"}`}>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default TeacherLayout
