import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Save, Clock,
  Loader2, Calendar, Info
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import Toggle from "../../components/ui/Toggle"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetExams, teacherGetQuestionGroups, teacherCreateExam, teacherUpdateExam, teacherDeleteExam } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import type { Course } from "../../types/course"

interface QuestionGroupOption {
  id: string
  grade: string
  name: string
}

interface ApiExam {
  id: number
  title: string
  courseId: number
  groupId: number
  questionGroupId: number
  duration: number
  maxAttempts: number
  passingScore: number
  totalScore: number
  shuffleQuestions: boolean
  showResult: boolean
  isGate: boolean
  hasSchedule: boolean
  showFrom?: string
  hideTo?: string
  createdAt: string
}

interface ExamForm {
  title: string
  duration: number | ""
  questionGroupId: string
  shuffleQuestions: boolean
  showResultAfter: boolean
  hasSchedule: boolean
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  maxAttempts: number | ""
  passingScore: number | ""
  totalScore: number | ""
  isGate: boolean
}

interface Exam {
  id: string
  courseId: number
  groupId: number
  grade: string
  title: string
  duration: number
  questionGroupId: string
  shuffleQuestions: boolean
  showResultAfter: boolean
  hasSchedule: boolean
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  maxAttempts: number
  passingScore: number
  totalScore: number
  isGate: boolean
  createdAt: string
}

const emptyForm: ExamForm = {
  title: "",
  duration: "",
  questionGroupId: "",
  shuffleQuestions: false,
  showResultAfter: true,
  hasSchedule: false,
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  maxAttempts: 0,
  passingScore: 50,
  totalScore: 100,
  isGate: false,
}

type Tab = "add" | "edit" | "delete"

