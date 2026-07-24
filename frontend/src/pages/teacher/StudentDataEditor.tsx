import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Save, Eye, EyeOff, Loader2, User,
  Phone, Users as UsersIcon, MapPin, GraduationCap, BookOpen, Hash, SearchX, KeyRound
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import useToast from "../../hooks/useToast"
import { governorates, grades, educationTypes } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetStudents, teacherUpdateStudent } from "../../services/api"

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

function StudentDataEditor() {
  const [query, setQuery] = useState("")
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState<StudentForm>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetStudents(token).then((data) => {
      if (Array.isArray(data)) setAllStudents(data.map(mapApiStudent))
      setLoadingList(false)
    })
  }, [getToken])

  const normalizedQuery = query.trim().toLowerCase()
  const results = normalizedQuery
    ? allStudents.filter((s) =>
        s.fullName.toLowerCase().includes(normalizedQuery) ||
        s.studentPhone.includes(normalizedQuery) ||
        s.parentPhone.includes(normalizedQuery) ||
        s.studentCode.includes(normalizedQuery)
      )
    : []

  function updateField(field: keyof StudentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSelect(student: Student) {
    setSelected(student)
    setForm({
      fullName: student.fullName,
      studentPhone: student.studentPhone,
      parentPhone: student.parentPhone,
      governorate: student.governorate,
      gender: student.gender,
      grade: student.grade,
      educationType: student.educationType,
      password: "",
    })
    setShowPassword(false)
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
    if (form.password && form.password.length < 8) { addToast("كلمة المرور 8 أحرف على الأقل", "error"); return false }
    return true
  }

  async function handleSave() {
    if (!selected || !validateForm()) return
    setIsSaving(true)
    const token = getToken()
    const payload: Record<string, unknown> = {
      fullName: form.fullName,
      studentPhone: form.studentPhone,
      parentPhone: form.parentPhone,
      governorate: form.governorate,
      gender: form.gender,
      grade: form.grade,
      educationType: form.educationType,
    }
    if (form.password) payload.password = form.password

    const data = await teacherUpdateStudent(Number(selected.id), payload, token!)
    setIsSaving(false)
    if (data.success) {
      const updated = { ...selected, fullName: form.fullName, studentPhone: form.studentPhone, parentPhone: form.parentPhone, governorate: form.governorate, gender: form.gender, grade: form.grade, educationType: form.educationType }
      setSelected(updated)
      setAllStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setForm((prev) => ({ ...prev, password: "" }))
      addToast("تم حفظ بيانات الطالب بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ البيانات", "error")
    }
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">تعديل بيانات الطالب</h1>
        <p className="text-muted text-sm mt-1">ابحث عن الطالب بالاسم أو رقم الهاتف أو رقم ولي الأمر أو الكود التعريفي لتعديل بياناته أو كلمة المرور</p>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-3xl p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث بالاسم / رقم الهاتف / رقم ولي الأمر / الكود..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
            className="w-full px-4 py-3.5 pr-12 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
          />
          <Search className="absolute right-4 top-4 w-4 h-4 text-muted" />
        </div>

        {loadingList && (
          <p className="text-xs text-muted mt-3 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            جاري تحميل بيانات الطلاب...
          </p>
        )}

        {/* Results */}
        {normalizedQuery && !loadingList && (
          <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-center py-8">
                <SearchX className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-muted text-sm font-bold">لا توجد نتائج مطابقة</p>
              </div>
            ) : (
              results.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-right transition-all ${
                    selected?.id === s.id
                      ? "bg-primary/10 border-primary ring-2 ring-primary/10"
                      : "bg-background border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-muted" dir="ltr">{s.studentCode}</span>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-secondary text-sm">{s.fullName}</p>
                    <p className="text-xs text-muted mt-0.5" dir="ltr">{s.studentPhone}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Form */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-3xl overflow-hidden"
          >
            <div className="p-6 bg-linear-to-br from-primary/10 to-primary/5 border-b border-border flex items-center gap-3 justify-end text-right">
              <div>
                <p className="font-bold text-secondary text-lg">{selected.fullName}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary font-mono" dir="ltr">
                  {selected.studentCode}
                </span>
              </div>
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {selected.fullName.charAt(0)}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2 text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    الاسم الرباعي *
                    <User className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  />
                </div>

                <div className="text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    رقم هاتف الطالب *
                    <Phone className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <input
                    type="tel"
                    value={form.studentPhone}
                    onChange={(e) => updateField("studentPhone", e.target.value)}
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  />
                </div>

                <div className="text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    رقم هاتف ولي الأمر *
                    <UsersIcon className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <input
                    type="tel"
                    value={form.parentPhone}
                    onChange={(e) => updateField("parentPhone", e.target.value)}
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  />
                </div>

                <div className="text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    المحافظة *
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <select
                    value={form.governorate}
                    onChange={(e) => updateField("governorate", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  >
                    <option value="">اختر المحافظة</option>
                    {governorates.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

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

                <div className="text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    الصف الدراسي *
                    <GraduationCap className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <select
                    value={form.grade}
                    onChange={(e) => updateField("grade", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  >
                    <option value="">اختر الصف</option>
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    نوع التعليم *
                    <BookOpen className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <select
                    value={form.educationType}
                    onChange={(e) => updateField("educationType", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  >
                    <option value="">اختر نوع التعليم</option>
                    {educationTypes.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div className="text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    الكود التعريفي
                    <Hash className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <input
                    type="text"
                    value={selected.studentCode}
                    disabled
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-right font-mono opacity-60 cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2 text-right">
                  <label className="flex items-center gap-1.5 justify-end text-sm font-bold text-text mb-2">
                    كلمة مرور جديدة (اتركها فارغة للإبقاء عليها كما هي)
                    <KeyRound className="w-3.5 h-3.5 text-muted" />
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      placeholder="********"
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

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isSaving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</>
                ) : (
                  <><Save className="w-5 h-5" />حفظ التعديلات</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default StudentDataEditor
