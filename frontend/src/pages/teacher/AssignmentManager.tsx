import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Save,
  Loader2
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import Toggle from "../../components/ui/Toggle"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetAssignments, teacherCreateAssignment, teacherUpdateAssignment, teacherDeleteAssignment } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import type { Course } from "../../types/course"

interface ApiAssignment {
  id: number
  title: string
  description: string
  courseId: number
  groupId: number
  allowText: boolean
  allowFile: boolean
  allowImage: boolean
  hasDeadline: boolean
  dueDate?: string
  isGate: boolean
  hasSchedule: boolean
  showFrom?: string
  createdAt: string
}

interface AssignmentForm {
  title: string
  description: string
  allowText: boolean
  allowFile: boolean
  allowImage: boolean
  hasDeadline: boolean
  dueDate: string
  dueTime: string
  hasSchedule: boolean
  startDate: string
  startTime: string
  isGate: boolean
}

interface Assignment {
  id: string
  courseId: number
  groupId: number
  grade: string
  title: string
  description: string
  allowText: boolean
  allowFile: boolean
  allowImage: boolean
  hasDeadline: boolean
  dueDate?: string
  dueTime?: string
  hasSchedule: boolean
  startDate?: string
  startTime?: string
  isGate: boolean
  createdAt: string
}

const emptyForm: AssignmentForm = {
  title: "",
  description: "",
  allowText: true,
  allowFile: false,
  allowImage: false,
  hasDeadline: false,
  dueDate: "",
  dueTime: "",
  hasSchedule: false,
  startDate: "",
  startTime: "",
  isGate: false,
}

type Tab = "add" | "edit" | "delete"

interface SelectorsProps {
  grade: string; setGrade: (v: string) => void
  courseId: string; setCourseId: (v: string) => void
  groupId: string; setGroupId: (v: string) => void
  assignmentId?: string; setAssignmentId?: (v: string) => void
  showAssignment?: boolean
  coursesForGrade: (g: string) => Course[]
  groupsForCourse: (cId: string) => { id: number; courseId: number; name: string }[]
  assignmentsForGroup: (gId: string) => Assignment[]
  onAssignmentSelect?: (id: string) => void
}