function Selectors({
  grade, setGrade,
  courseId, setCourseId,
  groupId, setGroupId,
  examId, setExamId,
  showExam = false,
  onExamSelect,
  coursesForGrade, groupsForCourse, examsForGroup,
}: {
  grade: string; setGrade: (v: string) => void
  courseId: string; setCourseId: (v: string) => void
  groupId: string; setGroupId: (v: string) => void
  examId?: string; setExamId?: (v: string) => void
  showExam?: boolean
  onExamSelect?: (v: string) => void
  coursesForGrade: (g: string) => Course[]
  groupsForCourse: (cId: string) => { id: number; courseId: number; name: string }[]
  examsForGroup: (gId: string) => Exam[]
}) {
  return (
    <div className={`grid gap-4 ${showExam ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
        <select
          value={grade}
          onChange={(e) => { setGrade(e.target.value); setCourseId(""); setGroupId(""); if (setExamId) setExamId("") }}
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
          onChange={(e) => { setCourseId(e.target.value); setGroupId(""); if (setExamId) setExamId("") }}
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
          onChange={(e) => { setGroupId(e.target.value); if (setExamId) setExamId("") }}
          disabled={!courseId}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!courseId ? "اختر الكورس أولاً" : "اختر المجموعة"}</option>
          {groupsForCourse(courseId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      {showExam && setExamId && (
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">الاختبار</label>
          <select
            value={examId}
            onChange={(e) => { setExamId(e.target.value); onExamSelect?.(e.target.value) }}
            disabled={!groupId}
            className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
          >
            <option value="">{!groupId ? "اختر المجموعة أولاً" : "اختر الاختبار"}</option>
            {examsForGroup(groupId).map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

function ExamFormFields({ form, updateField, questionGroups }: {
  form: ExamForm
  updateField: <K extends keyof ExamForm>(field: K, value: ExamForm[K]) => void
  questionGroups: QuestionGroupOption[]
}) {
  return (
    <div className="space-y-5">

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">عنوان الاختبار *</label>
        <input
          type="text"
          placeholder="مثال: اختبار الوحدة الأولى"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">مدة الاختبار (بالدقائق) *</label>
          <div className="relative">
            <input
              type="number"
              min="1"
              placeholder="30"
              value={form.duration}
              onChange={(e) => updateField("duration", e.target.value ? Number(e.target.value) : "")}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            />
            <Clock className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
          </div>
        </div>

        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">عدد المحاولات المسموحة</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={form.maxAttempts}
            onChange={(e) => updateField("maxAttempts", e.target.value ? Number(e.target.value) : "")}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
          />
          <p className="text-xs text-muted mt-1">اتركها 0 لمحاولات غير محدودة</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">درجة النجاح *</label>
          <input
            type="number"
            min="0"
            placeholder="50"
            value={form.passingScore}
            onChange={(e) => updateField("passingScore", e.target.value ? Number(e.target.value) : "")}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
          />
          <p className="text-xs text-muted mt-1">الدرجة اللي لازم الطالب يحققها عشان ينجح</p>
        </div>

        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">الدرجة الكلية للاختبار *</label>
          <input
            type="number"
            min="1"
            placeholder="100"
            value={form.totalScore}
            onChange={(e) => updateField("totalScore", e.target.value ? Number(e.target.value) : "")}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
          />
          <p className="text-xs text-muted mt-1">هتتقسم تلقائياً على عدد أسئلة المجموعة المختارة</p>
        </div>
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">مجموعة الأسئلة *</label>
        <select
          value={form.questionGroupId}
          onChange={(e) => updateField("questionGroupId", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        >
          <option value="">اختر مجموعة الأسئلة</option>
          {questionGroups.map((qg) => <option key={qg.id} value={qg.id}>{qg.name}</option>)}
        </select>
        <p className="text-xs text-muted mt-1">أضف مجموعات الأسئلة من صفحة مجموعات الأسئلة أولاً</p>
      </div>

      <Toggle
        value={form.shuffleQuestions}
        onChange={(v) => updateField("shuffleQuestions", v)}
        label="ترتيب عشوائي للأسئلة"
        sublabel="يظهر الأسئلة بترتيب مختلف لكل طالب"
      />

      <Toggle
        value={form.showResultAfter}
        onChange={(v) => updateField("showResultAfter", v)}
        label="عرض النتيجة بعد الانتهاء"
        sublabel="يظهر للطالب نتيجته فور الانتهاء من الاختبار"
      />

      <Toggle
        value={form.hasSchedule}
        onChange={(v) => updateField("hasSchedule", v)}
        label="جدولة الاختبار"
        sublabel="لو مش محددتش هيكون متاح طول الوقت"
      />

      <AnimatePresence>
        {form.hasSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-background border border-border rounded-2xl">
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit">
                  <Calendar className="w-4 h-4" />
                  تاريخ البدء
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted mb-1">التاريخ *</label>
                    <input type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">الوقت</label>
                    <input type="time" value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl w-fit">
                  <Calendar className="w-4 h-4" />
                  تاريخ الانتهاء (اختياري)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted mb-1">التاريخ</label>
                    <input type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">الوقت</label>
                    <input type="time" value={form.endTime} onChange={(e) => updateField("endTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 p-3.5 bg-primary/5 border border-primary/20 rounded-xl mt-3">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                لو حددت تاريخ بدء بس، الاختبار هيبدأ من التاريخ ده ويفضل متاح. لو حددت تاريخ انتهاء، الاختبار هينتهي تلقائياً.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toggle
        value={form.isGate}
        onChange={(v) => updateField("isGate", v)}
        label="غلق ما بعده من محتوى"
        sublabel="يمنع الطالب من فتح المحتوى اللي بعده لحد ما يخلّص ده"
      />

      <AnimatePresence>
        {form.isGate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2.5 p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-xs text-muted leading-relaxed text-right flex-1">
                الطالب لازم ينجح في الاختبار ده الأول عشان يقدر يفتح المحتوى اللي بعده
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

function ExamManager() {
  const [tab, setTab] = useState<Tab>("add")
  const [questionGroups, setQuestionGroups] = useState<QuestionGroupOption[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [form, setForm] = useState<ExamForm>(emptyForm)

  const [addGrade, setAddGrade] = useState("")
  const [addCourseId, setAddCourseId] = useState("")
  const [addGroupId, setAddGroupId] = useState("")

  const [editGrade, setEditGrade] = useState("")
  const [editCourseId, setEditCourseId] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editExamId, setEditExamId] = useState("")

  const [delGrade, setDelGrade] = useState("")
  const [delCourseId, setDelCourseId] = useState("")
  const [delGroupId, setDelGroupId] = useState("")
  const [delExamId, setDelExamId] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()
  const { courses, groups } = useTeacherCoursesGroups(getToken())

  const mapApiExam = useCallback((e: ApiExam): Exam => {
    return {
      id: String(e.id),
      courseId: e.courseId,
      groupId: e.groupId,
      grade: courses.find((c) => c.id === e.courseId)?.grade || "",
      title: e.title,
      duration: e.duration,
      questionGroupId: String(e.questionGroupId),
      shuffleQuestions: e.shuffleQuestions,
      showResultAfter: e.showResult,
      hasSchedule: e.hasSchedule,
      startDate: e.showFrom || undefined,
      endDate: e.hideTo || undefined,
      maxAttempts: e.maxAttempts,
      passingScore: e.passingScore,
      totalScore: e.totalScore,
      isGate: e.isGate,
      createdAt: e.createdAt,
    }
  }, [courses])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetQuestionGroups(token).then((data) => {
      if (Array.isArray(data)) {
        setQuestionGroups(data.map((g: { id: number; grade: string; name: string }) => ({ id: String(g.id), grade: g.grade, name: g.name })))
      }
    })
    teacherGetExams(token).then((data) => {
      if (Array.isArray(data)) setExams(data.map(mapApiExam))
    })
  }, [getToken, mapApiExam])

  function updateField<K extends keyof ExamForm>(field: K, value: ExamForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const coursesForGrade = (g: string) => courses.filter((c) => c.grade === g)
  const groupsForCourse = (cId: string) => groups.filter((g) => g.courseId === Number(cId))
  const examsForGroup = (gId: string) => exams.filter((e) => e.groupId === Number(gId))
  const questionGroupsForGrade = (g: string) => questionGroups.filter((qg) => qg.grade === g)

  function validateForm(): boolean {
    if (!form.title.trim()) { addToast("يرجى إدخال عنوان الاختبار", "error"); return false }
    if (!form.duration || Number(form.duration) < 1) { addToast("يرجى إدخال مدة الاختبار", "error"); return false }
    if (!form.questionGroupId) { addToast("يرجى اختيار مجموعة الأسئلة", "error"); return false }
    if (form.passingScore === "" || Number(form.passingScore) < 0) { addToast("يرجى إدخال درجة النجاح", "error"); return false }
    if (!form.totalScore || Number(form.totalScore) < 1) { addToast("يرجى إدخال الدرجة الكلية للاختبار", "error"); return false }
    if (form.hasSchedule && !form.startDate) { addToast("يرجى تحديد تاريخ البدء", "error"); return false }
    return true
  }

  async function handleAdd() {
    if (!addGrade) { addToast("اختر الصف الدراسي", "error"); return }
    if (!addCourseId) { addToast("اختر الكورس", "error"); return }
    if (!addGroupId) { addToast("اختر المجموعة", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateExam({
      title: form.title.trim(),
      courseId: Number(addCourseId),
      groupId: Number(addGroupId),
      questionGroupId: Number(form.questionGroupId),
      duration: Number(form.duration),
      maxAttempts: Number(form.maxAttempts) || 0,
      passingScore: Number(form.passingScore),
      totalScore: Number(form.totalScore),
      shuffleQuestions: form.shuffleQuestions,
      showResult: form.showResultAfter,
      isGate: form.isGate,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.startDate : undefined,
      hideTo: form.hasSchedule ? form.endDate : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setExams((prev) => [...prev, mapApiExam(data.exam)])
      setForm(emptyForm)
      addToast(`تم إضافة "${form.title.trim()}" بنجاح ✓`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة الاختبار", "error")
    }
  }

  function handleSelectForEdit(examId: string) {
    setEditExamId(examId)
    const exam = exams.find((e) => e.id === examId)
    if (exam) {
      setForm({
        title: exam.title,
        duration: exam.duration,
        questionGroupId: exam.questionGroupId,
        shuffleQuestions: exam.shuffleQuestions,
        showResultAfter: exam.showResultAfter,
        hasSchedule: exam.hasSchedule,
        startDate: exam.startDate || "",
        startTime: exam.startTime || "",
        endDate: exam.endDate || "",
        endTime: exam.endTime || "",
        maxAttempts: exam.maxAttempts,
        passingScore: exam.passingScore,
        totalScore: exam.totalScore,
        isGate: exam.isGate ?? false,
      })
    }
  }

  async function handleEdit() {
    if (!editExamId || !validateForm()) return
    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateExam(Number(editExamId), {
      title: form.title.trim(),
      questionGroupId: Number(form.questionGroupId),
      duration: Number(form.duration),
      maxAttempts: Number(form.maxAttempts) || 0,
      passingScore: Number(form.passingScore),
      totalScore: Number(form.totalScore),
      shuffleQuestions: form.shuffleQuestions,
      showResult: form.showResultAfter,
      isGate: form.isGate,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.startDate : undefined,
      hideTo: form.hasSchedule ? form.endDate : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setExams((prev) => prev.map((e) => (e.id === editExamId ? mapApiExam(data.exam) : e)))
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!delExamId) return
    setIsLoading(true)
    const token = getToken()
    const title = exams.find((e) => e.id === delExamId)?.title
    const data = await teacherDeleteExam(Number(delExamId), token!)
    setIsLoading(false)
    if (data.success) {
      setExams((prev) => prev.filter((e) => e.id !== delExamId))
      setDelExamId("")
      setShowDeleteConfirm(false)
      addToast(`تم حذف "${title}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  const tabs = [
    { id: "add" as Tab, label: "إضافة اختبار" },
    { id: "edit" as Tab, label: "تعديل اختبار" },
    { id: "delete" as Tab, label: "حذف اختبار" },
  ]

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة الاختبارات</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف الاختبارات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setForm(emptyForm)
              setEditExamId("")
              setDelExamId("")
              setShowDeleteConfirm(false)
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
              tab === t.id
                ? t.id === "delete"
                  ? "bg-red-500 text-white shadow-lg"
                  : "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Add */}
        {tab === "add" && (
          <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إضافة اختبار جديد</h2>
              </div>
              <Selectors
                grade={addGrade} setGrade={setAddGrade}
                courseId={addCourseId} setCourseId={setAddCourseId}
                groupId={addGroupId} setGroupId={setAddGroupId}
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse} examsForGroup={examsForGroup}
              />
              <div className="border-t border-border pt-5">
                <ExamFormFields form={form} updateField={updateField} questionGroups={questionGroupsForGrade(addGrade)} />
              </div>
              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإضافة...</> : <><Plus className="w-5 h-5" />إضافة الاختبار</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* Edit */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">اختر الاختبار للتعديل</h2>
              </div>
              <Selectors
                grade={editGrade} setGrade={setEditGrade}
                courseId={editCourseId} setCourseId={setEditCourseId}
                groupId={editGroupId} setGroupId={setEditGroupId}
                examId={editExamId} setExamId={setEditExamId}
                showExam
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse} examsForGroup={examsForGroup}
                onExamSelect={handleSelectForEdit}
              />
            </div>

            <AnimatePresence>
              {editExamId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <button onClick={() => { setEditExamId(""); setForm(emptyForm) }} className="text-sm text-muted hover:text-red-500 transition font-bold">إلغاء</button>
                    <h2 className="font-bold text-secondary text-lg">تعديل الاختبار</h2>
                  </div>
                  <ExamFormFields form={form} updateField={updateField} questionGroups={questionGroupsForGrade(editGrade)} />
                  <button
                    onClick={handleEdit}
                    disabled={isLoading}
                    className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                  >
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</> : <><Save className="w-5 h-5" />حفظ التعديلات</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Delete */}
        {tab === "delete" && (
          <motion.div key="delete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-red-500 text-lg">حذف اختبار</h2>
              </div>
              <Selectors
                grade={delGrade} setGrade={setDelGrade}
                courseId={delCourseId} setCourseId={setDelCourseId}
                groupId={delGroupId} setGroupId={setDelGroupId}
                examId={delExamId} setExamId={setDelExamId}
                showExam
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse} examsForGroup={examsForGroup}
              />
            </div>

            <AnimatePresence>
              {delExamId && !showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-50/50 border border-red-200/50 rounded-3xl p-6 flex items-center justify-between"
                >
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />حذف الاختبار
                  </button>
                  <div className="text-right">
                    <h4 className="font-bold text-secondary">{exams.find((e) => e.id === delExamId)?.title}</h4>
                    <p className="text-xs text-muted mt-1">{exams.find((e) => e.id === delExamId)?.duration} دقيقة</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        message={
          <>
            هل أنت متأكد من حذف اختبار
            <strong className="text-secondary mx-1">"{exams.find((e) => e.id === delExamId)?.title}"</strong>؟
            هذا الإجراء لا يمكن التراجع عنه.
          </>
        }
      />

    </div>
  )
}

export default ExamManager
