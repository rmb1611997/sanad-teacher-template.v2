import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Save, UploadCloud,
  Calendar, Clock, Info, Loader2
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import Toggle from "../../components/ui/Toggle"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetNotes, teacherCreateNote, teacherUpdateNote, teacherDeleteNote, uploadMedia } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import type { Course } from "../../types/course"

interface ApiNote {
  id: number
  title: string
  description: string
  fileUrl: string
  hasSchedule: boolean
  showFrom?: string
  hideTo?: string
  courseId: number
  groupId: number
}

interface Note {
  id: string
  groupId: number
  courseId: number
  grade: string
  title: string
  description: string
  fileName: string
  showFrom?: string
  showFromTime?: string
  hideTo?: string
  hideToTime?: string
}

interface NoteForm {
  title: string
  description: string
  fileName: string
  fileUrl: string
  hasSchedule: boolean
  showFrom: string
  showFromTime: string
  hideTo: string
  hideToTime: string
}

const emptyForm: NoteForm = {
  title: "",
  description: "",
  fileName: "",
  fileUrl: "",
  hasSchedule: false,
  showFrom: "",
  showFromTime: "",
  hideTo: "",
  hideToTime: "",
}

type Tab = "add" | "edit" | "delete"

interface SelectorsProps {
  grade: string; setGrade: (v: string) => void
  courseId: string; setCourseId: (v: string) => void
  groupId: string; setGroupId: (v: string) => void
  noteId?: string; setNoteId?: (v: string) => void
  showNote?: boolean
  coursesForGrade: Course[]
  groupsForCourse: { id: number; courseId: number; name: string }[]
  notesForGroup: Note[]
  onSelectNote?: (id: string) => void
}

function Selectors({
  grade, setGrade,
  courseId, setCourseId,
  groupId, setGroupId,
  noteId, setNoteId,
  showNote = false,
  coursesForGrade, groupsForCourse, notesForGroup,
  onSelectNote,
}: SelectorsProps) {
  return (
    <div className={`grid gap-4 ${showNote ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
        <select
          value={grade}
          onChange={(e) => { setGrade(e.target.value); setCourseId(""); setGroupId(""); if (setNoteId) setNoteId("") }}
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
          onChange={(e) => { setCourseId(e.target.value); setGroupId(""); if (setNoteId) setNoteId("") }}
          disabled={!grade}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!grade ? "اختر الصف أولاً" : "اختر الكورس"}</option>
          {coursesForGrade.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">المجموعة</label>
        <select
          value={groupId}
          onChange={(e) => { setGroupId(e.target.value); if (setNoteId) setNoteId("") }}
          disabled={!courseId}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!courseId ? "اختر الكورس أولاً" : "اختر المجموعة"}</option>
          {groupsForCourse.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {showNote && setNoteId && (
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">المذكرة</label>
          <select
            value={noteId}
            onChange={(e) => { setNoteId(e.target.value); onSelectNote?.(e.target.value) }}
            disabled={!groupId}
            className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
          >
            <option value="">{!groupId ? "اختر المجموعة أولاً" : "اختر المذكرة"}</option>
            {notesForGroup.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

interface ScheduleSectionProps {
  form: NoteForm
  updateField: (field: keyof NoteForm, value: string | boolean) => void
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
                  تاريخ الظهور
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted mb-1">التاريخ</label>
                    <input type="date" value={form.showFrom} onChange={(e) => updateField("showFrom", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">الوقت</label>
                    <input type="time" value={form.showFromTime} onChange={(e) => updateField("showFromTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl w-fit">
                  <Clock className="w-4 h-4" />
                  تاريخ الإخفاء (اختياري)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted mb-1">التاريخ</label>
                    <input type="date" value={form.hideTo} onChange={(e) => updateField("hideTo", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">الوقت</label>
                    <input type="time" value={form.hideToTime} onChange={(e) => updateField("hideToTime", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 p-3.5 bg-primary/5 border border-primary/20 rounded-xl mt-3">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                لو حددت تاريخ ظهور بس من غير إخفاء، المذكرة هتظهر من التاريخ ده وتفضل ظاهرة علطول.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface FormFieldsProps {
  form: NoteForm
  updateField: (field: keyof NoteForm, value: string | boolean) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isUploading: boolean
}

function FormFields({ form, updateField, onFileChange, isUploading }: FormFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">عنوان المذكرة *</label>
        <input
          type="text"
          placeholder="مثال: مذكرة مراجعة الفصل الأول"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        />
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">وصف المذكرة *</label>
        <textarea
          placeholder="وصف محتويات المذكرة..."
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-text mb-2 text-right">ملف المذكرة *</label>
        <label className="relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary transition cursor-pointer bg-background group">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="font-bold text-sm text-muted">جاري رفع الملف...</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-muted group-hover:text-primary transition" />
              <p className="font-bold text-sm text-center">
                {form.fileName ? (
                  <span className="text-primary">{form.fileName}</span>
                ) : (
                  <span className="text-muted">اسحب الملف هنا أو اضغط للاختيار</span>
                )}
              </p>
            </>
          )}
          <p className="text-xs text-muted">يدعم PDF, DOC, PPT</p>
          <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={onFileChange} className="hidden" disabled={isUploading} />
        </label>
      </div>

      <ScheduleSection form={form} updateField={updateField} />
    </div>
  )
}

function NoteManager() {
  const [tab, setTab] = useState<Tab>("add")
  const [notes, setNotes] = useState<Note[]>([])
  const [form, setForm] = useState<NoteForm>(emptyForm)

  const [addGrade, setAddGrade] = useState("")
  const [addCourseId, setAddCourseId] = useState("")
  const [addGroupId, setAddGroupId] = useState("")

  const [editGrade, setEditGrade] = useState("")
  const [editCourseId, setEditCourseId] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editNoteId, setEditNoteId] = useState("")

  const [delGrade, setDelGrade] = useState("")
  const [delCourseId, setDelCourseId] = useState("")
  const [delGroupId, setDelGroupId] = useState("")
  const [delNoteId, setDelNoteId] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()
  const { courses, groups } = useTeacherCoursesGroups(getToken())

  const mapApiNote = useCallback((n: ApiNote): Note => {
    return {
      id: String(n.id),
      groupId: n.groupId,
      courseId: n.courseId,
      grade: courses.find((c) => c.id === n.courseId)?.grade || "",
      title: n.title,
      description: n.description,
      fileName: n.fileUrl,
      showFrom: n.showFrom || undefined,
      hideTo: n.hideTo || undefined,
    }
  }, [courses])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetNotes(token).then((data) => {
      if (Array.isArray(data)) setNotes(data.map(mapApiNote))
    })
  }, [getToken, mapApiNote])

  function updateField(field: keyof NoteForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const token = getToken()
    if (!token) return
    setIsUploading(true)
    const media = await uploadMedia(file, token)
    setIsUploading(false)
    if (media?.source_url) {
      updateField("fileName", file.name)
      updateField("fileUrl", media.source_url)
    } else {
      addToast("حدث خطأ أثناء رفع الملف", "error")
    }
  }

  const coursesForGrade = (g: string) => courses.filter((c) => c.grade === g)
  const groupsForCourse = (cId: string) => groups.filter((g) => g.courseId === Number(cId))
  const notesForGroup = (gId: string) => notes.filter((n) => n.groupId === Number(gId))

  function validateForm(): boolean {
    if (!form.title || !form.description) {
      addToast("يرجى تعبئة العنوان والوصف", "error")
      return false
    }
    if (!form.fileUrl) {
      addToast("يرجى رفع ملف المذكرة", "error")
      return false
    }
    return true
  }

  async function handleAdd() {
    if (!addGrade) { addToast("اختر الصف الدراسي", "error"); return }
    if (!addCourseId) { addToast("اختر الكورس", "error"); return }
    if (!addGroupId) { addToast("اختر المجموعة", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateNote({
      title: form.title,
      description: form.description,
      fileUrl: form.fileUrl,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.showFrom : undefined,
      hideTo: form.hasSchedule ? form.hideTo : undefined,
      courseId: Number(addCourseId),
      groupId: Number(addGroupId),
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setNotes((prev) => [mapApiNote(data.note), ...prev])
      setForm(emptyForm)
      addToast(`تم رفع "${form.title}" بنجاح ✓`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء رفع المذكرة", "error")
    }
  }

  function handleSelectForEdit(noteId: string) {
    setEditNoteId(noteId)
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setForm({
        title: note.title,
        description: note.description,
        fileName: note.fileName,
        fileUrl: note.fileName,
        hasSchedule: !!note.showFrom,
        showFrom: note.showFrom || "",
        showFromTime: note.showFromTime || "",
        hideTo: note.hideTo || "",
        hideToTime: note.hideToTime || "",
      })
    }
  }

  async function handleEdit() {
    if (!editNoteId) { addToast("اختر المذكرة", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateNote(Number(editNoteId), {
      title: form.title,
      description: form.description,
      fileUrl: form.fileUrl,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.showFrom : undefined,
      hideTo: form.hasSchedule ? form.hideTo : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setNotes((prev) => prev.map((n) => (n.id === editNoteId ? mapApiNote(data.note) : n)))
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!delNoteId) return
    setIsLoading(true)
    const token = getToken()
    const title = notes.find((n) => n.id === delNoteId)?.title
    const data = await teacherDeleteNote(Number(delNoteId), token!)
    setIsLoading(false)
    if (data.success) {
      setNotes((prev) => prev.filter((n) => n.id !== delNoteId))
      setDelNoteId("")
      setShowDeleteConfirm(false)
      addToast(`تم حذف "${title}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "add", label: "إضافة مذكرة" },
    { id: "edit", label: "تعديل مذكرة" },
    { id: "delete", label: "حذف مذكرة" },
  ]

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة المذكرات</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف المذكرات الدراسية</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setForm(emptyForm)
              setEditNoteId("")
              setDelNoteId("")
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
                <h2 className="font-bold text-secondary text-lg">إضافة مذكرة جديدة</h2>
              </div>

              <Selectors
                grade={addGrade} setGrade={setAddGrade}
                courseId={addCourseId} setCourseId={setAddCourseId}
                groupId={addGroupId} setGroupId={setAddGroupId}
                coursesForGrade={coursesForGrade(addGrade)}
                groupsForCourse={groupsForCourse(addCourseId)}
                notesForGroup={notesForGroup(addGroupId)}
              />

              <div className="border-t border-border pt-5">
                <FormFields form={form} updateField={updateField} onFileChange={handleFileChange} isUploading={isUploading} />
              </div>

              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الرفع...</> : <><Plus className="w-5 h-5" />رفع المذكرة</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* Edit */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">اختر المذكرة للتعديل</h2>
              </div>
              <Selectors
                grade={editGrade} setGrade={setEditGrade}
                courseId={editCourseId} setCourseId={setEditCourseId}
                groupId={editGroupId} setGroupId={setEditGroupId}
                noteId={editNoteId} setNoteId={setEditNoteId}
                showNote
                coursesForGrade={coursesForGrade(editGrade)}
                groupsForCourse={groupsForCourse(editCourseId)}
                notesForGroup={notesForGroup(editGroupId)}
                onSelectNote={handleSelectForEdit}
              />
            </div>

            <AnimatePresence>
              {editNoteId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <button onClick={() => { setEditNoteId(""); setForm(emptyForm) }} className="text-sm text-muted hover:text-red-500 transition font-bold">إلغاء</button>
                    <h2 className="font-bold text-secondary text-lg">تعديل المذكرة</h2>
                  </div>

                  <FormFields form={form} updateField={updateField} onFileChange={handleFileChange} isUploading={isUploading} />

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
                <h2 className="font-bold text-red-500 text-lg">حذف مذكرة</h2>
              </div>
              <Selectors
                grade={delGrade} setGrade={setDelGrade}
                courseId={delCourseId} setCourseId={setDelCourseId}
                groupId={delGroupId} setGroupId={setDelGroupId}
                noteId={delNoteId} setNoteId={setDelNoteId}
                showNote
                coursesForGrade={coursesForGrade(delGrade)}
                groupsForCourse={groupsForCourse(delCourseId)}
                notesForGroup={notesForGroup(delGroupId)}
              />
            </div>

            <AnimatePresence>
              {delNoteId && !showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-50/50 border border-red-200/50 rounded-3xl p-6 flex items-center justify-between"
                >
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف المذكرة
                  </button>
                  <div className="text-right">
                    <h4 className="font-bold text-secondary">{notes.find((n) => n.id === delNoteId)?.title}</h4>
                    <p className="text-xs text-muted mt-1">{notes.find((n) => n.id === delNoteId)?.fileName}</p>
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
            هل أنت متأكد من حذف مذكرة
            <strong className="text-secondary mx-1">"{notes.find((n) => n.id === delNoteId)?.title}"</strong>؟
            هذا الإجراء لا يمكن التراجع عنه.
          </>
        }
      />

    </div>
  )
}

export default NoteManager