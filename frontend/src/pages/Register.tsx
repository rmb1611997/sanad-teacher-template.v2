import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, ChevronLeft } from "lucide-react"

import { Input, Select, Button } from "../components/ui"
import { governorates, grades, educationTypes } from "../constants"
import { siteConfig } from "../config/site"
import { register as apiRegister } from "../services/api"

function generateStudentCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

interface RegisterForm {
  firstName: string
  secondName: string
  thirdName: string
  lastName: string
  studentPhone: string
  parentPhone: string
  governorate: string
  gender: string
  grade: string
  educationType: string
  password: string
  confirmPassword: string
  studentCode: string
}

interface RegisterErrors {
  firstName?: string
  secondName?: string
  thirdName?: string
  lastName?: string
  studentPhone?: string
  parentPhone?: string
  governorate?: string
  gender?: string
  grade?: string
  educationType?: string
  password?: string
  confirmPassword?: string
}

const steps = [
  { id: 1, label: "البيانات الشخصية" },
  { id: 2, label: "بيانات الدراسة" },
  { id: 3, label: "كلمة المرور" },
]

function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    secondName: "",
    thirdName: "",
    lastName: "",
    studentPhone: "",
    parentPhone: "",
    governorate: "",
    gender: "",
    grade: "",
    educationType: "",
    password: "",
    confirmPassword: "",
    studentCode: "",
  })

  const [errors, setErrors] = useState<RegisterErrors>({})
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function fieldToStep(field?: string): number {
    if (
      field === "studentPhone" || field === "parentPhone" || field === "fullName" ||
      field === "firstName" || field === "secondName" || field === "thirdName" || field === "lastName"
    ) return 1
    if (field === "governorate" || field === "gender" || field === "grade" || field === "educationType") return 2
    if (field === "password" || field === "confirmPassword") return 3
    return step
  }

  function updateField(field: keyof RegisterForm) {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validateStep1(): boolean {
    const newErrors: RegisterErrors = {}
    const phoneRegex = /^01[0-9]{9}$/

    if (!form.firstName.trim()) newErrors.firstName = "الاسم الأول مطلوب"
    if (!form.secondName.trim()) newErrors.secondName = "الاسم الثاني مطلوب"
    if (!form.thirdName.trim()) newErrors.thirdName = "الاسم الثالث مطلوب"
    if (!form.lastName.trim()) newErrors.lastName = "الاسم الرابع مطلوب"

    if (!form.studentPhone) {
      newErrors.studentPhone = "رقم هاتف الطالب مطلوب"
    } else if (!phoneRegex.test(form.studentPhone)) {
      newErrors.studentPhone = "رقم الهاتف غير صحيح"
    }

    if (!form.parentPhone) {
      newErrors.parentPhone = "رقم هاتف ولي الأمر مطلوب"
    } else if (!phoneRegex.test(form.parentPhone)) {
      newErrors.parentPhone = "رقم الهاتف غير صحيح"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep2(): boolean {
    const newErrors: RegisterErrors = {}

    if (!form.governorate) newErrors.governorate = "اختر المحافظة"
    if (!form.gender) newErrors.gender = "اختر النوع"
    if (!form.grade) newErrors.grade = "اختر الصف الدراسي"
    if (!form.educationType) newErrors.educationType = "اختر نوع التعليم"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep3(): boolean {
    const newErrors: RegisterErrors = {}

    if (!form.password) {
      newErrors.password = "كلمة المرور مطلوبة"
    } else if (form.password.length < 8) {
      newErrors.password = "كلمة المرور 8 أحرف على الأقل"
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب"
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "كلمة المرور غير متطابقة"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    const isValid = step === 1 ? validateStep1() : step === 2 ? validateStep2() : true
    if (!isValid) return
    setStep((s) => Math.min(s + 1, 3))
  }

  function handleBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (submitting) return
    const studentCode = generateStudentCode()
    if (!validateStep3()) return
    setForm((prev) => ({ ...prev, studentCode }))
    setSubmitting(true)

    const fullName = [form.firstName, form.secondName, form.thirdName, form.lastName]
      .map((part) => part.trim())
      .join(" ")

    try {
      const data = await apiRegister({
        fullName,
        studentPhone: form.studentPhone,
        parentPhone: form.parentPhone,
        governorate: form.governorate,
        gender: form.gender,
        grade: form.grade,
        educationType: form.educationType,
        password: form.password,
      })

      if (data.success) {
        navigate("/login")
      } else {
        if (import.meta.env.DEV) {
          console.error(data)
        }
        setErrorModal(data.message || "حدث خطأ أثناء إنشاء الحساب")
        setStep(fieldToStep(data.field))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-xl p-8"
    >
      <div className="bg-card border border-border rounded-3xl shadow-xl p-8">

        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center">
            <img src={siteConfig.logo} alt={siteConfig.name} className="w-20 h-20 object-contain" />
          </Link>
          <p className="mt-2 text-muted">إنشاء حساب جديد</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      s.id < step
                        ? "bg-primary text-white"
                        : s.id === step
                        ? "bg-primary text-white ring-4 ring-primary/20"
                        : "bg-background border border-border text-muted"
                    }`}
                  >
                    {s.id}
                  </div>
                  <span className={`text-[11px] font-bold whitespace-nowrap ${s.id === step ? "text-primary" : "text-muted"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-2 rounded-full bg-background overflow-hidden">
                    <div
                      className={`h-full bg-primary transition-all duration-500 ${s.id < step ? "w-full" : "w-0"}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">الاسم الرباعي</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="الاسم الأول"
                    value={form.firstName}
                    onChange={updateField("firstName")}
                    error={errors.firstName}
                  />
                  <Input
                    placeholder="الاسم الثاني"
                    value={form.secondName}
                    onChange={updateField("secondName")}
                    error={errors.secondName}
                  />
                  <Input
                    placeholder="الاسم الثالث"
                    value={form.thirdName}
                    onChange={updateField("thirdName")}
                    error={errors.thirdName}
                  />
                  <Input
                    placeholder="الاسم الرابع"
                    value={form.lastName}
                    onChange={updateField("lastName")}
                    error={errors.lastName}
                  />
                </div>
              </div>

              <Input
                label="رقم هاتف الطالب"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={form.studentPhone}
                onChange={updateField("studentPhone")}
                error={errors.studentPhone}
                maxLength={11}
              />

              <Input
                label="رقم هاتف ولي الأمر"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={form.parentPhone}
                onChange={updateField("parentPhone")}
                error={errors.parentPhone}
                maxLength={11}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="المحافظة"
                  placeholder="اختر المحافظة"
                  value={form.governorate}
                  onChange={updateField("governorate")}
                  options={governorates}
                  error={errors.governorate}
                />

                <Select
                  label="النوع"
                  placeholder="اختر النوع"
                  value={form.gender}
                  onChange={updateField("gender")}
                  options={["ذكر", "أنثى"]}
                  error={errors.gender}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="الصف الدراسي"
                  placeholder="اختر الصف الدراسي"
                  value={form.grade}
                  onChange={updateField("grade")}
                  options={grades}
                  error={errors.grade}
                />

                <Select
                  label="نوع التعليم"
                  placeholder="اختر نوع التعليم"
                  value={form.educationType}
                  onChange={updateField("educationType")}
                  options={educationTypes}
                  error={errors.educationType}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <Input
                label="كلمة المرور"
                type="password"
                placeholder="********"
                value={form.password}
                onChange={updateField("password")}
                error={errors.password}
              />

              <Input
                label="تأكيد كلمة المرور"
                type="password"
                placeholder="********"
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
                error={errors.confirmPassword}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Actions */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-text font-bold hover:border-primary hover:text-primary transition"
            >
              <ChevronRight className="w-4 h-4" />
              رجوع
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex-1">
              <Button
                label="إنشاء حساب"
                onClick={handleSubmit}
                loading={submitting}
              />
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-muted text-sm">
            لديك حساب بالفعل؟
            <Link to="/login" className="text-primary font-bold mr-2 hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>

      </div>

      <AnimatePresence>
        {errorModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setErrorModal(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-3xl shadow-xl p-6 max-w-sm w-full text-center space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-secondary text-lg">حدث خطأ</h3>
              <p className="text-muted text-sm">{errorModal}</p>
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition"
              >
                حسناً
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Register
