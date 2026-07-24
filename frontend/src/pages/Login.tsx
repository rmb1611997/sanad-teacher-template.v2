import { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { Input, Button } from "../components/ui"
import { useAuth } from "../context/useAuth"
import { siteConfig } from "../config/site"
import { login as apiLogin } from "../services/api"
import { setCsrfToken } from "../services/apiClient"

interface LoginForm {
  phone: string
  password: string
}

interface LoginErrors {
  phone?: string
  password?: string
}

const REMEMBERED_PHONE_KEY = "sanad_remembered_phone"

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState<LoginForm>({
    phone: localStorage.getItem(REMEMBERED_PHONE_KEY) || "",
    password: "",
  })
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBERED_PHONE_KEY))

  const [errors, setErrors] = useState<LoginErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function updateField(field: "phone" | "password") {
    return (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: LoginErrors = {}
    const phoneRegex = /^01[0-9]{9}$/

    if (!form.phone) {
      newErrors.phone = "رقم الهاتف مطلوب"
    } else if (!phoneRegex.test(form.phone)) {
      newErrors.phone = "رقم الهاتف غير صحيح"
    }

    if (!form.password) {
      newErrors.password = "كلمة المرور مطلوبة"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate() || submitting) return
    setSubmitting(true)

    try {
      const data = await apiLogin(form.phone, form.password, rememberMe)
      if (data.success) {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_PHONE_KEY, form.phone)
        } else {
          localStorage.removeItem(REMEMBERED_PHONE_KEY)
        }

        setCsrfToken(data.csrfToken ?? null)

        login({
          id: data.id || 0,
          name: data.name,
          phone: data.phone || form.phone,
          role: data.role as "student" | "teacher",
          token: "cookie-session",
          permissions: data.permissions ?? null,
        })

        navigate("/")
      } else {
        setErrors({ phone: "رقم الهاتف أو كلمة المرور غير صحيحة" })
      }
    } catch {
      setErrors({ phone: "حدث خطأ، حاول مرة أخرى" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md p-8"
    >
      <div className="bg-card border border-border rounded-3xl shadow-xl p-8">

        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center">
            <img src={siteConfig.logo} alt={siteConfig.name} className="w-20 h-20 object-contain" />
          </Link>
          <p className="mt-2 text-muted">تسجيل الدخول إلى حسابك</p>
        </div>

        <div className="space-y-5">

          <Input
            label="رقم الهاتف"
            type="tel"
            placeholder="01XXXXXXXXX"
            value={form.phone}
            onChange={updateField("phone")}
            error={errors.phone}
            maxLength={11}
          />

          <Input
            label="كلمة المرور"
            type="password"
            placeholder="********"
            value={form.password}
            onChange={updateField("password")}
            error={errors.password}
          />

          <label className="flex items-center gap-2 cursor-pointer select-none w-fit mr-auto">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm text-muted">تذكرني</span>
          </label>

          <Button
            label="تسجيل الدخول"
            onClick={handleSubmit}
            loading={submitting}
          />

        </div>

        <div className="text-center mt-6">
          <p className="text-muted text-sm">
            ليس لديك حساب؟
            <Link to="/register" className="text-primary font-bold mr-2 hover:underline">
              إنشاء حساب
            </Link>
          </p>
        </div>

      </div>
    </motion.div>
  )
}

export default Login