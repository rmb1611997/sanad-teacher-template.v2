import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, PlayCircle, Award, ClipboardList, Clock, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from "../context/useAuth"
import { getStudentActivityLog, getMyCourses } from "../services/api"

type LogTab = "videos" | "exams" | "assignments"

interface VideoLogEntry {
  id: number
  videoTitle: string
  courseTitle: string
  watchedAt: string
}

interface ExamLogEntry {
  id: number
  examTitle: string
  courseTitle: string
  score: number
  total: number
  submittedAt: string
}

interface AssignmentLogEntry {
  id: number
  assignmentTitle: string
  courseTitle: string
  grade: number | null
  submittedAt: string
}

function CircleStat({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  const r = 40
  const circumference = 2 * Math.PI * r

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <motion.circle
            cx="48" cy="48" r={r} fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percent / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-secondary">{value}/{total}</span>
        </div>
      </div>
      <p className="text-xs font-bold text-muted text-center">{label}</p>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-EG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function StudentStats() {
  const { getToken } = useAuth()
  const [logTab, setLogTab] = useState<LogTab>("videos")

  const [videoLogs, setVideoLogs] = useState<VideoLogEntry[]>([])
  const [examLogs, setExamLogs] = useState<ExamLogEntry[]>([])
  const [assignmentLogs, setAssignmentLogs] = useState<AssignmentLogEntry[]>([])
  const [subscribedCoursesCount, setSubscribedCoursesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    let cancelled = false

    // Deferred to a microtask so the loading/error resets happen inside a callback
    // rather than synchronously in the effect body.
    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
      setErrorMessage(null)
    })

    Promise.all([getStudentActivityLog(token), getMyCourses(token)]).then(([activity, courses]) => {
      if (cancelled) return
      setLoading(false)
      if (!activity || "error" in activity) {
        setErrorMessage((activity && "message" in activity && activity.message) || "تعذر تحميل إحصائياتك")
        return
      }
      setVideoLogs(Array.isArray(activity.videoLogs) ? activity.videoLogs : [])
      setExamLogs(Array.isArray(activity.examLogs) ? activity.examLogs : [])
      setAssignmentLogs(Array.isArray(activity.assignmentLogs) ? activity.assignmentLogs : [])
      setSubscribedCoursesCount(Array.isArray(courses) ? courses.length : 0)
    })

    return () => { cancelled = true }
  }, [getToken])

  const videosWatchedCount = videoLogs.length
  const examsSolvedCount = examLogs.length
  const assignmentsSolvedCount = assignmentLogs.length

  const statCards = [
    { label: "الكورسات المشترك بها", value: subscribedCoursesCount, icon: BookOpen, color: "text-primary bg-primary/10" },
    { label: "الفيديوهات المشاهدة", value: videosWatchedCount, icon: PlayCircle, color: "text-amber-500 bg-amber-500/10" },
    { label: "الاختبارات المحلولة", value: examsSolvedCount, icon: Award, color: "text-purple-500 bg-purple-500/10" },
    { label: "الواجبات المحلولة", value: assignmentsSolvedCount, icon: ClipboardList, color: "text-indigo-500 bg-indigo-500/10" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6 space-y-10">

        <div className="text-right">
          <h1 className="text-2xl font-bold text-secondary"> إحصائياتي</h1>
          <p className="text-muted text-sm mt-1">ملخص نشاطك في الكورسات المشترك بها</p>
        </div>

        {errorMessage ? (
          <div className="text-center py-16 border-2 border-dashed border-red-200 bg-red-50 rounded-3xl">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="font-bold text-red-600">{errorMessage}</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  className="bg-card border border-border rounded-3xl p-5 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3 ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-secondary">{card.value}</p>
                  <p className="text-xs text-muted mt-1">{card.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Circles */}
            <div className="bg-card border border-border rounded-3xl p-6">
              <h2 className="font-bold text-secondary text-right mb-6">نسبة الإنجاز</h2>
              <div className="grid grid-cols-3 gap-6 justify-items-center">
                <CircleStat label="فيديوهات مشاهدة" value={videosWatchedCount} total={videosWatchedCount} color="#f59e0b" />
                <CircleStat label="اختبارات محلولة" value={examsSolvedCount} total={examsSolvedCount} color="#a855f7" />
                <CircleStat label="واجبات محلولة" value={assignmentsSolvedCount} total={assignmentsSolvedCount} color="#6366f1" />
              </div>
            </div>

            {/* Logs */}
            <div className="space-y-4">
              <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
                <button
                  onClick={() => setLogTab("videos")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    logTab === "videos" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"
                  }`}
                >
                  سجل الفيديوهات ({videoLogs.length})
                </button>
                <button
                  onClick={() => setLogTab("exams")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    logTab === "exams" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"
                  }`}
                >
                  سجل الاختبارات ({examLogs.length})
                </button>
                <button
                  onClick={() => setLogTab("assignments")}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    logTab === "assignments" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"
                  }`}
                >
                  سجل الواجبات ({assignmentLogs.length})
                </button>
              </div>

              <AnimatePresence mode="wait">
                {logTab === "videos" && (
                  <motion.div key="videos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {videoLogs.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                        <p className="text-muted text-sm">لا يوجد فيديوهات مشاهدة بعد</p>
                      </div>
                    ) : (
                      <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border">
                        {videoLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between px-5 py-3 text-right">
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.watchedAt)}
                            </span>
                            <div>
                              <p className="font-bold text-secondary text-sm">{log.videoTitle}</p>
                              <p className="text-xs text-muted mt-0.5">{log.courseTitle}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {logTab === "exams" && (
                  <motion.div key="exams" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {examLogs.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                        <p className="text-muted text-sm">لا يوجد اختبارات محلولة بعد</p>
                      </div>
                    ) : (
                      <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border">
                        {examLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between px-5 py-3 text-right">
                            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                              {log.score}/{log.total}
                            </span>
                            <div className="flex-1 mx-4">
                              <p className="font-bold text-secondary text-sm">{log.examTitle}</p>
                              <p className="text-xs text-muted mt-0.5">{log.courseTitle}</p>
                            </div>
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.submittedAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {logTab === "assignments" && (
                  <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {assignmentLogs.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                        <p className="text-muted text-sm">لا يوجد واجبات محلولة بعد</p>
                      </div>
                    ) : (
                      <div className="bg-card border border-border rounded-3xl overflow-hidden divide-y divide-border">
                        {assignmentLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between px-5 py-3 text-right">
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                              log.grade === null ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                            }`}>
                              {log.grade === null ? "قيد التصحيح" : log.grade}
                            </span>
                            <div className="flex-1 mx-4">
                              <p className="font-bold text-secondary text-sm">{log.assignmentTitle}</p>
                              <p className="text-xs text-muted mt-0.5">{log.courseTitle}</p>
                            </div>
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.submittedAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default StudentStats
