import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Phone, MapPin, GraduationCap, Calendar, BookOpen, Loader2 } from "lucide-react"
import { useAuth } from "../context/useAuth"
import { getProfile } from "../services/api"
import { siteConfig } from "../config/site"

function InfoCard({ icon: Icon, label, value, highlight = false }: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <motion.div
      className={`flex items-center justify-between p-4 rounded-2xl border ${
        highlight
          ? "bg-primary/5 border-primary/20"
          : "bg-background border-border"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={`p-2 rounded-xl shrink-0 ${highlight ? "bg-primary/10" : "bg-card border border-border"}`}>
        <Icon className={`w-4 h-4 ${highlight ? "text-primary" : "text-muted"}`} />
      </div>
      <div className="text-right flex-1 mr-3">
        <p className="text-xs text-muted">{label}</p>
        <p className={`font-bold mt-0.5 ${highlight ? "text-primary text-lg" : "text-secondary text-sm"}`}>
          {value}
        </p>
      </div>
    </motion.div>
  )
}

interface Profile {
  fullName: string
  studentPhone: string
  parentPhone: string
  governorate: string
  gender: string
  grade: string
  educationType: string
  studentCode: string
  createdAt: string
}

function StudentProfile() {
  const { getToken } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(() => !!getToken())

  useEffect(() => {
    const token = getToken()
    if (!token) return

    getProfile(token).then((data) => {
      setProfile(data)
      setLoading(false)
    })
  }, [getToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="relative overflow-hidden bg-surface-dark py-16">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-primary/10 blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">

          {/* Avatar */}
          <motion.div
            className="w-24 h-24 rounded-full bg-primary/20 border-4 border-primary/40 flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-4xl font-bold text-primary">
              {profile?.fullName?.charAt(0)}
            </span>
          </motion.div>

          <motion.h1
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {profile?.fullName}
          </motion.h1>

          <motion.p
            className="text-white/60 text-sm mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {profile?.grade} — {siteConfig.name}
          </motion.p>

        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" className="w-full fill-background">
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Student Code */}
        <motion.div
          className="bg-card border border-border rounded-3xl p-6 text-center space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-muted">الكود التعريفي الخاص بك</p>
          <div className="flex items-center justify-center gap-3">
            <motion.div
              className="bg-primary/10 border-2 border-primary/30 rounded-2xl px-8 py-4"
              animate={{ boxShadow: ["0 0 0 0 rgba(37,99,235,0.3)", "0 0 0 15px rgba(37,99,235,0)", "0 0 0 0 rgba(37,99,235,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-4xl font-bold text-primary tracking-[0.3em] font-mono">
                {profile?.studentCode}
              </span>
            </motion.div>
          </div>
          <p className="text-xs text-muted">احتفظ بهذا الكود — هو هويتك في المنصة</p>
        </motion.div>

        {/* Personal Info */}
        <motion.div
          className="bg-card border border-border rounded-3xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-secondary text-right border-b border-border pb-3">
            البيانات الشخصية
          </h2>

          <div className="space-y-3">
            <InfoCard icon={User} label="الاسم الرباعي" value={profile?.fullName ?? ""} />
            <InfoCard icon={Phone} label="رقم هاتف الطالب" value={profile?.studentPhone ?? ""} />
            <InfoCard icon={Phone} label="رقم هاتف ولي الأمر" value={profile?.parentPhone ?? ""} />
            <InfoCard icon={User} label="النوع" value={profile?.gender ?? ""} />
            <InfoCard icon={MapPin} label="المحافظة" value={profile?.governorate ?? ""} />
          </div>
        </motion.div>

        {/* Academic Info */}
        <motion.div
          className="bg-card border border-border rounded-3xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-bold text-secondary text-right border-b border-border pb-3">
            البيانات الدراسية
          </h2>

          <div className="space-y-3">
            <InfoCard icon={GraduationCap} label="الصف الدراسي" value={profile?.grade ?? ""} />
            <InfoCard icon={BookOpen} label="نوع التعليم" value={profile?.educationType ?? ""} />
            <InfoCard
              icon={Calendar}
              label="تاريخ التسجيل"
              value={profile?.createdAt
                ? new Date(profile?.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
                : "—"}
            />
          </div>
        </motion.div>

        {/* Note */}
        <motion.div
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-amber-700 leading-6">
  لتعديل بياناتك، يرجى التواصل مع الدعم الفني.
</p>
</motion.div>


      </div>
    </div>
  )
}

export default StudentProfile
