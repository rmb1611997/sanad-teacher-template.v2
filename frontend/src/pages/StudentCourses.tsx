import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { BookOpen, ChevronLeft } from "lucide-react"
import { useAuth } from "../context/useAuth"
import { getMyCourses } from "../services/api"

interface EnrolledCourse {
  id: number
  title: string
  grade: string
  image?: string
  shortDescription?: string
}

function StudentCourses() {
  const { getToken } = useAuth()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(() => !!getToken())

  useEffect(() => {
    const token = getToken()
    if (!token) return

    getMyCourses(token)
      .then((data) => {
        setCourses(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setCourses([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [getToken])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="relative overflow-hidden bg-surface-dark py-12">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-right">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white">كورساتي</h1>
            <p className="text-white/60 text-sm mt-1">
              {courses.length > 0
                ? `أنت مشترك في ${courses.length} كورس`
                : "لا توجد كورسات مشترك بها"}
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" className="w-full fill-background">
            <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {courses.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
            <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="font-bold text-secondary text-lg mb-2">لا توجد كورسات</h3>
            <p className="text-muted text-sm mb-6">فعّل كود اشتراك لتبدأ رحلتك التعليمية</p>
            <Link
              to="/courses"
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
            >
              تصفح الكورسات
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                {/* Course Image */}
                <div className="h-44 bg-liner-to-br from-primary/15 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  {course.image && course.image !== "False" ? (
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-primary/30" />
                  )}
                  <div className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm text-text text-xs font-bold px-2.5 py-1 rounded-full border border-border">
                    {course.grade}
                  </div>
                  {/* Subscribed Badge */}
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    ✓ مشترك
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 text-right space-y-3">
                  <h3 className="font-bold text-secondary group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>

                  {course.shortDescription && (
                    <p className="text-muted text-sm leading-6 line-clamp-2">
                      {course.shortDescription}
                    </p>
                  )}

                  <Link
                    to={`/courses/${course.id}`}
                    className="flex items-center justify-between w-full bg-primary text-white px-4 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition group/btn"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition" />
                    دخول الكورس
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default StudentCourses
