import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Edit, Trash2, Save,
  Calendar, Clock, AlertTriangle, Info, Loader2
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import Toggle from "../../components/ui/Toggle"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetGroups, teacherCreateGroup, teacherUpdateGroup, teacherDeleteGroup } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import type { Course } from "../../types/course"

interface Group {
  id: number
  courseId: number
  name: string
  description: string
  showFrom?: string
  showFromTime?: string
  hideTo?: string
  hideToTime?: string
}

interface ApiGroup {
  id: number
  courseId: number
  title: string
  description: string
  showFrom?: string
  hideTo?: string
}

function mapApiGroup(g: ApiGroup): Group {
  return {
    id: g.id,
    courseId: g.courseId,
    name: g.title,
    description: g.description,
    showFrom: g.showFrom || undefined,
    hideTo: g.hideTo || undefined,
  }
}

interface GroupForm {
  name: string
  description: string
  hasSchedule: boolean
  showFrom: string
  showFromTime: string
  hideTo: string
  hideToTime: string
}

const emptyForm: GroupForm = {
  name: "",
  description: "",
  hasSchedule: false,
  showFrom: "",
  showFromTime: "",
  hideTo: "",
  hideToTime: "",
}

type Tab = "add" | "edit" | "delete"

interface GradeCourseSelectorsProps {
  grade: string
  courseId: string
  groupId: string
  onGradeChange: (v: string) => void
  onCourseChange: (v: string) => void
  onGroupChange: (v: string) => void
  showGroups?: boolean
  coursesForGrade: Course[]
  groupsForCourse: Group[]
}

