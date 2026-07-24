import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Edit, Trash2, Save, Eye, EyeOff,
  Loader2, X, User, FileSpreadsheet
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { governorates, grades, educationTypes } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetStudents, teacherUpdateStudent, teacherDeleteStudent } from "../../services/api"
import { exportToExcel } from "../../utils/exportExcel"

interface Student {
  id: string
  studentCode: string
  fullName: string
  studentPhone: string
  parentPhone: string
  governorate: string
  gender: string
  grade: string
  educationType: string
  password: string
  subscribedCourses: string[]
  createdAt: string
}

interface ApiStudent {
  id: number
  studentCode: string
  fullName: string
  studentPhone: string
  parentPhone: string
  governorate: string
  gender: string
  grade: string
  educationType: string
  createdAt: string
  subscribedCourses: number[]
}

function mapApiStudent(s: ApiStudent): Student {
  return {
    id: String(s.id),
    studentCode: s.studentCode,
    fullName: s.fullName,
    studentPhone: s.studentPhone,
    parentPhone: s.parentPhone,
    governorate: s.governorate,
    gender: s.gender,
    grade: s.grade,
    educationType: s.educationType,
    password: "",
    subscribedCourses: s.subscribedCourses.map(String),
    createdAt: s.createdAt,
  }
}

interface StudentForm {
  fullName: string
  studentPhone: string
  parentPhone: string
  governorate: string
  gender: string
  grade: string
  educationType: string
  password: string
}

const emptyForm: StudentForm = {
  fullName: "",
  studentPhone: "",
  parentPhone: "",
  governorate: "",
  gender: "",
  grade: "",
  educationType: "",
  password: "",
}

function StudentManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<StudentForm>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()

  useEffect(() => {
    const token = getToken()
    if (token) teacherGetStudents(token).then((data) => { if (Array.isArray(data)) setStudents(data.map(mapApiStudent)) })
  }, [getToken])

  function updateField(field: keyof StudentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const filtered = students.filter((s) =>
    s.fullName.includes(search) ||
    s.studentPhone.includes(search) ||
    s.grade.includes(search)
  )

  function handleExportExcel() {
    if (filtered.length === 0) { addToast("لا يوجد بيانات لتصديرها", "error"); return }
    exportToExcel(
      filtered.map((s) => ({
        "كود الطالب": s.studentCode,
        "اسم الطالب": s.fullName,
        "رقم هاتف الطالب": s.studentPhone,
        "رقم ولي الأمر": s.parentPhone,
        "المحافظة": s.governorate,
        "نوع التعليم": s.educationType,
        "الصف الدراسي": s.grade,
        "عدد الاشتراكات": s.subscribedCourses.length,
      })),
      "بيانات-الطلاب"
    )
    addToast("تم تصدير البيانات بنجاح ✓", "success")
  }

  function handleEditClick(student: Student) {
    setEditingId(student.id)
    setForm({
      fullName: student.fullName,
      studentPhone: student.studentPhone,
      parentPhone: student.parentPhone,
      governorate: student.governorate,
      gender: student.gender,
      grade: student.grade,
      educationType: student.educationType,
      password: student.password,
    })
  }

  function validateForm(): boolean {
    const phoneRegex = /^01[0-9]{9}$/
    if (!form.fullName.trim()) { addToast("يرجى إدخال الاسم", "error"); return false }
    if (form.fullName.trim().split(" ").length < 4) { addToast("الاسم يجب أن يكون رباعياً", "error"); return false }
    if (!phoneRegex.test(form.studentPhone)) { addToast("رقم هاتف الطالب غير صحيح", "error"); return false }
    if (!phoneRegex.test(form.parentPhone)) { addToast("رقم هاتف ولي الأمر غير صحيح", "error"); return false }
    if (!form.governorate) { addToast("يرجى اختيار المحافظة", "error"); return false }
    if (!form.gender) { addToast("يرجى اختيار النوع", "error"); return false }
    if (!form.grade) { addToast("يرجى اختيار الصف", "error"); return false }
    if (!form.educationType) { addToast("يرجى اختيار نوع التعليم", "error"); return false }
    if (form.password.length < 8) { addToast("كلمة المرور 8 أحرف على الأقل", "error"); return false }
    return true
  }

  async function handleEdit() {
    if (!editingId || !validateForm()) return
    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateStudent(Number(editingId), {
      fullName: form.fullName,
      studentPhone: form.studentPhone,
      parentPhone: form.parentPhone,
      governorate: form.governorate,
      gender: form.gender,
      grade: form.grade,
      educationType: form.educationType,
      password: form.password,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setStudents((prev) => prev.map((s) => (s.id === editingId ? mapApiStudent(data.student) : s)))
      setEditingId(null)
      setForm(emptyForm)
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  function handleDeleteClick(student: Student) {
    if (student.subscribedCourses.length > 0) {
      addToast("لا يمكن حذف حساب طالب مشترك في كورس", "error")
      return
    }
    setDeleteId(student.id)
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const token = getToken()
    const name = students.find((s) => s.id === deleteId)?.fullName
    const data = await teacherDeleteStudent(Number(deleteId), token!)
    setIsLoading(false)
    if (data.success) {
      setStudents((prev) => prev.filter((s) => s.id !== deleteId))
      setDeleteId(null)
      addToast(`تم حذف حساب "${name}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-600 transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          تصدير Excel
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-secondary">إدارة المستخدمين</h1>
          <p className="text-muted text-sm mt-1">عرض وتعديل وحذف حسابات الطلاب</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="ابحث باسم الطالب أو رقم الهاتف أو الصف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 pr-12 rounded-xl bg-card border border-border outline-none transition focus:border-primary text-right"
        />
        <Search className="absolute right-4 top-3.5 w-4 h-4 text-muted" />
      </div>

      {/* Students Table */}
      {students.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
          <User className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="font-bold text-secondary text-lg mb-2">لا يوجد طلاب مسجلون</h3>
          <p className="text-muted text-sm">الطلاب سيظهرون هنا بعد تسجيلهم في المنصة</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-card border border-border rounded-2xl">
          <p className="text-muted font-bold">لا توجد نتائج للبحث</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-9 gap-4 px-6 py-3 bg-background border-b border-border text-xs font-bold text-muted text-right min-w-[900px]">
            <span>كود الطالب</span>
            <span>اسم الطالب</span>
            <span>رقم هاتف الطالب</span>
            <span>رقم ولي الأمر</span>
            <span>المحافظة</span>
            <span>نوع التعليم</span>
            <span>الصف الدراسي</span>
            <span>الاشتراكات</span>
            <span className="text-center">الإجراءات</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {filtered.map((student) => (
              <motion.div
                key={student.id}
                className="grid grid-cols-9 gap-4 px-6 py-4 items-center hover:bg-primary/3 transition text-right min-w-[900px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Student Code */}
                <span className="text-sm font-mono font-bold text-secondary" dir="ltr">{student.studentCode}</span>

                {/* Name */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {student.fullName.charAt(0)}
                    </span>
                  </div>
                  <p className="font-bold text-secondary text-sm">{student.fullName}</p>
                </div>

                {/* Student Phone */}
                <span className="text-sm text-text" dir="ltr">{student.studentPhone}</span>

                {/* Parent Phone */}
                <span className="text-sm text-text" dir="ltr">{student.parentPhone}</span>

                {/* Governorate */}
                <span className="text-sm text-text">{student.governorate}</span>

                {/* Education Type */}
                <span className="text-sm text-text">{student.educationType}</span>

                {/* Grade */}
                <span className="text-sm text-text">{student.grade}</span>

                {/* Subscriptions */}
                <span className={`text-sm font-bold ${
                  student.subscribedCourses.length > 0 ? "text-primary" : "text-muted"
                }`}>
                  {student.subscribedCourses.length > 0
                    ? `${student.subscribedCourses.length} كورس`
                    : "غير مشترك"}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEditClick(student)}
                    className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(student)}
                    className={`p-2 rounded-xl border transition ${
                      student.subscribedCourses.length > 0
                        ? "bg-muted/10 border-border text-muted cursor-not-allowed"
                        : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                    }`}
                    title={student.subscribedCourses.length > 0 ? "لا يمكن حذف طالب مشترك" : "حذف الحساب"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setEditingId(null); setForm(emptyForm) }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card border border-border rounded-3xl w-full max-w-2xl z-10 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <button
                  onClick={() => { setEditingId(null); setForm(emptyForm) }}
                  aria-label="إغلاق"
                  className="p-2 rounded-xl hover:bg-background transition text-muted hover:text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-secondary text-lg">تعديل بيانات الطالب</h2>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                <div className="grid md:grid-cols-2 gap-4">

                  {/* Full Name */}
                  <div className="md:col-span-2 text-right">
                    <label className="block text-sm font-bold text-text mb-2">الاسم الرباعي *</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                    />
                  </div>

                  {/* Student Phone */}
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">رقم هاتف الطالب *</label>
                    <input
                      type="tel"
                      value={form.studentPhone}
                      onChange={(e) => updateField("studentPhone", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                      maxLength={11}
                    />
                  </div>

                  {/* Parent Phone */}
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">رقم هاتف ولي الأمر *</label>
                    <input
                      type="tel"
                      value={form.parentPhone}
                      onChange={(e) => updateField("parentPhone", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                      maxLength={11}
                    />
                  </div>

                  {/* Governorate */}
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">المحافظة *</label>
                    <select
                      value={form.governorate}
                      onChange={(e) => updateField("governorate", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                    >
                      <option value="">اختر المحافظة</option>
                      {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Gender */}
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">النوع *</label>
                    <select
                      value={form.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                    >
                      <option value="">اختر النوع</option>
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </div>

                  {/* Grade */}
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">الصف الدراسي *</label>
                    <select
                      value={form.grade}
                      onChange={(e) => updateField("grade", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                    >
                      <option value="">اختر الصف</option>
                      {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Education Type */}
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">نوع التعليم *</label>
                    <select
                      value={form.educationType}
                      onChange={(e) => updateField("educationType", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                    >
                      <option value="">اختر نوع التعليم</option>
                      {educationTypes.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  {/* Password */}
                  <div className="md:col-span-2 text-right">
                    <label className="block text-sm font-bold text-text mb-2">كلمة المرور *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
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

                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border flex gap-3">
                <button
                  onClick={() => { setEditingId(null); setForm(emptyForm) }}
                  className="flex-1 py-3 bg-background border border-border text-text font-bold rounded-xl hover:border-primary transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الحفظ...</> : <><Save className="w-4 h-4" />حفظ التعديلات</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        title="تأكيد حذف الحساب"
        confirmLabel="حذف الحساب"
        message={
          <>
            هل أنت متأكد من حذف حساب
            <strong className="text-secondary mx-1">"{students.find((s) => s.id === deleteId)?.fullName}"</strong>؟
            هذا الإجراء لا يمكن التراجع عنه.
          </>
        }
      />

    </div>
  )
}

export default StudentManager