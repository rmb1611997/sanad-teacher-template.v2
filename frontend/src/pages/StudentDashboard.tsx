import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, PlayCircle, Award, ClipboardList, TrendingUp } from "lucide-react"
import { useAuth } from "../context/useAuth"
import { getMyCourses, getStudentStats, getStudentCourseProgress } from "../services/api"
import { siteConfig } from "../config/site"

interface EnrolledCourse {
  id: number
  title: string
}

interface CourseProgress {
  courseId: number
  percent: number
}

function StudentDashboard() {
  const { user, getToken } = useAuth()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [progress, setProgress] = useState<CourseProgress[]>([])
  const [loading, setLoading] = useState(() => !!getToken())
  const [videosWatched, setVideosWatched] = useState(0)
  const [examsDone, setExamsDone] = useState(0)
  const [assignmentsDone, setAssignmentsDone] = useState(0)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    getMyCourses(token)
      .then((data) => {
        setCourses(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setCourses([])
      })
      .finally(() => {
        setLoading(false)
      })

    getStudentStats(token).then((data) => {
      if (data.videosWatched !== undefined) {
        setVideosWatched(data.videosWatched)
        setExamsDone(data.examsDone)
        setAssignmentsDone(data.assignmentsDone)
      }
    })

    getStudentCourseProgress(token).then((data) => {
      if (Array.isArray(data)) setProgress(data)
    })
  }, [getToken])

  function percentFor(courseId: number) {
    return progress.find((p) => p.courseId === courseId)?.percent ?? 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const stats = [
    { label: "كورسات مشترك بها", value: courses.length, icon: BookOpen, color: "bg-primary/10 text-primary" },
    { label: "فيديوهات مشاهدة", value: videosWatched, icon: PlayCircle, color: "bg-amber-500/10 text-amber-500" },
    { label: "اختبارات أديتها", value: examsDone, icon: Award, color: "bg-purple-500/10 text-purple-500" },
    { label: "واجبات سلّمتها", value: assignmentsDone, icon: ClipboardList, color: "bg-emerald-500/10 text-emerald-500" },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="relative overflow-hidden bg-surface-dark py-12">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-right">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-white/60 text-sm mb-1">أهلاً بك في</p>
            <h1 className="text-3xl font-bold text-white">{siteConfig.name}</h1>
            <p className="text-primary font-bold mt-1">{user?.name}</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" className="w-full fill-background">
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-card border border-border rounded-2xl p-5 text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-secondary">{stat.value}</p>
              <p className="text-xs text-muted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Section */}
        <motion.div
          className="bg-card border border-border rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 justify-end mb-6">
            <h2 className="font-bold text-secondary text-lg">تقدمك في الكورسات</h2>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">لا توجد كورسات مشترك بها بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const percent = percentFor(course.id)
                return (
                  <div key={course.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">{percent}%</span>
                      <span className="font-bold text-secondary">{course.title}</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}

export default StudentDashboard
