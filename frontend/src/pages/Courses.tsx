import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Loader2, BookOpen, Tag, GraduationCap, CalendarPlus, RefreshCw } from "lucide-react"
import { useAuth } from "../context/useAuth"
import ActivateCodeModal from "../components/course/ActivateCodeModal"
import { getCourses, getMyCourses } from "../services/api"

export interface ApiCourse {
  id: number
  title: string
  grade: string
  category?: string
  price: number
  discountPrice?: number
  isFree?: boolean
  image: string
  shortDescription: string
  createdAt?: string
  updatedAt?: string
}

function formatCourseDate(dateStr?: string) {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" })
}

export function CourseCard({ course, index, isSubscribed = false }: { course: ApiCourse; index: number; isSubscribed?: boolean }) {
  const { isLoggedIn } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const hasDiscount = !!course.discountPrice
  const discountPercent = hasDiscount
    ? Math.round(((course.price - course.discountPrice!) / course.price) * 100)
    : 0

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >

      {/* Glow ring on hover */}
      <div className="absolute -inset-0.5 rounded-4xl bg-linear-to-br from-primary to-primary/40 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />

      <motion.div
        className="relative bg-card border border-border rounded-4xl overflow-hidden flex flex-col h-full"
        whileHover={{ y: -8, transition: { duration: 0.25, ease: "easeOut" } }}
      >

        {/* Image Area — YouTube thumbnail ratio (16:9) */}
        <div className="relative aspect-video bg-linear-to-br from-primary/15 via-primary/5 to-transparent flex items-center justify-center overflow-hidden">

          {/* Animated background glow */}
          <motion.div
            className="absolute w-32 h-32 rounded-full bg-primary/10 blur-2xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
          />

          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <motion.div
              className="relative z-10 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
            >
              <BookOpen className="w-7 h-7 text-primary" />
            </motion.div>
          )}

          {/* Bottom gradient for badge legibility */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Discount Badge */}
          {hasDiscount && (
            <motion.div
              className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.15, type: "spring" }}
            >
              <Tag className="w-3 h-3" />
              خصم {discountPercent}%
            </motion.div>
          )}

          {/* Grade Badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
            <GraduationCap className="w-3.5 h-3.5" />
            {course.grade}
          </div>

        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">

          <h3 className="text-xl font-extrabold text-secondary text-center leading-tight group-hover:text-primary transition-colors duration-300">
            {course.title}
          </h3>

          <p className="mt-3 text-sm text-muted leading-7 text-center flex-1">
            {course.shortDescription}
          </p>

          {/* Price + Dates */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">

            {/* Dates */}
            <div className="flex flex-col gap-1.5">
              {formatCourseDate(course.createdAt) && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted">
                  <CalendarPlus className="w-3 h-3 text-primary/70" />
                  {formatCourseDate(course.createdAt)}
                </span>
              )}
              {formatCourseDate(course.updatedAt) && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted">
                  <RefreshCw className="w-3 h-3 text-primary/70" />
                  {formatCourseDate(course.updatedAt)}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 text-right">
              {course.isFree ? (
                <span className="text-emerald-500 font-bold text-lg">مجاني 🎁</span>
              ) : hasDiscount ? (
                <>
                  <span className="text-muted line-through text-sm mb-1">{course.price} ج.م</span>
                  <motion.span
                    className="text-3xl font-extrabold text-primary leading-none"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  >
                    {course.discountPrice}
                    <span className="text-sm font-bold text-muted mr-1">ج.م</span>
                  </motion.span>
                </>
              ) : (
                <span className="text-3xl font-extrabold text-primary leading-none">
                  {course.price}
                  <span className="text-sm font-bold text-muted mr-1">ج.م</span>
                </span>
              )}
            </div>
          </div>

        {/* Buttons */}
        <div className="mt-5 flex flex-col gap-3">
          {course.isFree ? (
            isLoggedIn ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={`/courses/${course.id}`}
                  className="block w-full bg-primary text-white py-3 rounded-xl font-bold text-center hover:opacity-90 transition text-sm"
                >
                  دخول الكورس
                </Link>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  className="block w-full bg-primary text-white py-3 rounded-xl font-bold text-center hover:opacity-90 transition text-sm"
                >
                  سجل للدخول
                </Link>
              </motion.div>
            )
          ) : isLoggedIn ? (
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={`/courses/${course.id}`}
                  className="block w-full bg-primary text-white py-3 rounded-xl font-bold text-center hover:opacity-90 transition text-sm"
                >
                  دخول الكورس
                </Link>
              </motion.div>
              {isSubscribed ? (
                <p className="w-full text-center text-emerald-600 font-bold text-sm py-3">
                  أنت مشترك بهذا الكورس ✓
                </p>
              ) : (
                <motion.button
                  onClick={() => setShowModal(true)}
                  className="w-full border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  اشترك الآن
                </motion.button>
              )}
            </>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={`/courses/${course.id}`}
                  className="block w-full border-2 border-border text-text py-3 rounded-xl font-bold text-center hover:border-primary hover:text-primary transition text-sm"
                >
                  تفاصيل الكورس
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/login"
                  className="block w-full bg-primary text-white py-3 rounded-xl font-bold text-center hover:opacity-90 transition text-sm"
                >
                  سجل للاشتراك
                </Link>
              </motion.div>
            </>
          )}
        </div>

        </div>

      </motion.div>

      <ActivateCodeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        courseTitle={course.title}
        courseId={course.id}
      />

    </motion.div>
  )
}

function Courses() {
  const { getToken, isLoggedIn } = useAuth()
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [myCourseIds, setMyCourseIds] = useState<number[]>([])

  useEffect(() => {
    getCourses().then((data) => {
      setCourses(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const token = getToken()
    if (token) {
      getMyCourses(token).then((data) => {
        if (Array.isArray(data)) setMyCourseIds(data.map((c: { id: number }) => c.id))
      })
    }
  }, [isLoggedIn, getToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-surface-dark py-20">

        {/* Background Blobs */}
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-primary/10 blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-right">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block bg-primary/20 border border-primary/30 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
              📚 كل الكورسات المتاحة
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white">
              الكورسات المتاحة
            </h1>

            <p className="mt-4 text-white/60 text-lg">
              اختر الكورس المناسب لك وابدأ رحلتك التعليمية
            </p>
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full fill-background">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>

      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📚</p>
            <h3 className="text-xl font-bold text-secondary mb-2">لا توجد كورسات متاحة حالياً</h3>
            <p className="text-muted">سيتم إضافة الكورسات قريباً، تابعنا للحصول على آخر التحديثات.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} isSubscribed={myCourseIds.includes(course.id)} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default Courses