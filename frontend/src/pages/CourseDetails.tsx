import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link, useParams } from "react-router-dom"
import { Loader2, GraduationCap, CalendarPlus, RefreshCw } from "lucide-react"
import { useAuth } from "../context/useAuth"
import ActivateCodeModal from "../components/course/ActivateCodeModal"
import type { CourseGroup, CourseContentApiResponse } from "../types/course"
import CourseContent from "../components/course/CourseContent"
import { getCourseContent } from "../services/api"

function CourseDetails() {
  const { id } = useParams()
  const { isLoggedIn, getToken } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [courseData, setCourseData] = useState<CourseContentApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    getCourseContent(Number(id), token || undefined).then((data) => {
      setCourseData(data && data.course ? data : null)
      setLoading(false)
    })
  }, [id, getToken])

  const course = courseData?.course ?? null
  const groups: CourseGroup[] = (courseData?.groups ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description || undefined,
    lessons: g.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      type: l.type,
      description: l.description || undefined,
      duration: l.duration !== undefined ? String(l.duration) : undefined,
      isLocked: l.isLocked,
      url: l.url || undefined,
      dueDate: l.dueDate || undefined,
      isSubmitted: l.isSubmitted,
    })),
  }))
  const isSubscribed = !!courseData?.isEnrolled
  const hasAccess = !!course && (course.isFree || isSubscribed)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-secondary mb-4">الكورس غير موجود</h2>
          <Link to="/courses" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
            العودة للكورسات
          </Link>
        </div>
      </div>
    )
  }

  const hasDiscount = !!course.discountPrice
  const discountPercent = hasDiscount
    ? Math.round(((course.price - course.discountPrice!) / course.price) * 100)
    : 0

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <div className="relative overflow-hidden bg-surface-dark py-20">

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

        <div className="relative z-10 max-w-7xl mx-auto px-6">

          {/* Breadcrumb */}
          <motion.div
            className="flex items-center gap-2 text-white/50 text-sm mb-8 justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>{course.title}</span>
            <span>/</span>
            <Link to="/courses" className="hover:text-white transition">الكورسات</Link>
            <span>/</span>
            <Link to="/" className="hover:text-white transition">الرئيسية</Link>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <motion.div
              className="text-right"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6">
                <GraduationCap className="w-4 h-4" />
                {course.grade}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                {course.title}
              </h1>

              <p className="mt-6 text-white/60 text-lg leading-8">
                {course.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 justify-end">
                <span className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 px-3.5 py-2 rounded-xl text-xs font-bold">
                  <RefreshCw className="w-3.5 h-3.5" />
                  آخر تحديث
                  <span className="text-white/70">{new Date(course.updatedAt).toLocaleDateString("ar-EG")}</span>
                </span>
                <span className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 px-3.5 py-2 rounded-xl text-xs font-bold">
                  <CalendarPlus className="w-3.5 h-3.5" />
                  تاريخ النشر
                  <span className="text-white/70">{new Date(course.createdAt).toLocaleDateString("ar-EG")}</span>
                </span>
              </div>
            </motion.div>

            {/* Price Card */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md text-right">

                <motion.div
                  className="absolute inset-0 rounded-3xl bg-liner-to-br from-white/10 via-transparent to-transparent"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                <div className="relative z-10">

                  <div className="h-48 bg-liner-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                    {course.image ? (
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <motion.span
                        className="text-6xl"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        📚
                      </motion.span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-end mb-6">
                    {course.isFree ? (
                      <span className="text-emerald-500 font-bold text-2xl">مجاني 🎁</span>
                    ) : hasDiscount ? (
                      <>
                        <span className="text-white/40 line-through text-lg">{course.price} ج.م</span>
                        <span className="text-4xl font-bold text-primary">{course.discountPrice} ج.م</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold text-primary">{course.price} ج.م</span>
                    )}
                  </div>

                  {!course.isFree && hasDiscount && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-2 rounded-xl text-center mb-6">
                      وفّر {course.price - course.discountPrice!} ج.م — خصم {discountPercent}%
                    </div>
                  )}

                  {isLoggedIn ? (
                    <div className="space-y-3">
                      {hasAccess ? (
                        <a
                          href="#course-content"
                          className="block w-full bg-primary text-white py-4 rounded-xl font-bold text-center hover:opacity-90 transition"
                        >
                          الانتقال إلى محتوى الكورس
                        </a>
                      ) : (
                        <motion.button
                          onClick={() => setShowModal(true)}
                          className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 transition"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          اشترك الآن
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        className="block w-full bg-primary text-white py-4 rounded-xl font-bold text-center hover:opacity-90 transition"
                      >
                        {course.isFree ? "سجل للدخول" : "سجل للاشتراك"}
                      </Link>
                      <Link
                        to="/register"
                        className="block w-full border-2 border-white/20 text-white py-4 rounded-xl font-bold text-center hover:bg-white/10 transition"
                      >
                        إنشاء حساب جديد
                      </Link>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full fill-background">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>

      </div>

      {/* Course Content */}
      <div id="course-content" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-6">
        <CourseContent
          groups={groups}
          hasAccess={hasAccess}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <ActivateCodeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        courseTitle={course.title}
        courseId={course.id}
      />

    </div>
  )
}

export default CourseDetails