import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Edit, Trash2, Eye, EyeOff,
  Loader2, User, X
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { useAuth } from "../../context/useAuth"
import { teacherGetStaff, teacherCreateStaff, teacherUpdateStaff, teacherDeleteStaff } from "../../services/api"

// Keep in sync with the sidebar links in TeacherLayout.tsx and sanad_valid_permission_keys() on the backend.
const ALL_PERMISSIONS = [
  { key: "course-content", label: "إدارة الكورسات (الترتيب)" },
  { key: "courses", label: "إضافة وتعديل الكورسات" },
  { key: "groups", label: "إضافة وتعديل المجموعات" },
  { key: "categories", label: "فئات الكورسات" },
  { key: "videos", label: "الفيديوهات" },
  { key: "notes", label: "المذكرات" },
  { key: "links", label: "الروابط" },
  { key: "exams", label: "الاختبارات" },
  { key: "assignments", label: "الواجبات" },
  { key: "question-groups", label: "مجموعات الأسئلة" },
  { key: "question-bank", label: "بنك الأسئلة" },
  { key: "codes", label: "إنشاء أكواد" },
  { key: "code-details", label: "تفاصيل كود اشتراك" },
  { key: "subscription-control", label: "إلغاء وحظر الاشتراك" },
  { key: "reports", label: "الإحصائيات العامة" },
  { key: "exam-stats", label: "إحصائيات الاختبارات والواجبات" },
  { key: "video-stats", label: "إحصائيات المشاهدات" },
  { key: "comprehensive-reports", label: "التقارير الشاملة" },
  { key: "students", label: "جدول المستخدمين" },
  { key: "student-code-details", label: "تفاصيل كود الطالب" },
  { key: "edit-student", label: "تعديل بيانات الطالب" },
  { key: "subscriptions", label: "جدول الاشتراكات" },
  { key: "announcements", label: "إدارة الإشعارات" },
]

interface StaffMember {
  id: string
  name: string
  phone: string
  permissions: string[]
}

interface ApiStaff {
  id: number
  name: string
  phone: string
  permissions: string[]
}

function mapApiStaff(s: ApiStaff): StaffMember {
  return { id: String(s.id), name: s.name, phone: s.phone, permissions: s.permissions }
}

interface StaffForm {
  name: string
  phone: string
  password: string
  permissions: string[]
}

const emptyForm: StaffForm = {
  name: "",
  phone: "",
  password: "",
  permissions: [],
}

type Tab = "list" | "add" | "edit"

function StaffFormFields({
  form, updateField, togglePermission, showPassword, setShowPassword, isLoading,
  onSubmit, submitLabel, submitColor = "bg-primary", isEdit = false,
}: {
  form: StaffForm
  updateField: (field: keyof StaffForm, value: string | string[]) => void
  togglePermission: (key: string) => void
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  isLoading: boolean
  onSubmit: () => void
  submitLabel: string
  submitColor?: string
  isEdit?: boolean
}) {
  return (
    <div className="space-y-5">

      {/* Name */}
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الاسم *</label>
        <input
          type="text"
          placeholder="اسم الموظف"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        />
      </div>

      {/* Phone */}
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">رقم الهاتف (اسم المستخدم) *</label>
        <input
          type="tel"
          placeholder="01XXXXXXXXX"
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          disabled={isEdit}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
          maxLength={11}
          dir="ltr"
        />
        {isEdit && <p className="text-xs text-muted mt-1">لا يمكن تغيير رقم الهاتف بعد الإنشاء</p>}
      </div>

      {/* Password */}
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">
          {isEdit ? "كلمة مرور جديدة (اتركها فارغة للإبقاء عليها)" : "كلمة المرور *"}
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="********"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-3.5 text-muted hover:text-secondary transition"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Permissions */}
      <div className="text-right">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() =>
              updateField(
                "permissions",
                form.permissions.length === ALL_PERMISSIONS.length
                  ? []
                  : ALL_PERMISSIONS.map((p) => p.key)
              )
            }
            className="text-xs text-primary font-bold hover:underline"
          >
            {form.permissions.length === ALL_PERMISSIONS.length ? "إلغاء الكل" : "تحديد الكل"}
          </button>
          <label className="text-sm font-bold text-text">الصلاحيات (صفحات الشريط الجانبي) *</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_PERMISSIONS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => togglePermission(p.key)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-right ${
                form.permissions.includes(p.key)
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-background border-border text-text hover:border-primary/50"
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                form.permissions.includes(p.key) ? "bg-primary border-primary" : "border-border"
              }`}>
                {form.permissions.includes(p.key) && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-bold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading}
        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60 ${submitColor}`}
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  )
}

