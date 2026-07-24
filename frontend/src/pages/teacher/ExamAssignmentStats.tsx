import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Award, ClipboardList, CheckCircle2, XCircle,
  Clock, Search, Users, FileSpreadsheet
} from "lucide-react"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetExams, teacherGetAssignments, teacherGetExamStats, teacherGetAssignmentStats } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import { exportToExcel } from "../../utils/exportExcel"
import type { Course } from "../../types/course"

interface ExamOption {
  id: number
  groupId: number
  title: string
}

interface AssignmentOption {
  id: number
  groupId: number
  title: string
}

interface ApiExam {
  id: number
  groupId: number
  title: string
}

interface ApiAssignment {
  id: number
  groupId: number
  title: string
}

interface ExamResult {
  studentId: number
  studentCode: string
  studentName: string
  studentPhone: string
  parentPhone: string
  educationType: string
  score: number
  totalScore: number
  totalQuestions: number
  startedAt?: string
  submittedAt?: string
  durationSeconds?: number
  hasSubmitted: boolean
}

function formatDuration(seconds?: number) {
  if (seconds === undefined || seconds === null) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} د ${s} ث` : `${s} ث`
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("ar-EG", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

interface AssignmentResult {
  studentId: number
  studentCode: string
  studentName: string
  studentPhone: string
  parentPhone: string
  educationType: string
  submittedAt?: string
  hasSubmitted: boolean
}

type ActiveTab = "exams" | "assignments"

interface SelectorsProps {
  grade: string; setGrade: (v: string) => void
  courseId: string; setCourseId: (v: string) => void
  groupId: string; setGroupId: (v: string) => void
  itemId: string; setItemId: (v: string) => void
  items: { id: string; title: string }[]
  itemLabel: string
  coursesForGrade: (g: string) => Course[]
  groupsForCourse: (cId: string) => { id: number; courseId: number; name: string }[]
}

function Selectors({
  grade, setGrade,
  courseId, setCourseId,
  groupId, setGroupId,
  itemId, setItemId,
  items,
  itemLabel,
  coursesForGrade, groupsForCourse,
}: SelectorsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الصف</label>
        <select
          value={grade}
          onChange={(e) => { setGrade(e.target.value); setCourseId(""); setGroupId(""); setItemId("") }}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        >
          <option value="">اختر الصف</option>
          {grades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الكورس</label>
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setGroupId(""); setItemId("") }}
          disabled={!grade}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!grade ? "اختر الصف أولاً" : "اختر الكورس"}</option>
          {coursesForGrade(grade).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">المجموعة</label>
        <select
          value={groupId}
          onChange={(e) => { setGroupId(e.target.value); setItemId("") }}
          disabled={!courseId}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!courseId ? "اختر الكورس أولاً" : "اختر المجموعة"}</option>
          {groupsForCourse(courseId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">{itemLabel}</label>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          disabled={!groupId}
          className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!groupId ? "اختر المجموعة أولاً" : `اختر ${itemLabel}`}</option>
          {items.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
        </select>
      </div>
    </div>
  )
}

function ExamAssignmentStats() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("exams")
  const [search, setSearch] = useState("")

  // Exam selectors
  const [examGrade, setExamGrade] = useState("")
  const [examCourseId, setExamCourseId] = useState("")
  const [examGroupId, setExamGroupId] = useState("")
  const [examId, setExamId] = useState("")

  // Assignment selectors
  const [assignGrade, setAssignGrade] = useState("")
  const [assignCourseId, setAssignCourseId] = useState("")
  const [assignGroupId, setAssignGroupId] = useState("")
  const [assignId, setAssignId] = useState("")

  const [exams, setExams] = useState<ExamOption[]>([])
  const [assignments, setAssignments] = useState<AssignmentOption[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [assignmentResults, setAssignmentResults] = useState<AssignmentResult[]>([])

  const { getToken } = useAuth()
  const { courses, groups } = useTeacherCoursesGroups(getToken())

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetExams(token).then((data) => {
      if (Array.isArray(data)) setExams(data.map((e: ApiExam) => ({ id: e.id, groupId: e.groupId, title: e.title })))
    })
    teacherGetAssignments(token).then((data) => {
      if (Array.isArray(data)) setAssignments(data.map((a: ApiAssignment) => ({ id: a.id, groupId: a.groupId, title: a.title })))
    })
  }, [getToken])

  useEffect(() => {
    if (!examId) return
    const token = getToken()
    if (token) teacherGetExamStats(Number(examId), token).then((data) => { if (Array.isArray(data)) setExamResults(data) })
  }, [examId, getToken])

  useEffect(() => {
    if (!assignId) return
    const token = getToken()
    if (token) teacherGetAssignmentStats(Number(assignId), token).then((data) => { if (Array.isArray(data)) setAssignmentResults(data) })
  }, [assignId, getToken])

  const coursesForGrade = (g: string) => courses.filter((c) => c.grade === g)
  const groupsForCourse = (cId: string) => groups.filter((g) => g.courseId === Number(cId))
  const examsForGroup = (gId: string) => exams.filter((e) => e.groupId === Number(gId))
  const assignmentsForGroup = (gId: string) => assignments.filter((a) => a.groupId === Number(gId))

  const filteredExamResults = examResults.filter((r) =>
    r.studentName.includes(search) || r.studentPhone.includes(search)
  )

  const filteredAssignResults = assignmentResults.filter((r) =>
    r.studentName.includes(search) || r.studentPhone.includes(search)
  )

  const examSubmitted = examResults.filter((r) => r.hasSubmitted).length
  const examPending = examResults.filter((r) => !r.hasSubmitted).length
  const avgScore = examResults.length > 0
    ? Math.round(examResults.filter((r) => r.hasSubmitted).reduce((acc, r) => acc + (r.totalScore > 0 ? (r.score / r.totalScore) * 100 : 0), 0) / (examSubmitted || 1))
    : 0

  const assignSubmitted = assignmentResults.filter((r) => r.hasSubmitted).length
  const assignPending = assignmentResults.filter((r) => !r.hasSubmitted).length

  const selectedExamTitle = exams.find((e) => e.id === Number(examId))?.title || "الاختبار"
  const selectedAssignmentTitle = assignments.find((a) => a.id === Number(assignId))?.title || "الواجب"

  function exportExamResults(subset: ExamResult[], label: string) {
    if (subset.length === 0) return
    exportToExcel(
      subset.map((r) => ({
        "كود الطالب": r.studentCode,
        "اسم الطالب": r.studentName,
        "رقم هاتف الطالب": r.studentPhone,
        "رقم ولي الأمر": r.parentPhone,
        "نوع التعليم": r.educationType,
        "الدرجة": r.hasSubmitted ? `${r.score}/${r.totalScore}` : "—",
        "معاد التسليم": formatDateTime(r.submittedAt),
        "مدة الاختبار": formatDuration(r.durationSeconds),
      })),
      `${label}-${selectedExamTitle}`
    )
  }

  function exportAssignmentResults(subset: AssignmentResult[], label: string) {
    if (subset.length === 0) return
    exportToExcel(
      subset.map((r) => ({
        "كود الطالب": r.studentCode,
        "اسم الطالب": r.studentName,
        "رقم هاتف الطالب": r.studentPhone,
        "رقم ولي الأمر": r.parentPhone,
        "نوع التعليم": r.educationType,
        "تاريخ التسليم": r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("ar-EG") : "—",
      })),
      `${label}-${selectedAssignmentTitle}`
    )
  }

  return (
    <div className="space-y-6">

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إحصائيات الاختبارات والواجبات</h1>
        <p className="text-muted text-sm mt-1">تابع أداء الطلاب في الاختبارات والواجبات</p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        <button
          onClick={() => { setActiveTab("exams"); setSearch("") }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === "exams" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"
          }`}
        >
          <Award className="w-4 h-4" />
          إحصائيات الاختبارات
        </button>
        <button
          onClick={() => { setActiveTab("assignments"); setSearch("") }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === "assignments" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          إحصائيات الواجبات
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* Exams Tab */}
        {activeTab === "exams" && (
          <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">

            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <h2 className="font-bold text-secondary text-right border-b border-border pb-4">اختر الاختبار</h2>
              <Selectors
                grade={examGrade} setGrade={setExamGrade}
                courseId={examCourseId} setCourseId={setExamCourseId}
                groupId={examGroupId} setGroupId={setExamGroupId}
                itemId={examId} setItemId={setExamId}
                items={examsForGroup(examGroupId).map((e) => ({ id: String(e.id), title: e.title }))}
                itemLabel="الاختبار"
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse}
              />
            </div>

            {examId && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-4 text-right space-y-2">
                    <p className="text-xs text-muted">أدّوا الاختبار</p>
                    <p className="text-2xl font-bold text-emerald-500">{examSubmitted}</p>
                    {examSubmitted > 0 && (
                      <button
                        onClick={() => exportExamResults(examResults.filter((r) => r.hasSubmitted), "أدّوا-الاختبار")}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        تصدير
                      </button>
                    )}
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4 text-right space-y-2">
                    <p className="text-xs text-muted">لم يؤدوا بعد</p>
                    <p className="text-2xl font-bold text-red-500">{examPending}</p>
                    {examPending > 0 && (
                      <button
                        onClick={() => exportExamResults(examResults.filter((r) => !r.hasSubmitted), "لم-يؤدوا-الاختبار")}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        تصدير
                      </button>
                    )}
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4 text-right">
                    <p className="text-xs text-muted">متوسط الدرجات</p>
                    <p className="text-2xl font-bold text-primary mt-1">{avgScore}%</p>
                  </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-60">
                    <input
                      type="text"
                      placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-card border border-border outline-none transition focus:border-primary text-right"
                    />
                    <Search className="absolute right-4 top-3.5 w-4 h-4 text-muted" />
                  </div>
                  {examResults.length > 0 && (
                    <button
                      onClick={() => exportExamResults(filteredExamResults, "كل-الطلاب")}
                      className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl font-bold text-sm hover:bg-primary/20 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      تصدير الكل
                    </button>
                  )}
                </div>

                {/* Results Table */}
                {examResults.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
                    <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="font-bold text-muted">لا توجد بيانات</p>
                    <p className="text-xs text-muted mt-1">لا يوجد طلاب مسجلين حالياً</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-3xl overflow-x-auto">
                    <div className="grid grid-cols-10 gap-4 px-6 py-3 bg-background border-b border-border text-xs font-bold text-muted text-right min-w-350">
                      <span>كود الطالب</span>
                      <span className="col-span-2">الطالب</span>
                      <span>رقم ولي الأمر</span>
                      <span>نوع التعليم</span>
                      <span>الدرجة</span>
                      <span>النسبة</span>
                      <span>معاد التسليم</span>
                      <span>مدة الاختبار</span>
                      <span className="text-center">الحالة</span>
                    </div>
                    <div className="divide-y divide-border">
                      {filteredExamResults.map((result) => {
                        const percent = result.totalScore > 0 ? Math.round((result.score / result.totalScore) * 100) : 0
                        return (
                          <div key={result.studentId} className="grid grid-cols-10 gap-4 px-6 py-4 items-center hover:bg-primary/3 transition text-right min-w-350">
                            <span className="text-sm font-mono font-bold text-secondary" dir="ltr">{result.studentCode}</span>
                            <div className="col-span-2 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary font-bold text-xs">{result.studentName.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-bold text-secondary text-sm">{result.studentName}</p>
                                <p className="text-xs text-muted" dir="ltr">{result.studentPhone}</p>
                              </div>
                            </div>
                            <span className="text-sm text-text" dir="ltr">{result.parentPhone}</span>
                            <span className="text-sm text-text">{result.educationType}</span>
                            <span className="font-bold text-secondary text-sm">
                              {result.hasSubmitted ? `${result.score}/${result.totalScore}` : "—"}
                            </span>
                            <div>
                              {result.hasSubmitted ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${percent >= 50 ? "bg-emerald-500" : "bg-red-500"}`}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-secondary">{percent}%</span>
                                </div>
                              ) : (
                                <span className="text-muted text-sm">—</span>
                              )}
                            </div>
                            <span className="text-sm text-muted">{formatDateTime(result.submittedAt)}</span>
                            <span className="text-sm text-muted flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-primary/60" />
                              {formatDuration(result.durationSeconds)}
                            </span>
                            <div className="flex justify-center">
                              {result.hasSubmitted ? (
                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  أدّى
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  لم يؤدِّ
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Assignments Tab */}
        {activeTab === "assignments" && (
          <motion.div key="assignments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">

            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <h2 className="font-bold text-secondary text-right border-b border-border pb-4">اختر الواجب</h2>
              <Selectors
                grade={assignGrade} setGrade={setAssignGrade}
                courseId={assignCourseId} setCourseId={setAssignCourseId}
                groupId={assignGroupId} setGroupId={setAssignGroupId}
                itemId={assignId} setItemId={setAssignId}
                items={assignmentsForGroup(assignGroupId).map((a) => ({ id: String(a.id), title: a.title }))}
                itemLabel="الواجب"
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse}
              />
            </div>

            {assignId && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-4 text-right space-y-2">
                    <p className="text-xs text-muted">سلّموا الواجب</p>
                    <p className="text-2xl font-bold text-emerald-500">{assignSubmitted}</p>
                    {assignSubmitted > 0 && (
                      <button
                        onClick={() => exportAssignmentResults(assignmentResults.filter((r) => r.hasSubmitted), "سلّموا-الواجب")}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        تصدير
                      </button>
                    )}
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4 text-right space-y-2">
                    <p className="text-xs text-muted">لم يسلّموا بعد</p>
                    <p className="text-2xl font-bold text-red-500">{assignPending}</p>
                    {assignPending > 0 && (
                      <button
                        onClick={() => exportAssignmentResults(assignmentResults.filter((r) => !r.hasSubmitted), "لم-يسلّموا-الواجب")}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        تصدير
                      </button>
                    )}
                  </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-60">
                    <input
                      type="text"
                      placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-card border border-border outline-none transition focus:border-primary text-right"
                    />
                    <Search className="absolute right-4 top-3.5 w-4 h-4 text-muted" />
                  </div>
                  {assignmentResults.length > 0 && (
                    <button
                      onClick={() => exportAssignmentResults(filteredAssignResults, "كل-الطلاب")}
                      className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl font-bold text-sm hover:bg-primary/20 transition"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      تصدير الكل
                    </button>
                  )}
                </div>

                {/* Results Table */}
                {assignmentResults.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
                    <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                    <p className="font-bold text-muted">لا توجد بيانات</p>
                    <p className="text-xs text-muted mt-1">لا يوجد طلاب مسجلين حالياً</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-3xl overflow-x-auto">
                    <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-background border-b border-border text-xs font-bold text-muted text-right min-w-225">
                      <span>كود الطالب</span>
                      <span className="col-span-2">الطالب</span>
                      <span>رقم ولي الأمر</span>
                      <span>نوع التعليم</span>
                      <span>تاريخ التسليم</span>
                      <span className="text-center">الحالة</span>
                    </div>
                    <div className="divide-y divide-border">
                      {filteredAssignResults.map((result) => (
                        <div key={result.studentId} className="grid grid-cols-7 gap-4 px-6 py-4 items-center hover:bg-primary/3 transition text-right min-w-225">
                          <span className="text-sm font-mono font-bold text-secondary" dir="ltr">{result.studentCode}</span>
                          <div className="col-span-2 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold text-xs">{result.studentName.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="font-bold text-secondary text-sm">{result.studentName}</p>
                              <p className="text-xs text-muted" dir="ltr">{result.studentPhone}</p>
                            </div>
                          </div>
                          <span className="text-sm text-text" dir="ltr">{result.parentPhone}</span>
                          <span className="text-sm text-text">{result.educationType}</span>
                          <span className="text-sm text-muted">
                            {result.submittedAt
                              ? new Date(result.submittedAt).toLocaleDateString("ar-EG")
                              : "—"}
                          </span>
                          <div className="flex justify-center">
                            {result.hasSubmitted ? (
                              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                سلّم
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                لم يسلّم
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  )
}

export default ExamAssignmentStats
