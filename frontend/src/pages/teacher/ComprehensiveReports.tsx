import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Search, FileSpreadsheet, Users, RotateCcw, ArrowUpDown,
  ArrowUp, ArrowDown, Loader2, AlertTriangle, ChevronRight, ChevronLeft,
} from "lucide-react"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetComprehensiveReport } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import { exportToExcel } from "../../utils/exportExcel"
import { computeStudentLevel, getStudentRating } from "../../utils/studentLevel"
import type { ComprehensiveReportFilters, ComprehensiveReportResponse, StudentReportRow } from "../../types/report"

type SortField =
  | "name" | "phone" | "videosWatchedCount" | "avgWatchPercent"
  | "examsSolvedCount" | "avgExamScorePercent" | "totalWatchTimeMinutes"
  | "examCompletionPercent" | "videoCompletionPercent" | "level" | "lastActivityAt"

const columns: { field: SortField; label: string }[] = [
  { field: "name", label: "اسم الطالب" },
  { field: "phone", label: "رقم الهاتف" },
  { field: "videosWatchedCount", label: "الفيديوهات المشاهدة" },
  { field: "avgWatchPercent", label: "متوسط نسبة المشاهدة" },
  { field: "examsSolvedCount", label: "الاختبارات المحلولة" },
  { field: "avgExamScorePercent", label: "متوسط درجات الاختبارات" },
  { field: "totalWatchTimeMinutes", label: "إجمالي وقت المشاهدة" },
  { field: "examCompletionPercent", label: "نسبة إنجاز الاختبارات" },
  { field: "videoCompletionPercent", label: "نسبة إنجاز الفيديوهات" },
  { field: "level", label: "مستوى الطالب" },
]

// Explicit, content-aware column widths (kept identical on the header row and every
// data row) instead of an equal 11-way split — the old equal split squeezed the name/
// progress-bar columns and stretched the short percentage columns, which looked messy.
const TABLE_GRID_COLS =
  "grid-cols-[minmax(200px,2fr)_minmax(120px,1fr)_minmax(130px,1fr)_minmax(160px,1.3fr)_minmax(130px,1fr)_minmax(160px,1.3fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(150px,1.2fr)_minmax(120px,1fr)_minmax(110px,1fr)]"

const RANGE_PRESETS = ["0-25", "26-50", "51-70", "71-80", "81-90", "91-100"]

function rangeFromPreset(preset: string) {
  if (!preset) return undefined
  const [min, max] = preset.split("-").map(Number)
  return { min, max }
}

function formatWatchTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours <= 0) return `${rest} دقيقة`
  return `${hours} ساعة${rest > 0 ? ` و${rest} دقيقة` : ""}`
}

const PODIUM_STYLES = [
  { medal: "🥇", ring: "border-amber-300 bg-amber-50", bar: "bg-amber-400" },
  { medal: "🥈", ring: "border-slate-300 bg-slate-50", bar: "bg-slate-400" },
  { medal: "🥉", ring: "border-orange-300 bg-orange-50", bar: "bg-orange-400" },
]