function StaffManager() {
  const { getToken } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [tab, setTab] = useState<Tab>("list")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<StaffForm>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const loadStaff = useCallback(() => {
    const token = getToken()
    if (!token) return
    teacherGetStaff(token).then((data) => {
      if (Array.isArray(data)) setStaff(data.map(mapApiStaff))
      setIsFetching(false)
    })
  }, [getToken])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  function updateField(field: keyof StaffForm, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function togglePermission(key: string) {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }))
  }

  function validateForm(isEdit: boolean): boolean {
    if (!form.name.trim()) { addToast("يرجى إدخال الاسم", "error"); return false }
    if (!isEdit && !/^01[0-9]{9}$/.test(form.phone.trim())) { addToast("رقم الهاتف غير صحيح", "error"); return false }
    if (!isEdit && !form.password.trim()) { addToast("يرجى إدخال كلمة المرور", "error"); return false }
    if (form.password && form.password.trim().length < 8) { addToast("كلمة المرور 8 أحرف على الأقل", "error"); return false }
    if (form.permissions.length === 0) { addToast("يرجى تحديد صلاحية واحدة على الأقل", "error"); return false }
    return true
  }

  async function handleAdd() {
    if (!validateForm(false)) return
    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateStaff({
      name: form.name.trim(),
      phone: form.phone.trim(),
      password: form.password.trim(),
      permissions: form.permissions,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      loadStaff()
      setForm(emptyForm)
      setTab("list")
      addToast(`تم إضافة "${form.name.trim()}" بنجاح ✓`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة الموظف", "error")
    }
  }

  function handleEditClick(member: StaffMember) {
    setEditingId(member.id)
    setForm({
      name: member.name,
      phone: member.phone,
      password: "",
      permissions: member.permissions,
    })
    setTab("edit")
  }

  async function handleEdit() {
    if (!editingId || !validateForm(true)) return
    setIsLoading(true)
    const token = getToken()
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      permissions: form.permissions,
    }
    if (form.password.trim()) payload.password = form.password.trim()

    const data = await teacherUpdateStaff(Number(editingId), payload, token!)
    setIsLoading(false)
    if (data.success) {
      loadStaff()
      setEditingId(null)
      setForm(emptyForm)
      setTab("list")
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const token = getToken()
    const name = staff.find((m) => m.id === deleteId)?.name
    const data = await teacherDeleteStaff(Number(deleteId), token!)
    setIsLoading(false)
    if (data.success) {
      setStaff((prev) => prev.filter((m) => m.id !== deleteId))
      setDeleteId(null)
      addToast(`تم حذف "${name}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة الموظفين</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف الموظفين وصلاحياتهم — كل موظف يرى فقط الصفحات المسموح له بها</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        <button
          onClick={() => { setForm(emptyForm); setTab("list") }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "list" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"}`}
        >
          الموظفون ({staff.length})
        </button>
        <button
          onClick={() => { setForm(emptyForm); setTab("add") }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${tab === "add" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"}`}
        >
          <Plus className="w-4 h-4" />
          إضافة موظف
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* List */}
        {tab === "list" && (
          <motion.div key="list" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {isFetching ? (
              <div className="text-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
                <User className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="font-bold text-secondary text-lg mb-2">لا يوجد موظفون</h3>
                <p className="text-muted text-sm mb-6">ابدأ بإضافة أول موظف</p>
                <button onClick={() => setTab("add")} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
                  إضافة موظف
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {staff.map((member) => (
                  <motion.div
                    key={member.id}
                    className="bg-card border border-border rounded-2xl p-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(member)} className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(member.id)} className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <h3 className="font-bold text-secondary">{member.name}</h3>
                          <p className="text-xs text-muted mt-0.5" dir="ltr">{member.phone}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted/10">
                          <User className="w-5 h-5 text-muted" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted/10 text-muted">
                          موظف
                        </span>
                        <span className="text-xs text-muted font-bold">الصلاحيات:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {member.permissions.length === 0 ? (
                          <span className="text-xs text-muted">لا توجد صلاحيات محددة</span>
                        ) : (
                          member.permissions.map((pKey) => {
                            const p = ALL_PERMISSIONS.find((x) => x.key === pKey)
                            return p ? (
                              <span key={pKey} className="text-xs bg-background border border-border px-2.5 py-1 rounded-lg font-bold text-text">
                                {p.label}
                              </span>
                            ) : null
                          })
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Add */}
        {tab === "add" && (
          <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إضافة موظف جديد</h2>
              </div>
              <StaffFormFields
                form={form}
                updateField={updateField}
                togglePermission={togglePermission}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isLoading={isLoading}
                onSubmit={handleAdd}
                submitLabel="إضافة الموظف"
              />
            </div>
          </motion.div>
        )}

        {/* Edit */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                <button onClick={() => { setEditingId(null); setForm(emptyForm); setTab("list") }} className="text-sm text-muted hover:text-red-500 transition font-bold flex items-center gap-1">
                  <X className="w-4 h-4" />إلغاء
                </button>
                <h2 className="font-bold text-secondary text-lg">تعديل بيانات الموظف</h2>
              </div>
              <StaffFormFields
                form={form}
                updateField={updateField}
                togglePermission={togglePermission}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isLoading={isLoading}
                onSubmit={handleEdit}
                submitLabel="حفظ التعديلات"
                submitColor="bg-amber-500"
                isEdit
              />
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
        confirmLabel="حذف"
        message={
          <>
            هل أنت متأكد من حذف
            <strong className="text-secondary mx-1">"{staff.find((m) => m.id === deleteId)?.name}"</strong>؟
          </>
        }
      />

    </div>
  )
}

export default StaffManager
