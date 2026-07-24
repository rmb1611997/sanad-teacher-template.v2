import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Loader2, GraduationCap } from "lucide-react"
import { getCourses, getMyCourses, getCategories } from "../../services/api"
import { useAuth } from "../../context/useAuth"
import { CourseCard, type ApiCourse } from "../../pages/Courses"

function CoursesSection() {
  const { getToken, isLoggedIn } = useAuth()
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [myCourseIds, setMyCourseIds] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل")
  const [categories, setCategories] = useState<string[]>(["الكل"])

  useEffect(() => {
    getCourses().then((data) => {
      setCourses(Array.isArray(data) ? data : [])
      setLoading(false)
    })

    getCategories().then((data) => {
      if (Array.isArray(data)) setCategories(["الكل", ...data])
    })
  }, [])

  const filteredCourses = selectedCategory === "الكل"
    ? courses.slice(0, 6)
    : courses.filter((c) => c.category === selectedCategory).slice(0, 6)

  useEffect(() => {
    const token = getToken()
    if (token) {
      getMyCourses(token).then((data) => {
        if (Array.isArray(data)) setMyCourseIds(data.map((c: { id: number }) => c.id))
      })
    }
  }, [isLoggedIn, getToken])

  return (
    <section className="py-14 md:py-20 bg-background">

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <motion.div
          className="text-center mb-10 md:mb-12"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <GraduationCap className="w-4 h-4" />
            محتوى تعليمي مميز
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-secondary tracking-tight">
            الكورسات
            <span className="text-primary mx-2">المتاحة</span>
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted">
            اختر الكورس المناسب وابدأ التعلم
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-5xl mb-4">📚</p>
            <h3 className="text-xl font-bold text-secondary mb-2">لا توجد كورسات متاحة حالياً</h3>
            <p className="text-muted">سيتم إضافة الكورسات قريباً، تابعنا للحصول على آخر التحديثات.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedCategory === cat ? "bg-primary text-white shadow-lg" : "bg-card border border-border text-text hover:border-primary hover:text-primary"}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} isSubscribed={myCourseIds.includes(course.id)} />
              ))}
            </div>
          </>
        )}

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            to="/courses"
            className="inline-block bg-primary text-white px-10 py-4 rounded-xl font-bold hover:opacity-90 transition hover:scale-105"
          >
عرض جميع الكورسات ←
          </Link>
        </motion.div>

      </div>

    </section>
  )
}

export default CoursesSection