import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Megaphone, Plus, Edit, Trash2, Calendar, Clock,
  AlertTriangle, CheckCircle2, Link as LinkIcon,
  Power, Loader2, X
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import Toggle from "../../components/ui/Toggle"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { useAuth } from "../../context/useAuth"
import { teacherGetAnnouncements, teacherCreateAnnouncement, teacherUpdateAnnouncement, teacherDeleteAnnouncement } from "../../services/api"

interface Announcement {
  id: string
  title: string
  content: string
  linkUrl?: string
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  isPublished: boolean
  createdAt: string
}

interface ApiAnnouncement {
  id: number
  title: string
  content: string
  linkUrl?: string
  isPublished: boolean
  startDate?: string
  endDate?: string
  createdAt: string
}

function mapApiAnnouncement(a: ApiAnnouncement): Announcement {
  return {
    id: String(a.id),
    title: a.title,
    content: a.content,
    linkUrl: a.linkUrl || undefined,
    startDate: a.startDate || undefined,
    endDate: a.endDate || undefined,
    isPublished: a.isPublished,
    createdAt: a.createdAt,
  }
}

type Tab = "list" | "add" | "edit"
type Status = "active" | "scheduled" | "expired" | "disabled"

function getStatus(ann: Announcement): Status {
  if (!ann.isPublished) return "disabled"
  const now = new Date()
  if (ann.startDate) {
    const start = new Date(`${ann.startDate}T${ann.startTime || "00:00"}`)
    if (now < start) return "scheduled"
  }
  if (ann.endDate) {
    const end = new Date(`${ann.endDate}T${ann.endTime || "23:59"}`)
    if (now > end) return "expired"
  }
  return "active"
}

function getStatusDetails(status: Status) {
  switch (status) {
    case "active":
      return { label: "نشط حالياً", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 }
    case "scheduled":
      return { label: "مجدول للبدء", className: "bg-blue-50 text-blue-700 border-blue-200", Icon: Calendar }
    case "expired":
      return { label: "منتهي الصلاحية", className: "bg-muted/10 text-muted border-border", Icon: AlertTriangle }
    case "disabled":
      return { label: "معطل ومخفي", className: "bg-amber-50 text-amber-700 border-amber-200", Icon: Power }
  }
}

const emptyForm = {
  title: "",
  content: "",
  linkUrl: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  isPublished: true,
}