function GradeCourseSelectors({
  grade, courseId, groupId,
  onGradeChange, onCourseChange, onGroupChange,
  showGroups = false,
  coursesForGrade, groupsForCourse,
}: GradeCourseSelectorsProps) {
  return (
    <div className={`grid gap-4 ${showGroups ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
        <select
          value={grade}
          onChange={(e) => onGradeChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        >
          <option value="">اختر الصف الدراسي</option>
          {grades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الكورس</label>
        <select
          value={courseId}
          onChange={(e) => onCourseChange(e.target.value)}
          disabled={!grade || coursesForGrade.length === 0}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">
            {!grade ? "اختر الصف أولاً" : coursesForGrade.length === 0 ? "لا يوجد كورسات" : "اختر الكورس"}
          </option>
          {coursesForGrade.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {showGroups && (
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">المجموعة</label>
          <select
            value={groupId}
            onChange={(e) => onGroupChange(e.target.value)}
            disabled={!courseId || groupsForCourse.length === 0}
            className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
          >
            <option value="">
              {!courseId ? "اختر الكورس أولاً" : groupsForCourse.length === 0 ? "لا يوجد مجموعات" : "اختر المجموعة"}
            </option>
            {groupsForCourse.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

interface ScheduleSectionProps {
  form: GroupForm
  updateField: (field: keyof GroupForm, value: string | boolean) => void
}

function ScheduleSection({ form, updateField }: ScheduleSectionProps) {
  return (
    <div className="space-y-4">
      <Toggle
        value={form.hasSchedule}
        onChange={(v) => updateField("hasSchedule", v)}
        label="جدولة الظهور والإخفاء"
        sublabel="لو مش محددتش هتفضل ظاهرة علطول"
        containerClassName="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl"
      />

      {/* Schedule Fields */}
      <AnimatePresence>
        {form.hasSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-background border border-border rounded-2xl">

              {/* Show From */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit">
                  <Calendar className="w-4 h-4" />
                  تاريخ الظهور
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-right">
                    <label className="block text-xs text-muted mb-1">التاريخ *</label>
                    <input
                      type="date"
                      value={form.showFrom}
                      onChange={(e) => updateField("showFrom", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary"
                    />
                  </div>
                  <div className="text-right">
                    <label className="block text-xs text-muted mb-1">الوقت</label>
                    <input
                      type="time"
                      value={form.showFromTime}
                      onChange={(e) => updateField("showFromTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Hide To */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl w-fit">
                  <Clock className="w-4 h-4" />
                  تاريخ الإخفاء (اختياري)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-right">
                    <label className="block text-xs text-muted mb-1">التاريخ</label>
                    <input
                      type="date"
                      value={form.hideTo}
                      onChange={(e) => updateField("hideTo", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary"
                    />
                  </div>
                  <div className="text-right">
                    <label className="block text-xs text-muted mb-1">الوقت</label>
                    <input
                      type="time"
                      value={form.hideToTime}
                      onChange={(e) => updateField("hideToTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Info */}
            <div className="flex gap-2.5 p-3.5 bg-primary/5 border border-primary/20 rounded-xl mt-3">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                لو حددت تاريخ ظهور بس من غير إخفاء، المجموعة هتظهر من التاريخ ده وتفضل ظاهرة علطول.
                لو مش محددتش أي تاريخ، هتظهر فوراً للطلاب.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GroupManager() {
  const [tab, setTab] = useState<Tab>("add")
  const [groups, setGroups] = useState<Group[]>([])

  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [form, setForm] = useState<GroupForm>(emptyForm)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()
  const { courses } = useTeacherCoursesGroups(getToken())

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetGroups(token).then((data) => { if (Array.isArray(data)) setGroups(data.map(mapApiGroup)) })
  }, [getToken])

  // فلترة الكورسات حسب الصف
  const coursesForGrade = useMemo(
    () => courses.filter((c) => c.grade === selectedGrade),
    [courses, selectedGrade]
  )

  // فلترة المجموعات حسب الكورس
  const groupsForCourse = useMemo(
    () => groups.filter((g) => g.courseId === Number(selectedCourseId)),
    [groups, selectedCourseId]
  )

  function updateField(field: keyof GroupForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateForm(): boolean {
    if (!form.name.trim() || !form.description.trim()) {
      addToast("يرجى تعبئة اسم المجموعة والوصف", "error")
      return false
    }
    if (form.hasSchedule && !form.showFrom) {
      addToast("يرجى تحديد تاريخ الظهور", "error")
      return false
    }
    return true
  }

  async function handleAdd() {
    if (!selectedGrade) { addToast("يرجى اختيار الصف الدراسي", "error"); return }
    if (!selectedCourseId) { addToast("يرجى اختيار الكورس", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateGroup({
      title: form.name,
      description: form.description,
      courseId: Number(selectedCourseId),
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.showFrom : undefined,
      hideTo: form.hasSchedule ? form.hideTo : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setGroups((prev) => [...prev, mapApiGroup(data.group)])
      setForm(emptyForm)
      addToast(`تم إضافة مجموعة "${form.name}" بنجاح ✓`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة المجموعة", "error")
    }
  }

  function handleSelectForEdit(groupId: string) {
    setSelectedGroupId(groupId)
    const group = groups.find((g) => g.id === Number(groupId))
    if (group) {
      setForm({
        name: group.name,
        description: group.description,
        hasSchedule: !!group.showFrom,
        showFrom: group.showFrom || "",
        showFromTime: group.showFromTime || "",
        hideTo: group.hideTo || "",
        hideToTime: group.hideToTime || "",
      })
    }
  }

  async function handleEdit() {
    if (!selectedGroupId) { addToast("يرجى اختيار المجموعة", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateGroup(Number(selectedGroupId), {
      title: form.name,
      description: form.description,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.showFrom : undefined,
      hideTo: form.hasSchedule ? form.hideTo : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setGroups((prev) => prev.map((g) => (g.id === Number(selectedGroupId) ? mapApiGroup(data.group) : g)))
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const token = getToken()
    const name = groups.find((g) => g.id === deleteId)?.name
    const data = await teacherDeleteGroup(deleteId, token!)
    setIsLoading(false)
    if (data.success) {
      setGroups((prev) => prev.filter((g) => g.id !== deleteId))
      setDeleteId(null)
      setSelectedGroupId("")
      addToast(`تم حذف مجموعة "${name}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "add", label: "إضافة مجموعة", icon: <Plus className="w-4 h-4" /> },
    { id: "edit", label: "تعديل مجموعة", icon: <Edit className="w-4 h-4" /> },
    { id: "delete", label: "حذف مجموعة", icon: <Trash2 className="w-4 h-4" /> },
  ]

  function handleGradeChange(v: string) {
    setSelectedGrade(v)
    setSelectedCourseId("")
    setSelectedGroupId("")
    setForm(emptyForm)
  }

  function handleCourseChange(v: string) {
    setSelectedCourseId(v)
    setSelectedGroupId("")
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة المجموعات</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف مجموعات الكورسات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setSelectedGrade("")
              setSelectedCourseId("")
              setSelectedGroupId("")
              setForm(emptyForm)
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
              tab === t.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted hover:text-primary"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Add Tab */}
        {tab === "add" && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إضافة مجموعة جديدة</h2>
                <p className="text-muted text-sm mt-1">اختر الكورس وأضف المجموعة</p>
              </div>

              <GradeCourseSelectors
                grade={selectedGrade} courseId={selectedCourseId} groupId={selectedGroupId}
                onGradeChange={handleGradeChange}
                onCourseChange={handleCourseChange}
                onGroupChange={setSelectedGroupId}
                coursesForGrade={coursesForGrade}
                groupsForCourse={groupsForCourse}
              />

              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">اسم المجموعة *</label>
                <input
                  type="text"
                  placeholder="مثال: مجموعة A — السبت والثلاثاء 6 مساءً"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                />
              </div>

              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">وصف المجموعة *</label>
                <textarea
                  placeholder="تفاصيل المجموعة ومحتواها..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
                />
              </div>

              <ScheduleSection form={form} updateField={updateField} />

              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />جاري الإضافة...</>
                ) : (
                  <><Plus className="w-5 h-5" />إضافة المجموعة</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Edit Tab */}
        {tab === "edit" && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">اختر المجموعة للتعديل</h2>
              </div>
              <GradeCourseSelectors
                grade={selectedGrade} courseId={selectedCourseId} groupId={selectedGroupId}
                onGradeChange={handleGradeChange}
                onCourseChange={handleCourseChange}
                onGroupChange={handleSelectForEdit}
                showGroups
                coursesForGrade={coursesForGrade}
                groupsForCourse={groupsForCourse}
              />
            </div>

            <AnimatePresence>
              {selectedGroupId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <button
                      onClick={() => { setSelectedGroupId(""); setForm(emptyForm) }}
                      className="text-sm text-muted hover:text-red-500 transition font-bold"
                    >
                      إلغاء
                    </button>
                    <h2 className="font-bold text-secondary text-lg">تعديل المجموعة</h2>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">اسم المجموعة</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                    />
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">وصف المجموعة</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
                    />
                  </div>

                  <ScheduleSection form={form} updateField={updateField} />

                  <button
                    onClick={handleEdit}
                    disabled={isLoading}
                    className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</>
                    ) : (
                      <><Save className="w-5 h-5" />حفظ التعديلات</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Delete Tab */}
        {tab === "delete" && (
          <motion.div
            key="delete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-red-500 text-lg">حذف مجموعة</h2>
              </div>
              <GradeCourseSelectors
                grade={selectedGrade} courseId={selectedCourseId} groupId={selectedGroupId}
                onGradeChange={handleGradeChange}
                onCourseChange={handleCourseChange}
                onGroupChange={setSelectedGroupId}
                showGroups
                coursesForGrade={coursesForGrade}
                groupsForCourse={groupsForCourse}
              />
            </div>

            <AnimatePresence>
              {selectedGroupId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50/50 border border-red-200/50 rounded-3xl p-8 text-center space-y-5"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-7 h-7 text-red-500 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="font-bold text-red-600 text-lg">حذف المجموعة</h3>
                    <p className="text-muted text-sm mt-2 leading-7">
                      هل تريد حذف مجموعة
                      <strong className="text-secondary mx-1">
                        "{groups.find((g) => g.id === Number(selectedGroupId))?.name}"
                      </strong>
                      ؟
                    </p>
                  </div>

                  <button
                    onClick={() => setDeleteId(Number(selectedGroupId))}
                    className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 transition flex items-center gap-2 mx-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف المجموعة
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        title="تأكيد الحذف النهائي"
        message={
          <>
            هل أنت متأكد من حذف مجموعة
            <strong className="text-secondary mx-1">
              "{groups.find((g) => g.id === deleteId)?.name}"
            </strong>
            ؟ هذا الإجراء لا يمكن التراجع عنه.
          </>
        }
      />

    </div>
  )
}

export default GroupManager