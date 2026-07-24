import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, CheckCircle2, XCircle, User, BookOpen, Calendar, Phone, MapPin, GraduationCap } from "lucide-react"
import Toast from "../../components/ui/Toast"
import useToast from "../../hooks/useToast"
import { useAuth } from "../../context/useAuth"
import { teacherGetCodeDetails } from "../../services/api"

interface CodeInfo {
  code: string
  courseTitle: string
  createdAt: string
  isUsed: boolean
  student?: {
    fullName: string
    studentPhone: string
    parentPhone: string
    governorate: string
    gender: string
    grade: string
    educationType: string
    usedAt: string
  }
}

function CodeDetails() {
  const [searchCode, setSearchCode] = useState("")
  const [result, setResult] = useState<CodeInfo | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()

  async function handleSearch() {
    if (!searchCode.trim()) { addToast("يرجى إدخال الكود", "error"); return }
    if (searchCode.trim().length !== 8 || !/^\d+$/.test(searchCode.trim())) {
      addToast("الكود يجب أن يكون 8 أرقام", "error"); return
    }

    setIsLoading(true)
    setResult(null)
    setNotFound(false)

    const token = getToken()
    if (token) {
      const data = await teacherGetCodeDetails(searchCode.trim(), token)
      if (data.code) {
        setResult(data)
      } else {
        setNotFound(true)
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">تفاصيل الكود</h1>
        <p className="text-muted text-sm mt-1">ابحث عن كود لعرض بياناته وحالة استخدامه</p>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">أدخل الكود (8 أرقام)</label>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2 flex-shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              بحث
            </button>
            <input
              type="text"
              placeholder="مثال: 12345678"
              value={searchCode}
              onChange={(e) => {
                setSearchCode(e.target.value.replace(/\D/g, "").slice(0, 8))
                setResult(null)
                setNotFound(false)
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right font-mono text-lg tracking-widest"
              maxLength={8}
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>

        {/* Not Found */}
        {notFound && !result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-card border border-border rounded-3xl p-8 text-center"
          >
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="font-bold text-secondary text-lg mb-2">الكود غير موجود</h3>
            <p className="text-muted text-sm">الكود <span className="font-mono font-bold text-secondary">{searchCode}</span> غير موجود في النظام</p>
          </motion.div>
        )}

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Code Info */}
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  result.isUsed
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}>
                  {result.isUsed
                    ? <><XCircle className="w-4 h-4" />مستخدم</>
                    : <><CheckCircle2 className="w-4 h-4" />متاح</>
                  }
                </span>
                <h2 className="font-bold text-secondary text-lg">بيانات الكود</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-background border border-border rounded-2xl p-4 text-right">
                  <p className="text-xs text-muted mb-1">الكود</p>
                  <p className="font-mono font-bold text-secondary text-xl tracking-widest" dir="ltr">{result.code}</p>
                </div>
                <div className="bg-background border border-border rounded-2xl p-4 text-right">
                  <p className="text-xs text-muted mb-1">الكورس</p>
                  <p className="font-bold text-secondary">{result.courseTitle}</p>
                </div>
                <div className="bg-background border border-border rounded-2xl p-4 text-right">
                  <p className="text-xs text-muted mb-1">تاريخ الإنشاء</p>
                  <p className="font-bold text-secondary">
                    {new Date(result.createdAt).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Info */}
            {result.isUsed && result.student ? (
              <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                <h2 className="font-bold text-secondary text-lg text-right border-b border-border pb-4">
                  بيانات الطالب المستخدم
                </h2>

                <div className="grid md:grid-cols-2 gap-4">

                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-4">
                    <User className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="text-right flex-1">
                      <p className="text-xs text-muted">الاسم</p>
                      <p className="font-bold text-secondary">{result.student.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-4">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="text-right flex-1">
                      <p className="text-xs text-muted">رقم هاتف الطالب</p>
                      <p className="font-bold text-secondary" dir="ltr">{result.student.studentPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-4">
                    <Phone className="w-5 h-5 text-muted flex-shrink-0" />
                    <div className="text-right flex-1">
                      <p className="text-xs text-muted">رقم ولي الأمر</p>
                      <p className="font-bold text-secondary" dir="ltr">{result.student.parentPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-4">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="text-right flex-1">
                      <p className="text-xs text-muted">المحافظة</p>
                      <p className="font-bold text-secondary">{result.student.governorate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-4">
                    <GraduationCap className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="text-right flex-1">
                      <p className="text-xs text-muted">الصف الدراسي</p>
                      <p className="font-bold text-secondary">{result.student.grade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-4">
                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="text-right flex-1">
                      <p className="text-xs text-muted">نوع التعليم</p>
                      <p className="font-bold text-secondary">{result.student.educationType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background border border-border rounded-2xl p-4 md:col-span-2">
                    <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="text-right flex-1">
                      <p className="text-xs text-muted">تاريخ استخدام الكود</p>
                      <p className="font-bold text-secondary">
                        {new Date(result.student.usedAt).toLocaleDateString("ar-EG", {
                          year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            ) : result.isUsed ? (
              <div className="bg-card border border-border rounded-3xl p-6 text-center">
                <p className="text-muted">لا تتوفر بيانات الطالب</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-emerald-700 text-lg">الكود متاح للاستخدام</h3>
                <p className="text-emerald-600 text-sm mt-1">لم يستخدم أحد هذا الكود بعد</p>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  )
}

export default CodeDetails