function AnnouncementForm({ form, updateField, isLoading, onSubmit, submitLabel, submitColor = "bg-primary" }: {
  form: typeof emptyForm
  updateField: (field: keyof typeof emptyForm, value: string | boolean) => void
  isLoading: boolean
  onSubmit: () => void
  submitLabel: string
  submitColor?: string
}) {
  return (
    <div className="space-y-5">

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">
          اسم الإشعار الداخلي (مخفي عن الطلاب) *
        </label>
        <input
          type="text"
          placeholder="مثال: إعلان مراجعة الباب الثاني"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        />
        <p className="text-xs text-muted mt-1">يُستخدم للتنظيم الداخلي فقط ولن يظهر للطلاب</p>
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">
          محتوى الإشعار (الظاهر للطلاب) *
        </label>
        <textarea
          placeholder="اكتب هنا الإعلان بالتفصيل..."
          value={form.content}
          onChange={(e) => updateField("content", e.target.value)}
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>الموصى به: تحت 500 حرف</span>
          <span>{form.content.length} حرف</span>
        </div>
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">
          رابط خارجي (اختياري)
        </label>
        <div className="relative">
          <input
            type="url"
            placeholder="https://..."
            value={form.linkUrl}
            onChange={(e) => updateField("linkUrl", e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-xl bg-background border border-border outline-none transition focus:border-primary"
            dir="ltr"
          />
          <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
        </div>
      </div>

      {/* Schedule */}
      <div className="p-5 bg-background border border-border rounded-2xl space-y-4">
        <h4 className="font-bold text-secondary text-sm text-right flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          جدولة الإشعار (اختياري)
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs text-muted text-right">تاريخ ووقت البدء</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.startDate} onChange={(e) => updateField("startDate", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
              <input type="time" value={form.startTime} onChange={(e) => updateField("startTime", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs text-muted text-right">تاريخ ووقت الانتهاء</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.endDate} onChange={(e) => updateField("endDate", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
              <input type="time" value={form.endTime} onChange={(e) => updateField("endTime", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
            </div>
          </div>
        </div>
      </div>

      <Toggle
        value={form.isPublished}
        onChange={(v) => updateField("isPublished", v)}
        label="حالة التفعيل"
        sublabel="لو معطل مش هيظهر للطلاب"
      />

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60 ${submitColor}`}
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</>
        ) : (
          <><Megaphone className="w-5 h-5" />{submitLabel}</>
        )}
      </button>
    </div>
  )
}

function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tab, setTab] = useState<Tab>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()

  useEffect(() => {
    const token = getToken()
    if (token) teacherGetAnnouncements(token).then((data) => { if (Array.isArray(data)) setAnnouncements(data.map(mapApiAnnouncement)) })
  }, [getToken])

  function updateField(field: keyof typeof emptyForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.content.trim()) {
      addToast("يرجى ملء العنوان والمحتوى", "error")
      return
    }
    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateAnnouncement({
      title: form.title.trim(),
      content: form.content.trim(),
      linkUrl: form.linkUrl.trim() || undefined,
      isPublished: form.isPublished,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setAnnouncements((prev) => [mapApiAnnouncement(data.announcement), ...prev])
      resetForm()
      setTab("list")
      addToast("تم نشر الإشعار بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء نشر الإشعار", "error")
    }
  }

  function handleEditClick(ann: Announcement) {
    setEditingId(ann.id)
    setForm({
      title: ann.title,
      content: ann.content,
      linkUrl: ann.linkUrl || "",
      startDate: ann.startDate || "",
      startTime: ann.startTime || "",
      endDate: ann.endDate || "",
      endTime: ann.endTime || "",
      isPublished: ann.isPublished,
    })
    setTab("edit")
  }

  async function handleEdit() {
    if (!editingId) return
    if (!form.title.trim() || !form.content.trim()) {
      addToast("يرجى ملء العنوان والمحتوى", "error")
      return
    }
    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateAnnouncement(Number(editingId), {
      title: form.title.trim(),
      content: form.content.trim(),
      linkUrl: form.linkUrl.trim() || undefined,
      isPublished: form.isPublished,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? mapApiAnnouncement(data.announcement) : a)))
      resetForm()
      setTab("list")
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleToggle(id: string) {
    const ann = announcements.find((a) => a.id === id)
    if (!ann) return
    const token = getToken()
    const data = await teacherUpdateAnnouncement(Number(id), { isPublished: !ann.isPublished }, token!)
    if (data.success) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? mapApiAnnouncement(data.announcement) : a))
      )
      addToast(ann.isPublished ? "تم تعطيل الإشعار" : "تم تفعيل الإشعار ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء تحديث حالة الإشعار", "error")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const token = getToken()
    const data = await teacherDeleteAnnouncement(Number(deleteId), token!)
    setIsLoading(false)
    if (data.success) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== deleteId))
      setDeleteId(null)
      addToast("تم حذف الإشعار نهائياً", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">الإشعارات والإعلانات</h1>
        <p className="text-muted text-sm mt-1">بث وإدارة الإشعارات لطلابك</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الإشعارات", value: announcements.length, icon: Megaphone, color: "bg-primary/10 text-primary" },
          { label: "نشط حالياً", value: announcements.filter((a) => getStatus(a) === "active").length, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600" },
          { label: "معطل", value: announcements.filter((a) => getStatus(a) === "disabled").length, icon: Power, color: "bg-amber-500/10 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">{s.label}</p>
              <p className="text-xl font-bold text-secondary">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        <button
          onClick={() => { resetForm(); setTab("list") }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "list" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"}`}
        >
          <Megaphone className="w-4 h-4" />
          الإشعارات ({announcements.length})
        </button>
        <button
          onClick={() => { resetForm(); setTab("add") }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "add" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"}`}
        >
          <Plus className="w-4 h-4" />
          إشعار جديد
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* List */}
        {tab === "list" && (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {announcements.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
                <Megaphone className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="font-bold text-secondary text-lg mb-2">لا توجد إشعارات</h3>
                <p className="text-muted text-sm mb-6">ابدأ ببث أول إشعار لطلابك</p>
                <button
                  onClick={() => setTab("add")}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
                >
                  إنشاء إشعار
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => {
                  const status = getStatus(ann)
                  const { label, className, Icon } = getStatusDetails(status)

                  return (
                    <motion.div
                      key={ann.id}
                      className={`bg-card border border-border rounded-2xl p-5 space-y-4 ${!ann.isPublished ? "opacity-70" : ""}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleToggle(ann.id)} className={`p-2 rounded-xl border transition ${ann.isPublished ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" : "bg-background border-border text-muted hover:border-primary"}`}>
                            <Power className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditClick(ann)} className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(ann.id)} className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right flex-1">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${className}`}>
                              <Icon className="w-3 h-3" />
                              {label}
                            </span>
                          </div>
                          <h3 className="font-bold text-secondary">{ann.title}</h3>
                          <p className="text-xs text-muted mt-0.5">
                            {new Date(ann.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-text leading-7 text-right border-t border-border pt-4">{ann.content}</p>

                      {(ann.startDate || ann.endDate || ann.linkUrl) && (
                        <div className="flex flex-wrap gap-3 text-xs text-muted pt-2 border-t border-border justify-end">
                          {ann.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              البدء: {ann.startDate} {ann.startTime}
                            </span>
                          )}
                          {ann.endDate && (
                            <span className="flex items-center gap-1 text-red-500">
                              <Clock className="w-3 h-3" />
                              الانتهاء: {ann.endDate} {ann.endTime}
                            </span>
                          )}
                          {ann.linkUrl && (
                            <a href={ann.linkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                              <LinkIcon className="w-3 h-3" />
                              الرابط المرفق
                            </a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Add */}
        {tab === "add" && (
          <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إنشاء إشعار جديد</h2>
                <p className="text-muted text-sm mt-1">سيصل الإشعار لجميع طلابك المشتركين</p>
              </div>
              <AnnouncementForm form={form} updateField={updateField} isLoading={isLoading} onSubmit={handleAdd} submitLabel="بث الإشعار" />
            </div>
          </motion.div>
        )}

        {/* Edit */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                <button onClick={() => { resetForm(); setTab("list") }} className="text-sm text-muted hover:text-red-500 transition font-bold flex items-center gap-1">
                  <X className="w-4 h-4" />إلغاء
                </button>
                <h2 className="font-bold text-secondary text-lg">تعديل الإشعار</h2>
              </div>
              <AnnouncementForm form={form} updateField={updateField} isLoading={isLoading} onSubmit={handleEdit} submitLabel="حفظ التعديلات" submitColor="bg-amber-500" />
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        message={
          <>
            هل أنت متأكد من حذف إشعار
            <strong className="text-secondary mx-1">"{announcements.find((a) => a.id === deleteId)?.title}"</strong>؟
            لا يمكن التراجع عن هذا الإجراء.
          </>
        }
      />

    </div>
  )
}

export default AnnouncementManager