function Selectors({
  grade, setGrade,
  courseId, setCourseId,
  groupId, setGroupId,
  assignmentId, setAssignmentId,
  showAssignment = false,
  coursesForGrade, groupsForCourse, assignmentsForGroup,
  onAssignmentSelect,
}: SelectorsProps) {
  return (
    <div className={`grid gap-4 ${showAssignment ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
        <select
          value={grade}
          onChange={(e) => { setGrade(e.target.value); setCourseId(""); setGroupId(""); if (setAssignmentId) setAssignmentId("") }}
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
          onChange={(e) => { setCourseId(e.target.value); setGroupId(""); if (setAssignmentId) setAssignmentId("") }}
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
          onChange={(e) => { setGroupId(e.target.value); if (setAssignmentId) setAssignmentId("") }}
          disabled={!courseId}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!courseId ? "اختر الكورس أولاً" : "اختر المجموعة"}</option>
          {groupsForCourse(courseId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      {showAssignment && setAssignmentId && (
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">الواجب</label>
          <select
            value={assignmentId}
            onChange={(e) => { setAssignmentId(e.target.value); if (onAssignmentSelect) onAssignmentSelect(e.target.value) }}
            disabled={!groupId}
            className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
          >
            <option value="">{!groupId ? "اختر المجموعة أولاً" : "اختر الواجب"}</option>
            {assignmentsForGroup(groupId).map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

interface FormFieldsProps {
  form: AssignmentForm
  updateField: <K extends keyof AssignmentForm>(field: K, value: AssignmentForm[K]) => void
}

function FormFields({ form, updateField }: FormFieldsProps) {
  return (
    <div className="space-y-5">

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">عنوان الواجب *</label>
        <input
          type="text"
          placeholder="مثال: واجب الوحدة الأولى"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        />
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">وصف الواجب *</label>
        <textarea
          placeholder="اشرح للطالب ما هو مطلوب منه..."
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
        />
      </div>

      {/* Answer Types */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-text text-right">أنواع الإجابة المسموح بها *</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "allowText", label: "نص", emoji: "✍️" },
            { key: "allowFile", label: "ملف", emoji: "📎" },
            { key: "allowImage", label: "صورة", emoji: "🖼️" },
          ].map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => updateField(type.key as keyof AssignmentForm, !form[type.key as keyof AssignmentForm] as AssignmentForm[keyof AssignmentForm])}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                form[type.key as keyof AssignmentForm]
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-background border-border text-muted hover:border-primary/50"
              }`}
            >
              <span className="text-2xl">{type.emoji}</span>
              <span className="text-xs font-bold">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deadline */}
      <Toggle
        value={form.hasDeadline}
        onChange={(v) => updateField("hasDeadline", v)}
        label="تحديد موعد التسليم"
        sublabel="لو مش محددتش مفيش موعد نهائي"
      />

      <AnimatePresence>
        {form.hasDeadline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 p-4 bg-background border border-border rounded-2xl">
              <div>
                <label className="block text-xs text-muted mb-1 text-right">تاريخ التسليم *</label>
                <input type="date" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 text-right">وقت التسليم</label>
                <input type="time" value={form.dueTime} onChange={(e) => updateField("dueTime", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule */}
      <Toggle
        value={form.hasSchedule}
        onChange={(v) => updateField("hasSchedule", v)}
        label="جدولة الظهور"
        sublabel="لو مش محددتش هيظهر فوراً للطلاب"
      />

      <AnimatePresence>
        {form.hasSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 p-4 bg-background border border-border rounded-2xl">
              <div>
                <label className="block text-xs text-muted mb-1 text-right">تاريخ الظهور *</label>
                <input type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 text-right">وقت الظهور</label>
                <input type="time" value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
              </div>
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
                الطالب لازم يسلم الواجب ده الأول عشان يقدر يفتح المحتوى اللي بعده
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

function AssignmentManager() {
  const [tab, setTab] = useState<Tab>("add")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [form, setForm] = useState<AssignmentForm>(emptyForm)

  const [addGrade, setAddGrade] = useState("")
  const [addCourseId, setAddCourseId] = useState("")
  const [addGroupId, setAddGroupId] = useState("")

  const [editGrade, setEditGrade] = useState("")
  const [editCourseId, setEditCourseId] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editAssignmentId, setEditAssignmentId] = useState("")

  const [delGrade, setDelGrade] = useState("")
  const [delCourseId, setDelCourseId] = useState("")
  const [delGroupId, setDelGroupId] = useState("")
  const [delAssignmentId, setDelAssignmentId] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()
  const { courses, groups } = useTeacherCoursesGroups(getToken())

  const mapApiAssignment = useCallback((a: ApiAssignment): Assignment => {
    return {
      id: String(a.id),
      courseId: a.courseId,
      groupId: a.groupId,
      grade: courses.find((c) => c.id === a.courseId)?.grade || "",
      title: a.title,
      description: a.description,
      allowText: a.allowText,
      allowFile: a.allowFile,
      allowImage: a.allowImage,
      hasDeadline: a.hasDeadline,
      dueDate: a.dueDate || undefined,
      hasSchedule: a.hasSchedule,
      startDate: a.showFrom || undefined,
      isGate: a.isGate,
      createdAt: a.createdAt,
    }
  }, [courses])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetAssignments(token).then((data) => {
      if (Array.isArray(data)) setAssignments(data.map(mapApiAssignment))
    })
  }, [getToken, mapApiAssignment])

  function updateField<K extends keyof AssignmentForm>(field: K, value: AssignmentForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const coursesForGrade = (g: string) => courses.filter((c) => c.grade === g)
  const groupsForCourse = (cId: string) => groups.filter((g) => g.courseId === Number(cId))
  const assignmentsForGroup = (gId: string) => assignments.filter((a) => a.groupId === Number(gId))

  function validateForm(): boolean {
    if (!form.title.trim()) { addToast("يرجى إدخال عنوان الواجب", "error"); return false }
    if (!form.description.trim()) { addToast("يرجى إدخال وصف الواجب", "error"); return false }
    if (!form.allowText && !form.allowFile && !form.allowImage) {
      addToast("يرجى السماح بنوع إجابة واحد على الأقل", "error"); return false
    }
    if (form.hasDeadline && !form.dueDate) { addToast("يرجى تحديد تاريخ التسليم", "error"); return false }
    if (form.hasSchedule && !form.startDate) { addToast("يرجى تحديد تاريخ الظهور", "error"); return false }
    return true
  }

  async function handleAdd() {
    if (!addGrade) { addToast("اختر الصف الدراسي", "error"); return }
    if (!addCourseId) { addToast("اختر الكورس", "error"); return }
    if (!addGroupId) { addToast("اختر المجموعة", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateAssignment({
      title: form.title.trim(),
      description: form.description.trim(),
      courseId: Number(addCourseId),
      groupId: Number(addGroupId),
      allowText: form.allowText,
      allowFile: form.allowFile,
      allowImage: form.allowImage,
      hasDeadline: form.hasDeadline,
      dueDate: form.hasDeadline ? form.dueDate : undefined,
      isGate: form.isGate,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.startDate : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setAssignments((prev) => [...prev, mapApiAssignment(data.assignment)])
      setForm(emptyForm)
      addToast(`تم إضافة "${form.title.trim()}" بنجاح ✓`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة الواجب", "error")
    }
  }

  function handleSelectForEdit(assignmentId: string) {
    setEditAssignmentId(assignmentId)
    const assignment = assignments.find((a) => a.id === assignmentId)
    if (assignment) {
      setForm({
        title: assignment.title,
        description: assignment.description,
        allowText: assignment.allowText,
        allowFile: assignment.allowFile,
        allowImage: assignment.allowImage,
        hasDeadline: assignment.hasDeadline,
        dueDate: assignment.dueDate || "",
        dueTime: assignment.dueTime || "",
        hasSchedule: assignment.hasSchedule,
        startDate: assignment.startDate || "",
        startTime: assignment.startTime || "",
        isGate: assignment.isGate ?? false,
      })
    }
  }

  async function handleEdit() {
    if (!editAssignmentId || !validateForm()) return
    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateAssignment(Number(editAssignmentId), {
      title: form.title.trim(),
      description: form.description.trim(),
      allowText: form.allowText,
      allowFile: form.allowFile,
      allowImage: form.allowImage,
      hasDeadline: form.hasDeadline,
      dueDate: form.hasDeadline ? form.dueDate : undefined,
      isGate: form.isGate,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.startDate : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setAssignments((prev) => prev.map((a) => (a.id === editAssignmentId ? mapApiAssignment(data.assignment) : a)))
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!delAssignmentId) return
    setIsLoading(true)
    const token = getToken()
    const title = assignments.find((a) => a.id === delAssignmentId)?.title
    const data = await teacherDeleteAssignment(Number(delAssignmentId), token!)
    setIsLoading(false)
    if (data.success) {
      setAssignments((prev) => prev.filter((a) => a.id !== delAssignmentId))
      setDelAssignmentId("")
      setShowDeleteConfirm(false)
      addToast(`تم حذف "${title}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  const tabs = [
    { id: "add" as Tab, label: "إضافة واجب" },
    { id: "edit" as Tab, label: "تعديل واجب" },
    { id: "delete" as Tab, label: "حذف واجب" },
  ]

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة الواجبات</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف الواجبات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setForm(emptyForm)
              setEditAssignmentId("")
              setDelAssignmentId("")
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
                <h2 className="font-bold text-secondary text-lg">إضافة واجب جديد</h2>
              </div>
              <Selectors
                grade={addGrade} setGrade={setAddGrade}
                courseId={addCourseId} setCourseId={setAddCourseId}
                groupId={addGroupId} setGroupId={setAddGroupId}
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse} assignmentsForGroup={assignmentsForGroup}
              />
              <div className="border-t border-border pt-5">
                <FormFields form={form} updateField={updateField} />
              </div>
              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإضافة...</> : <><Plus className="w-5 h-5" />إضافة الواجب</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* Edit */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">اختر الواجب للتعديل</h2>
              </div>
              <Selectors
                grade={editGrade} setGrade={setEditGrade}
                courseId={editCourseId} setCourseId={setEditCourseId}
                groupId={editGroupId} setGroupId={setEditGroupId}
                assignmentId={editAssignmentId} setAssignmentId={setEditAssignmentId}
                showAssignment
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse} assignmentsForGroup={assignmentsForGroup}
                onAssignmentSelect={handleSelectForEdit}
              />
            </div>

            <AnimatePresence>
              {editAssignmentId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <button onClick={() => { setEditAssignmentId(""); setForm(emptyForm) }} className="text-sm text-muted hover:text-red-500 transition font-bold">إلغاء</button>
                    <h2 className="font-bold text-secondary text-lg">تعديل الواجب</h2>
                  </div>
                  <FormFields form={form} updateField={updateField} />
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
                <h2 className="font-bold text-red-500 text-lg">حذف واجب</h2>
              </div>
              <Selectors
                grade={delGrade} setGrade={setDelGrade}
                courseId={delCourseId} setCourseId={setDelCourseId}
                groupId={delGroupId} setGroupId={setDelGroupId}
                assignmentId={delAssignmentId} setAssignmentId={setDelAssignmentId}
                showAssignment
                coursesForGrade={coursesForGrade} groupsForCourse={groupsForCourse} assignmentsForGroup={assignmentsForGroup}
              />
            </div>

            <AnimatePresence>
              {delAssignmentId && !showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-50/50 border border-red-200/50 rounded-3xl p-6 flex items-center justify-between"
                >
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />حذف الواجب
                  </button>
                  <div className="text-right">
                    <h4 className="font-bold text-secondary">{assignments.find((a) => a.id === delAssignmentId)?.title}</h4>
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
            هل أنت متأكد من حذف واجب
            <strong className="text-secondary mx-1">"{assignments.find((a) => a.id === delAssignmentId)?.title}"</strong>؟
            هذا الإجراء لا يمكن التراجع عنه.
          </>
        }
      />

    </div>
  )
}

export default AssignmentManager
