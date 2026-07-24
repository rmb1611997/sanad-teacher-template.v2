import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Users, BookOpen, TrendingUp, Award, Sparkles,
  PlusCircle, KeyRound, PlayCircle, FileQuestion, ClipboardList, ArrowLeft
} from "lucide-react"
import { useAuth } from "../../context/useAuth"
import { teacherGetStudents, teacherGetSubscriptions } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import { StatCard, EmptyChart } from "../../components/teacher/StatsWidgets"

interface ApiSubscription {
  studentId: number
  courseTitle: string
}

interface ApiStudent {
  id: number
  studentCode: string
  fullName: string
  createdAt: string
  subscribedCourses: number[]
}

const QUICK_ACTIONS = [
  { label: "إضافة كورس", path: "/teacher/courses", icon: BookOpen, gradient: "from-blue-500 to-blue-700" },
  { label: "إنشاء مجموعة", path: "/teacher/groups", icon: Users, gradient: "from-emerald-500 to-emerald-700" },
  { label: "إنشاء أكواد", path: "/teacher/codes", icon: KeyRound, gradient: "from-amber-500 to-amber-700" },
  { label: "إضافة فيديو", path: "/teacher/videos", icon: PlayCircle, gradient: "from-purple-500 to-purple-700" },
  { label: "إضافة اختبار", path: "/teacher/exams", icon: FileQuestion, gradient: "from-rose-500 to-rose-700" },
  { label: "إضافة واجب", path: "/teacher/assignments", icon: ClipboardList, gradient: "from-cyan-500 to-cyan-700" },
]

function TeacherHome() {
  const { getToken, user } = useAuth()
  const { courses } = useTeacherCoursesGroups(getToken())

  const [totalStudents, setTotalStudents] = useState(0)
  const [subscribedStudents, setSubscribedStudents] = useState(0)
  const [recentSubscribedStudents, setRecentSubscribedStudents] = useState<ApiStudent[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetStudents(token).then((data) => {
      if (Array.isArray(data)) {
        const students = data as ApiStudent[]
        setTotalStudents(students.length)
        const latestSubscribed = students
          .filter((s) => Array.isArray(s.subscribedCourses) && s.subscribedCourses.length > 0)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
        setRecentSubscribedStudents(latestSubscribed)
      }
    })
    teacherGetSubscriptions(token).then((data) => {
      if (Array.isArray(data)) {
        const subscriptions = data as ApiSubscription[]
        const uniqueStudents = new Set(subscriptions.map((s) => s.studentId))
        setSubscribedStudents(uniqueStudents.size)
      }
    })
  }, [getToken])

  const subscribedPercent = totalStudents > 0
    ? Math.round((subscribedStudents / totalStudents) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-primary-dark p-6 md:p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 text-right">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            لوحة التحكم
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            مرحباً بك{user?.name ? `، ${user.name}` : ""} 👋
          </h1>
          <p className="text-white/70 text-sm mt-1">نظرة سريعة على منصتك التعليمية</p>
        </div>
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الطلاب" value={totalStudents} icon={Users} gradient="bg-linear-to-br from-blue-500 to-blue-700" delay={0} />
        <StatCard label="المشتركون في كورسات" value={subscribedStudents} icon={TrendingUp} gradient="bg-linear-to-br from-emerald-500 to-emerald-700" delay={0.08} />
        <StatCard label="عدد الكورسات" value={courses.length} icon={BookOpen} gradient="bg-linear-to-br from-amber-500 to-amber-700" delay={0.16} />
        <StatCard label="نسبة الاشتراك" value={subscribedPercent} suffix="%" icon={Award} gradient="bg-linear-to-br from-purple-500 to-purple-700" delay={0.24} />
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-3xl p-6">
        <h2 className="font-bold text-secondary text-lg text-right mb-5 flex items-center gap-2 justify-end">
          <PlusCircle className="w-5 h-5 text-primary" />
          اختصارات سريعة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                to={action.path}
                className="group relative flex flex-col items-center justify-center gap-3 text-center bg-background border border-border rounded-2xl px-4 py-6 overflow-hidden hover:border-transparent hover:shadow-lg transition-all"
              >
                <div className={`absolute inset-0 bg-linear-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className={`relative z-10 w-12 h-12 rounded-2xl bg-linear-to-br ${action.gradient} group-hover:bg-white/15 flex items-center justify-center shrink-0 transition-colors duration-300`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>

                <span className="relative z-10 text-sm font-bold text-secondary group-hover:text-white transition-colors duration-300">
                  {action.label}
                </span>

                <ArrowLeft className="relative z-10 w-3.5 h-3.5 text-muted group-hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 group-hover:translate-x-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Subscribed Students */}
      <motion.div
        className="bg-card border border-border rounded-3xl p-6"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/teacher/students"
            className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            عرض الكل
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <h2 className="font-bold text-secondary text-lg text-right flex items-center gap-2">
            أحدث الطلاب المشتركين
            <Users className="w-5 h-5 text-primary" />
          </h2>
        </div>

        {recentSubscribedStudents.length === 0 ? (
          <EmptyChart label="لا يوجد طلاب مشتركون بعد" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentSubscribedStudents.map((student, i) => (
              <motion.div
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-xs">{student.fullName.charAt(0)}</span>
                </div>
                <div className="min-w-0 text-right">
                  <p className="font-bold text-secondary text-sm truncate">{student.fullName}</p>
                  <p className="text-xs text-muted font-mono" dir="ltr">{student.studentCode}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  )
}

export default TeacherHome
