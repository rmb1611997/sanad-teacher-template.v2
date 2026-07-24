import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Edit, Save, Eye, EyeOff, Loader2, X, User,
  Phone, Users as UsersIcon, MapPin, GraduationCap, BookOpen, Calendar, Hash, SearchX
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import useToast from "../../hooks/useToast"
import { governorates, grades, educationTypes } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetStudents, teacherGetCourses, teacherUpdateStudent } from "../../services/api"

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

interface Course {
  id: string
  title: string
  image: string
  grade: string
}

interface ApiCourse {
  id: number
  title: string
  image: string
  grade: string
}

function mapApiCourse(c: ApiCourse): Course {
  return { id: String(c.id), title: c.title, image: c.image, grade: c.grade }
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

function StudentCodeDetails() {
  const [code, setCode] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<StudentForm>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()

  function updateField(field: keyof StudentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSearch() {
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      addToast("يرجى إدخال كود مكوّن من 6 أرقام", "error")
      return
    }
    const token = getToken()
    if (!token) return

    setIsSearching(true)
    const [studentsData, coursesData] = await Promise.all([
      teacherGetStudents(token),
      teacherGetCourses(token),
    ])
    setIsSearching(false)
    setSearched(true)

    const allStudents: Student[] = Array.isArray(studentsData) ? studentsData.map(mapApiStudent) : []
    const allCourses: Course[] = Array.isArray(coursesData) ? coursesData.map(mapApiCourse) : []
    setCourses(allCourses)

    const found = allStudents.find((s) => s.studentCode === trimmed) ?? null
    setStudent(found)
  }

  function handleEditClick() {
    if (!student) return
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
    setIsEditing(true)
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

  async function handleSave() {
    if (!student || !validateForm()) return
    setIsSaving(true)
    const token = getToken()
    const data = await teacherUpdateStudent(Number(student.id), {
      fullName: form.fullName,
      studentPhone: form.studentPhone,
      parentPhone: form.parentPhone,
      governorate: form.governorate,
      gender: form.gender,
      grade: form.grade,
      educationType: form.educationType,
      password: form.password,
    }, token!)
    setIsSaving(false)
    if (data.success) {
      setStudent(mapApiStudent(data.student))
      setIsEditing(false)
      setForm(emptyForm)
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  const subscribedCourseObjects = student
    ? courses.filter((c) => student.subscribedCourses.includes(c.id))
    : []

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">تفاصيل كود الطالب</h1>
        <p className="text-muted text-sm mt-1">ابحث عن طالب باستخدام الكود التعريفي المكوّن من 6 أرقام</p>
      </div>

      {/* Search Box */}
      <div className="bg-card border border-border rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="numeric"
              placeholder="أدخل الكود التعريفي (6 أرقام)"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
              maxLength={6}
              dir="ltr"
              className="w-full px-4 py-3.5 pr-12 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-center font-mono text-lg tracking-widest"
            />
            <Hash className="absolute right-4 top-4 w-4 h-4 text-muted" />
          </div>
          <motion.button
            onClick={handleSearch}
            disabled={isSearching}
            className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            بحث
          </motion.button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searched && !student && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16 bg-card border-2 border-dashed border-red-200 rounded-3xl"
          >
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <SearchX className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="font-bold text-secondary text-lg mb-2">لم يتم العثور على طالب</h3>
            <p className="text-muted text-sm">تأكد من صحة الكود التعريفي المُدخل وحاول مرة أخرى</p>
          </motion.div>
        )}

        {student && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Student Info Card */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden">
              <div className="p-6 bg-linear-to-br from-primary/10 to-primary/5 border-b border-border flex items-center justify-between flex-wrap gap-4">
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition"
                >
                  <Edit className="w-4 h-4" />
                  تعديل البيانات
                </button>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="font-bold text-secondary text-lg">{student.fullName}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary font-mono" dir="ltr">
                      {student.studentCode}
                    </span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-xl shrink-0">
                    {student.fullName.charAt(0)}
                  </div>
                </div>
              </div>

              <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoItem icon={User} label="الاسم" value={student.fullName} />
                <InfoItem icon={Phone} label="رقم الهاتف" value={student.studentPhone} dir="ltr" />
                <InfoItem icon={UsersIcon} label="رقم ولي الأمر" value={student.parentPhone} dir="ltr" />
                <InfoItem icon={MapPin} label="المحافظة" value={student.governorate} />
                <InfoItem icon={User} label="النوع" value={student.gender} />
                <InfoItem icon={GraduationCap} label="الصف الدراسي" value={student.grade} />
                <InfoItem icon={BookOpen} label="نوع التعليم" value={student.educationType} />
                <InfoItem
                  icon={Calendar}
                  label="تاريخ التسجيل"
                  value={new Date(student.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}
                />
                <InfoItem icon={Hash} label="الكود التعريفي" value={student.studentCode} dir="ltr" mono />
              </div>
            </div>

            {/* Subscribed Courses */}
            <div className="text-right">
              <h2 className="text-lg font-bold text-secondary mb-4">
                الكورسات المشترك فيها ({subscribedCourseObjects.length})
              </h2>

              {subscribedCourseObjects.length === 0 ? (
                <div className="text-center py-10 bg-card border border-border rounded-2xl">
                  <BookOpen className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
                  <p className="text-muted font-bold">الطالب غير مشترك في أي كورس حالياً</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscribedCourseObjects.map((c) => (
                    <motion.div
                      key={c.id}
                      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="h-32 bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                        {c.image ? (
                          <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-10 h-10 text-primary/50" />
                        )}
                      </div>
                      <div className="p-4 text-right">
                        <p className="font-bold text-secondary text-sm truncate">{c.title}</p>
                        <p className="text-xs text-muted mt-1">{c.grade}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setIsEditing(false); setForm(emptyForm) }}
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
                  onClick={() => { setIsEditing(false); setForm(emptyForm) }}
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
                  onClick={() => { setIsEditing(false); setForm(emptyForm) }}
                  className="flex-1 py-3 bg-background border border-border text-text font-bold rounded-xl hover:border-primary transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />جاري الحفظ...</> : <><Save className="w-4 h-4" />حفظ التعديلات</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

function InfoItem({ icon: Icon, label, value, dir, mono }: { icon: typeof User; label: string; value: string; dir?: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background border border-border text-right">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className={`font-bold text-secondary text-sm truncate ${mono ? "font-mono" : ""}`} dir={dir}>{value || "—"}</p>
      </div>
    </div>
  )
}

export default StudentCodeDetails
