import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Trash2, Ban, CheckCircle2, AlertTriangle,
  BookOpen, User, Loader2, X
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import useToast from "../../hooks/useToast"
import { useAuth } from "../../context/useAuth"
import { teacherGetSubscriptions, teacherCancelSubscription, teacherBanStudent, teacherUnbanStudent } from "../../services/api"

interface ApiSubscription {
  studentId: number
  studentName: string
  studentPhone: string
  grade: string
  courseId: number
  courseTitle: string
  enrolledAt: string
  isBanned: boolean
}

interface CourseSubscription {
  courseId: string
  courseTitle: string
  grade: string
  code: string
  subscribedAt: string
  isBanned: boolean
}

interface StudentResult {
  id: string
  fullName: string
  studentPhone: string
  grade: string
  subscriptions: CourseSubscription[]
}

type ActionType = "cancel" | "ban" | null

function SubscriptionControl() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<StudentResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: ActionType
    courseId: string
    courseTitle: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()

  async function handleSearch() {
    if (!searchQuery.trim()) { addToast("يرجى إدخال بيانات البحث", "error"); return }
    setIsLoading(true)
    setResult(null)
    setNotFound(false)

    const token = getToken()
    if (token) {
      const data: ApiSubscription[] = await teacherGetSubscriptions(token)
      if (Array.isArray(data)) {
        const found = data.find((s) =>
          s.studentName?.includes(searchQuery) ||
          s.studentPhone?.includes(searchQuery)
        )
        if (found) {
          const studentSubs = data.filter((s) => s.studentId === found.studentId)
          setResult({
            id: String(found.studentId),
            fullName: found.studentName,
            studentPhone: found.studentPhone,
            grade: found.grade,
            subscriptions: studentSubs.map((s) => ({
              courseId: String(s.courseId),
              courseTitle: s.courseTitle,
              grade: s.grade,
              code: "",
              subscribedAt: s.enrolledAt,
              isBanned: s.isBanned,
            })),
          })
        } else {
          setNotFound(true)
        }
      }
    }
    setIsLoading(false)
  }

  function handleCancelSubscription(courseId: string, courseTitle: string) {
    setConfirmAction({ type: "cancel", courseId, courseTitle })
  }

  function handleBan(courseId: string, courseTitle: string) {
    setConfirmAction({ type: "ban", courseId, courseTitle })
  }

  async function handleUnban(courseId: string) {
    if (!result) return
    setActionLoading(true)
    const token = getToken()
    const data = await teacherUnbanStudent({ studentId: Number(result.id), courseId: Number(courseId) }, token!)
    setActionLoading(false)
    if (data.success) {
      setResult((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          subscriptions: prev.subscriptions.map((s) =>
            s.courseId === courseId ? { ...s, isBanned: false } : s
          ),
        }
      })
      addToast("تم رفع الحظر بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء رفع الحظر", "error")
    }
  }

  async function executeAction() {
    if (!confirmAction || !result) return
    setActionLoading(true)
    const token = getToken()

    if (confirmAction.type === "cancel") {
      const data = await teacherCancelSubscription({ studentId: Number(result.id), courseId: Number(confirmAction.courseId) }, token!)
      setActionLoading(false)
      if (data.success) {
        setResult((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            subscriptions: prev.subscriptions.filter((s) => s.courseId !== confirmAction.courseId),
          }
        })
        addToast(`تم إلغاء اشتراك "${result.fullName}" من "${confirmAction.courseTitle}" ✓`, "success")
      } else {
        addToast(data.message || "حدث خطأ أثناء إلغاء الاشتراك", "error")
      }
    } else if (confirmAction.type === "ban") {
      const data = await teacherBanStudent({ studentId: Number(result.id), courseId: Number(confirmAction.courseId) }, token!)
      setActionLoading(false)
      if (data.success) {
        setResult((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            subscriptions: prev.subscriptions.map((s) =>
              s.courseId === confirmAction.courseId ? { ...s, isBanned: true } : s
            ),
          }
        })
        addToast(`تم حظر "${result.fullName}" من "${confirmAction.courseTitle}" ✓`, "success")
      } else {
        addToast(data.message || "حدث خطأ أثناء الحظر", "error")
      }
    }
    setConfirmAction(null)
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إلغاء وحظر الاشتراكات</h1>
        <p className="text-muted text-sm mt-1">ابحث عن طالب لإدارة اشتراكاته</p>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">
            ابحث باسم الطالب أو رقم الهاتف أو الكود
          </label>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2 flex-shrink-0"
            >
              {isLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Search className="w-4 h-4" />
              }
              بحث
            </button>
            <input
              type="text"
              placeholder="اسم الطالب / رقم الهاتف / الكود"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setResult(null); setNotFound(false) }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>

        {/* Not Found */}
        {notFound && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-3xl p-8 text-center"
          >
            <X className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="font-bold text-secondary text-lg mb-2">لا توجد نتائج</h3>
            <p className="text-muted text-sm">لم يتم العثور على طالب بهذه البيانات</p>
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Student Info */}
            <div className="bg-card border border-border rounded-3xl p-5">
              <div className="flex items-center gap-4 justify-end">
                <div className="text-right">
                  <h3 className="font-bold text-secondary text-lg">{result.fullName}</h3>
                  <p className="text-muted text-sm" dir="ltr">{result.studentPhone}</p>
                  <p className="text-xs text-muted mt-0.5">{result.grade}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            {/* Subscriptions */}
            {result.subscriptions.length === 0 ? (
              <div className="bg-card border border-border rounded-3xl p-8 text-center">
                <BookOpen className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="font-bold text-muted">لا يوجد اشتراكات نشطة</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-secondary text-right">الكورسات المشترك فيها:</h3>
                {result.subscriptions.map((sub) => (
                  <motion.div
                    key={sub.courseId}
                    className={`bg-card border rounded-2xl p-5 ${
                      sub.isBanned ? "border-red-200 bg-red-50/30" : "border-border"
                    }`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center justify-between gap-4">

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {sub.isBanned ? (
                          <button
                            onClick={() => handleUnban(sub.courseId)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            رفع الحظر
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleBan(sub.courseId, sub.courseTitle)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition"
                            >
                              <Ban className="w-4 h-4" />
                              حظر
                            </button>
                            <button
                              onClick={() => handleCancelSubscription(sub.courseId, sub.courseTitle)}
                              className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-100 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                              إلغاء الاشتراك
                            </button>
                          </>
                        )}
                      </div>

                      {/* Course Info */}
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          {sub.isBanned && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Ban className="w-3 h-3" />
                              محظور
                            </span>
                          )}
                          <h4 className="font-bold text-secondary">{sub.courseTitle}</h4>
                        </div>
                        <p className="text-xs text-muted">{sub.grade}</p>
                        <div className="flex items-center gap-4 mt-2 justify-end text-xs text-muted">
                          <span>تاريخ الاشتراك: {new Date(sub.subscribedAt).toLocaleDateString("ar-EG")}</span>
                          <span dir="ltr">كود: {sub.code}</span>
                        </div>
                      </div>

                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmAction(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-md z-10 text-center shadow-2xl"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                confirmAction.type === "ban" ? "bg-red-100" : "bg-amber-100"
              }`}>
                {confirmAction.type === "ban"
                  ? <Ban className="w-7 h-7 text-red-500 animate-bounce" />
                  : <AlertTriangle className="w-7 h-7 text-amber-500 animate-bounce" />
                }
              </div>

              <h2 className="text-xl font-bold text-secondary mb-2">
                {confirmAction.type === "ban" ? "تأكيد الحظر" : "تأكيد إلغاء الاشتراك"}
              </h2>

              <p className="text-muted text-sm leading-7 mb-2">
                {confirmAction.type === "ban" ? (
                  <>
                    هل أنت متأكد من حظر
                    <strong className="text-secondary mx-1">"{result?.fullName}"</strong>
                    من كورس
                    <strong className="text-secondary mx-1">"{confirmAction.courseTitle}"</strong>؟
                    <br />
                    الطالب لن يتمكن من الدخول للكورس.
                  </>
                ) : (
                  <>
                    هل أنت متأكد من إلغاء اشتراك
                    <strong className="text-secondary mx-1">"{result?.fullName}"</strong>
                    من كورس
                    <strong className="text-secondary mx-1">"{confirmAction.courseTitle}"</strong>؟
                    <br />
                    الطالب يمكنه الاشتراك مجدداً بكود جديد.
                  </>
                )}
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-3 bg-background border border-border text-text font-bold rounded-xl hover:border-primary transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />إلغاء
                </button>
                <button
                  onClick={executeAction}
                  disabled={actionLoading}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2 ${
                    confirmAction.type === "ban"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {actionLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />جاري التنفيذ...</>
                  ) : confirmAction.type === "ban" ? (
                    <><Ban className="w-4 h-4" />تأكيد الحظر</>
                  ) : (
                    <><Trash2 className="w-4 h-4" />إلغاء الاشتراك</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default SubscriptionControl