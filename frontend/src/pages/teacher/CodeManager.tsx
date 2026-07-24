import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Plus, Download, Copy, CheckCircle2, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"
import Toast from "../../components/ui/Toast"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetCodes, generateCodes } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"

interface ActivationCode {
  id: string
  code: string
  courseId: number
  courseTitle: string
  grade: string
  createdAt: string
  isUsed: boolean
}

interface ApiCode {
  id: number
  code: string
  courseId: number
  courseTitle: string
  isUsed: boolean
  createdAt: string
}

interface ApiGeneratedCode {
  code: string
  course_id: number
  created_at: string
}

function CodeManager() {
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [count, setCount] = useState("10")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [filterGrade, setFilterGrade] = useState("")
  const [filterCourseId, setFilterCourseId] = useState("")
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()
  const { courses } = useTeacherCoursesGroups(getToken())

  const mapApiCode = useCallback((c: ApiCode): ActivationCode => {
    return {
      id: String(c.id),
      code: c.code,
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      grade: courses.find((co) => co.id === c.courseId)?.grade || "",
      createdAt: c.createdAt,
      isUsed: c.isUsed,
    }
  }, [courses])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetCodes(token).then((data) => { if (Array.isArray(data)) setCodes(data.map(mapApiCode)) })
  }, [getToken, mapApiCode])

  const coursesForGrade = courses.filter((c) => c.grade === selectedGrade)
  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId))

  const filteredCodes = codes.filter((c) => {
    if (filterGrade && c.grade !== filterGrade) return false
    if (filterCourseId && c.courseId.toString() !== filterCourseId) return false
    return true
  })

  async function handleGenerate() {
    if (!selectedGrade) { addToast("اختر الصف الدراسي", "error"); return }
    if (!selectedCourseId) { addToast("اختر الكورس", "error"); return }
    const n = parseInt(count)
    if (!n || n < 1 || n > 500) { addToast("أدخل عدداً بين 1 و 500", "error"); return }

    setIsLoading(true)
    const token = getToken()
    const data = await generateCodes({ courseId: Number(selectedCourseId), count: n }, token!)
    setIsLoading(false)

    if (data.success) {
      const newCodes: ActivationCode[] = (data.codes as ApiGeneratedCode[]).map((c) => ({
        id: c.code,
        code: c.code,
        courseId: c.course_id,
        courseTitle: selectedCourse?.title || "كورس غير معروف",
        grade: selectedGrade,
        createdAt: c.created_at,
        isUsed: false,
      }))
      setCodes((prev) => [...newCodes, ...prev])
      addToast(`تم إنشاء ${data.count} كود بنجاح ✓`, "success")
      exportToExcel(newCodes, selectedCourse?.title || "كورس")
    } else {
      addToast(data.message || "حدث خطأ أثناء إنشاء الأكواد", "error")
    }
  }

  function exportToExcel(codesList: ActivationCode[], courseTitle: string) {
    const data = codesList.map((c) => ({
      "اسم الكورس": c.courseTitle,
      "تاريخ الإنشاء": new Date(c.createdAt).toLocaleDateString("ar-EG"),
      "الكود": c.code,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "الأكواد")

    // Column widths
    ws["!cols"] = [{ wch: 40 }, { wch: 20 }, { wch: 15 }]

    XLSX.writeFile(wb, `أكواد-${courseTitle}-${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.xlsx`)
  }

  function handleDownloadFiltered() {
    if (filteredCodes.length === 0) { addToast("لا توجد أكواد للتنزيل", "error"); return }
    exportToExcel(filteredCodes, filterCourseId ? codes.find((c) => c.courseId.toString() === filterCourseId)?.courseTitle || "الكورس" : "كل الكورسات")
    addToast("تم تنزيل الملف بنجاح ✓", "success")
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    addToast("تم نسخ الكود ✓", "success")
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إنشاء الأكواد</h1>
        <p className="text-muted text-sm mt-1">إنشاء أكواد تفعيل للكورسات وتنزيلها</p>
      </div>

      {/* Generate Form */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
        <div className="text-right border-b border-border pb-4">
          <h2 className="font-bold text-secondary text-lg">إنشاء أكواد جديدة</h2>
          <p className="text-muted text-sm mt-1">كل كود مكون من 8 أرقام عشوائية فريدة</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Grade */}
          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الصف الدراسي *</label>
            <select
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setSelectedCourseId("") }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">اختر الصف</option>
              {grades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Course */}
          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الكورس *</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={!selectedGrade || coursesForGrade.length === 0}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
            >
              <option value="">{!selectedGrade ? "اختر الصف أولاً" : coursesForGrade.length === 0 ? "لا يوجد كورسات" : "اختر الكورس"}</option>
              {coursesForGrade.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {/* Count */}
          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">عدد الأكواد *</label>
            <input
              type="number"
              min="1"
              max="500"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
        >
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" />جاري الإنشاء والتنزيل...</>
          ) : (
            <><Plus className="w-5 h-5" />إنشاء الأكواد وتنزيل Excel</>
          )}
        </button>
      </div>

      {/* Codes List */}
      {codes.length > 0 && (
        <div className="space-y-4">

          {/* Filter + Download */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadFiltered}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition"
            >
              <Download className="w-4 h-4" />
              تنزيل المعروض
            </button>

            <select
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              disabled={!filterGrade}
              className="px-4 py-2.5 rounded-xl bg-card border border-border outline-none text-sm text-right disabled:opacity-50"
            >
              <option value="">كل الكورسات</option>
              {[...new Set(codes.filter((c) => !filterGrade || c.grade === filterGrade).map((c) => c.courseId))].map((id) => {
                const title = codes.find((c) => c.courseId === id)?.courseTitle
                return <option key={id} value={id}>{title}</option>
              })}
            </select>

            <select
              value={filterGrade}
              onChange={(e) => { setFilterGrade(e.target.value); setFilterCourseId("") }}
              className="px-4 py-2.5 rounded-xl bg-card border border-border outline-none text-sm text-right"
            >
              <option value="">كل الصفوف</option>
              {[...new Set(codes.map((c) => c.grade))].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>

            <span className="text-sm text-muted font-bold mr-auto">
              {filteredCodes.length} كود
            </span>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-background border-b border-border text-xs font-bold text-muted text-right">
              <span className="col-span-2">الكورس</span>
              <span>الصف</span>
              <span>الكود</span>
              <span className="text-center">الحالة</span>
            </div>

            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filteredCodes.map((c) => (
                <motion.div
                  key={c.id}
                  className="grid grid-cols-5 gap-4 px-6 py-3 items-center hover:bg-primary/3 transition text-right"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="col-span-2">
                    <p className="font-bold text-secondary text-sm">{c.courseTitle}</p>
                    <p className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString("ar-EG")}</p>
                  </div>

                  <span className="text-xs text-text">{c.grade}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(c.code)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 transition text-muted hover:text-primary"
                    >
                      {copiedCode === c.code
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : <Copy className="w-3.5 h-3.5" />
                      }
                    </button>
                    <span className="font-mono font-bold text-secondary text-sm" dir="ltr">{c.code}</span>
                  </div>

                  <div className="flex justify-center">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      c.isUsed
                        ? "bg-muted/10 text-muted"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}>
                      {c.isUsed ? "مستخدم" : "متاح"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CodeManager