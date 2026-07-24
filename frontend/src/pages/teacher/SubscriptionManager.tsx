import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import Toast from "../../components/ui/Toast"
import useToast from "../../hooks/useToast"
import { useAuth } from "../../context/useAuth"
import { teacherGetSubscriptions } from "../../services/api"

interface CourseSubscription {
  courseId: string
  courseTitle: string
  grade: string
  subscribedAt: string
}

interface Student {
  id: string
  studentCode: string
  fullName: string
  studentPhone: string
  parentPhone: string
  governorate: string
  educationType: string
  grade: string
  subscriptions: CourseSubscription[]
}

interface ApiSubscription {
  id: number
  studentId: number
  studentCode: string
  studentName: string
  studentPhone: string
  parentPhone: string
  governorate: string
  educationType: string
  grade: string
  courseId: number
  courseTitle: string
  enrolledAt: string
  isBanned: boolean
}

function groupSubscriptions(rows: ApiSubscription[]): Student[] {
  const byStudent = new Map<number, Student>()

  for (const row of rows) {
    const existing = byStudent.get(row.studentId)
    const subscription: CourseSubscription = {
      courseId: String(row.courseId),
      courseTitle: row.courseTitle,
      grade: row.grade,
      subscribedAt: row.enrolledAt,
    }

    if (existing) {
      existing.subscriptions.push(subscription)
    } else {
      byStudent.set(row.studentId, {
        id: String(row.studentId),
        studentCode: row.studentCode,
        fullName: row.studentName,
        studentPhone: row.studentPhone,
        parentPhone: row.parentPhone,
        governorate: row.governorate,
        educationType: row.educationType,
        grade: row.grade,
        subscriptions: [subscription],
      })
    }
  }

  return Array.from(byStudent.values())
}

function SubscriptionManager() {
  const [students, setStudents] = useState<ApiSubscription[]>([])
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { toasts, removeToast } = useToast()
  const { getToken } = useAuth()

  useEffect(() => {
    const token = getToken()
    if (token) teacherGetSubscriptions(token).then((data) => { if (Array.isArray(data)) setStudents(data) })
  }, [getToken])

  const subscribedStudents = groupSubscriptions(students)

  const filtered = subscribedStudents.filter((s) =>
    s.fullName.includes(search) ||
    s.studentPhone.includes(search) ||
    s.grade.includes(search)
  )

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة الاشتراكات</h1>
        <p className="text-muted text-sm mt-1">عرض الطلاب المشتركين والكورسات الخاصة بهم</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="ابحث باسم الطالب أو رقم الهاتف أو الصف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 pr-12 rounded-xl bg-card border border-border outline-none transition focus:border-primary text-right"
        />
        <Search className="absolute right-4 top-3.5 w-4 h-4 text-muted" />
      </div>

      {/* List */}
      {subscribedStudents.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
          <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-bold text-secondary text-lg mb-2">لا يوجد اشتراكات</h3>
          <p className="text-muted text-sm">الطلاب المشتركون في الكورسات سيظهرون هنا</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-card border border-border rounded-2xl">
          <p className="text-muted font-bold">لا توجد نتائج للبحث</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-x-auto">

          {/* Table Header */}
          <div className="grid grid-cols-9 gap-4 px-6 py-3 bg-background border-b border-border text-xs font-bold text-muted text-right min-w-[950px]">
            <span>كود الطالب</span>
            <span>اسم الطالب</span>
            <span>رقم هاتف الطالب</span>
            <span>رقم ولي الأمر</span>
            <span>المحافظة</span>
            <span>نوع التعليم</span>
            <span>الصف الدراسي</span>
            <span>عدد الاشتراكات</span>
            <span className="text-center">الكورسات</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {filtered.map((student) => (
              <div key={student.id}>
                <motion.div
                  className="grid grid-cols-9 gap-4 px-6 py-4 items-center hover:bg-primary/3 transition text-right cursor-pointer min-w-[950px]"
                  onClick={() => setExpandedId(expandedId === student.id ? null : student.id)}
                >
                  {/* Student Code */}
                  <span className="text-sm font-mono font-bold text-secondary" dir="ltr">{student.studentCode}</span>

                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {student.fullName.charAt(0)}
                      </span>
                    </div>
                    <p className="font-bold text-secondary text-sm">{student.fullName}</p>
                  </div>

                  {/* Student Phone */}
                  <span className="text-sm text-text" dir="ltr">{student.studentPhone}</span>

                  {/* Parent Phone */}
                  <span className="text-sm text-text" dir="ltr">{student.parentPhone}</span>

                  {/* Governorate */}
                  <span className="text-sm text-text">{student.governorate}</span>

                  {/* Education Type */}
                  <span className="text-sm text-text">{student.educationType}</span>

                  {/* Grade */}
                  <span className="text-sm text-text">{student.grade}</span>

                  {/* Subscriptions Count */}
                  <span className="text-sm font-bold text-primary">
                    {student.subscriptions.length} كورس
                  </span>

                  {/* Toggle Button */}
                  <div className="flex justify-center">
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        expandedId === student.id
                          ? "bg-primary text-white"
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      الكورسات
                      {expandedId === student.id
                        ? <ChevronUp className="w-4 h-4" />
                        : <ChevronDown className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </motion.div>

                {/* Expanded Courses */}
                <AnimatePresence>
                  {expandedId === student.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-primary/3 border-t border-border">
                        <h4 className="font-bold text-secondary text-sm text-right mb-3">
                          كورسات {student.fullName}:
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {student.subscriptions.map((sub) => (
                            <motion.div
                              key={sub.courseId}
                              className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                            >
                              <div className="text-xs text-muted">
                                {new Date(sub.subscribedAt).toLocaleDateString("ar-EG")}
                              </div>
                              <p className="font-bold text-secondary text-sm">{sub.courseTitle}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default SubscriptionManager