function ComprehensiveReports() {
  const { getToken } = useAuth()
  const { courses } = useTeacherCoursesGroups(getToken())

  const [search, setSearch] = useState("")
  const [phone, setPhone] = useState("")
  const [grade, setGrade] = useState("")
  const [courseId, setCourseId] = useState("")
  const [levelPreset, setLevelPreset] = useState("")
  const [watchPreset, setWatchPreset] = useState("")
  const [examAvgPreset, setExamAvgPreset] = useState("")

  const [sortField, setSortField] = useState<SortField>("level")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [data, setData] = useState<ComprehensiveReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Debounce free-text inputs so every keystroke doesn't fire a server request.
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [debouncedPhone, setDebouncedPhone] = useState(phone)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPhone(phone), 400)
    return () => clearTimeout(t)
  }, [phone])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    let cancelled = false

    const filters: ComprehensiveReportFilters = {
      search: debouncedSearch || undefined,
      phone: debouncedPhone || undefined,
      grade: grade || undefined,
      courseId: courseId ? Number(courseId) : undefined,
      level: rangeFromPreset(levelPreset),
      watchPercent: rangeFromPreset(watchPreset),
      examAvgPercent: rangeFromPreset(examAvgPreset),
      sortField,
      sortDir,
      page,
      pageSize,
    }

    // Deferred to a microtask so the loading/error resets happen inside a callback
    // rather than synchronously in the effect body.
    Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
      setErrorMessage(null)
    })

    teacherGetComprehensiveReport(filters, token).then((res) => {
      if (cancelled) return
      setLoading(false)
      if (!res || "error" in res) {
        setErrorMessage((res && "message" in res && res.message) || "تعذر تحميل التقرير")
        setData(null)
        return
      }
      setData(res)
    })

    return () => { cancelled = true }
  }, [getToken, debouncedSearch, debouncedPhone, grade, courseId, levelPreset, watchPreset, examAvgPreset, sortField, sortDir, page, pageSize])

  function resetFilters() {
    setSearch("")
    setPhone("")
    setGrade("")
    setCourseId("")
    setLevelPreset("")
    setWatchPreset("")
    setExamAvgPreset("")
    setPage(1)
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function rowToExportRecord(row: StudentReportRow) {
    const level = computeStudentLevel(row)
    return {
      "اسم الطالب": row.name,
      "رقم الهاتف": row.phone,
      "رقم هاتف ولي الأمر": row.parentPhone || "—",
      "الفيديوهات المشاهدة": `${row.videosWatchedCount} / ${row.videosTotalCount}`,
      "متوسط نسبة المشاهدة": `${row.avgWatchPercent}%`,
      "الاختبارات المحلولة": `${row.examsSolvedCount} / ${row.examsTotalCount}`,
      "متوسط درجات الاختبارات": `${row.avgExamScorePercent}%`,
      "إجمالي وقت المشاهدة": formatWatchTime(row.totalWatchTimeMinutes),
      "نسبة إنجاز الاختبارات": `${row.examCompletionPercent}%`,
      "نسبة إنجاز الفيديوهات": `${row.videoCompletionPercent}%`,
      "مستوى الطالب": `${level}%`,
      "تقييم الطالب": getStudentRating(level).label,
      "آخر نشاط": row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString("ar-EG") : "—",
    }
  }

  function handleExport() {
    if (!data || data.rows.length === 0) return
    exportToExcel(data.rows.map(rowToExportRecord), "التقارير-الشاملة")
  }

  const rows = data?.rows ?? []
  const topStudents = data?.topStudents ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">التقارير الشاملة</h1>
        <p className="text-muted text-sm mt-1">
          عرض وتحليل الأداء الكامل لجميع الطلاب داخل المنصة مع إمكانية البحث والفلترة والتصدير.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
          <h2 className="font-bold text-secondary">فلاتر التقرير</h2>
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4" />
            تحميل التقرير Excel
          </button>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="relative text-right">
            <label className="block text-sm font-bold text-text mb-2">اسم الطالب</label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="ابحث بالاسم..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            />
            <Search className="absolute right-4 top-11 w-4 h-4 text-muted" />
          </div>

          <div className="relative text-right">
            <label className="block text-sm font-bold text-text mb-2">رقم الهاتف</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPage(1) }}
              placeholder="ابحث برقم الهاتف..."
              dir="ltr"
              className="w-full px-4 py-3 pr-12 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            />
            <Search className="absolute right-4 top-11 w-4 h-4 text-muted" />
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
            <select
              value={grade}
              onChange={(e) => { setGrade(e.target.value); setCourseId(""); setPage(1) }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">كل الصفوف</option>
              {grades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الكورس</label>
            <select
              value={courseId}
              onChange={(e) => { setCourseId(e.target.value); setPage(1) }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">كل الكورسات</option>
              {courses.filter((c) => !grade || c.grade === grade).map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">مستوى الطالب</label>
            <select
              value={levelPreset}
              onChange={(e) => { setLevelPreset(e.target.value); setPage(1) }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">كل المستويات</option>
              {RANGE_PRESETS.map((p) => <option key={p} value={p}>{p}%</option>)}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">نسبة المشاهدة</label>
            <select
              value={watchPreset}
              onChange={(e) => { setWatchPreset(e.target.value); setPage(1) }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">كل النسب</option>
              {RANGE_PRESETS.map((p) => <option key={p} value={p}>{p}%</option>)}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">متوسط نتائج الاختبارات</label>
            <select
              value={examAvgPreset}
              onChange={(e) => { setExamAvgPreset(e.target.value); setPage(1) }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">كل النسب</option>
              {RANGE_PRESETS.map((p) => <option key={p} value={p}>{p}%</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full flex items-center justify-center gap-2 bg-background border border-border text-muted px-4 py-3 rounded-xl font-bold text-sm hover:bg-border/40 transition"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة تعيين الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Top 10 Students */}
      <div className="space-y-4">
        <h2 className="font-bold text-secondary text-right">أفضل 10 طلاب على المنصة</h2>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : topStudents.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-border rounded-3xl">
            <p className="text-sm text-muted">لا توجد بيانات كافية لعرض الترتيب حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {topStudents.slice(0, 10).map((student, index) => {
              const level = computeStudentLevel(student)
              const rating = getStudentRating(level)
              const podium = PODIUM_STYLES[index]
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative border rounded-2xl p-4 text-right space-y-3 ${podium ? podium.ring : "border-border bg-card"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-secondary">
                      {podium ? podium.medal : `#${index + 1}`}
                    </span>
                    {student.avatar ? (
                      <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{student.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-secondary text-sm truncate">{student.name}</p>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${rating.className}`}>
                    {rating.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${podium ? podium.bar : "bg-primary"}`} style={{ width: `${level}%` }} />
                    </div>
                    <span className="text-xs font-bold text-secondary">{level}%</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : errorMessage ? (
        <div className="text-center py-16 border-2 border-dashed border-red-200 bg-red-50 rounded-3xl">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="font-bold text-red-600">{errorMessage}</p>
          <p className="text-xs text-red-400 mt-1">تعذر تحميل بيانات التقرير، حاول مرة أخرى لاحقاً</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
          <Users className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="font-bold text-muted">لا توجد بيانات</p>
          <p className="text-xs text-muted mt-1">لا يوجد طلاب مطابقين لهذه الفلاتر</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-x-auto">
          <div className={`sticky top-0 z-10 grid ${TABLE_GRID_COLS} gap-4 px-6 py-3.5 bg-background border-b border-border text-xs font-bold text-muted text-right`}>
            {columns.map((col) => (
              <button
                key={col.field}
                onClick={() => toggleSort(col.field)}
                className="flex items-center gap-1 hover:text-primary transition"
              >
                {col.label}
                {sortField === col.field
                  ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                  : <ArrowUpDown className="w-3 h-3 opacity-40" />}
              </button>
            ))}
            <span className="flex items-center gap-1">تقييم الطالب</span>
          </div>

          <div className="divide-y divide-border">
            {rows.map((row, i) => {
              const level = computeStudentLevel(row)
              const rating = getStudentRating(level)
              return (
                <div
                  key={row.id}
                  className={`grid ${TABLE_GRID_COLS} gap-4 px-6 py-4 items-center hover:bg-primary/5 transition text-right ${
                    i % 2 === 1 ? "bg-background/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {row.avatar ? (
                      <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-xs">{row.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="font-bold text-secondary text-sm truncate">{row.name}</span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-text truncate" dir="ltr">{row.phone}</p>
                    {row.parentPhone && (
                      <p className="text-xs text-muted truncate" dir="ltr">ولي الأمر: {row.parentPhone}</p>
                    )}
                  </div>

                  <span className="text-sm text-text font-mono">{row.videosWatchedCount} / {row.videosTotalCount}</span>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${row.avgWatchPercent}%` }} />
                    </div>
                    <span className="text-xs font-bold text-secondary w-9 shrink-0 text-left">{row.avgWatchPercent}%</span>
                  </div>

                  <span className="text-sm text-text font-mono">{row.examsSolvedCount} / {row.examsTotalCount}</span>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${row.avgExamScorePercent}%` }} />
                    </div>
                    <span className="text-xs font-bold text-secondary w-9 shrink-0 text-left">{row.avgExamScorePercent}%</span>
                  </div>

                  <span className="text-sm text-muted truncate">{formatWatchTime(row.totalWatchTimeMinutes)}</span>

                  <span className="text-sm text-text">{row.examCompletionPercent}%</span>

                  <span className="text-sm text-text">{row.videoCompletionPercent}%</span>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${level}%` }} />
                    </div>
                    <span className="text-xs font-bold text-secondary w-9 shrink-0 text-left">{level}%</span>
                  </div>

                  <div>
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${rating.className}`}>
                      {rating.label}
                    </span>
                  </div>

                  <span className="text-xs text-muted whitespace-nowrap">
                    {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString("ar-EG") : "—"}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>عدد الصفوف:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="px-3 py-1.5 rounded-lg bg-background border border-border outline-none text-sm"
              >
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>· إجمالي {total} طالب</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-border hover:bg-background transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-secondary">صفحة {page} من {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-border hover:bg-background transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ComprehensiveReports
