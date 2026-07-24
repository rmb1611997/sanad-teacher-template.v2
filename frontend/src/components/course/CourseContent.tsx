import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  PlayCircle, FileText, Award, BookOpen, ExternalLink,
  Download, Clock, Lock
} from "lucide-react"
import type { CourseGroup, CourseLesson, LessonType } from "../../types/course"
import DueCountdown from "../common/DueCountdown"

interface Props {
  groups: CourseGroup[]
  hasAccess: boolean
  isLoggedIn: boolean
}

function getLessonMeta(type: LessonType) {
  switch (type) {
    case "video":
      return {
        label: "محاضرة مرئية",
        badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        icon: "bg-amber-500/10 text-amber-600 border-amber-500/15",
        Icon: PlayCircle,
        description: "شرح فيديو تفاعلي عالي الدقة مبسط ومفصل للمحاضرة.",
      }
    case "file":
      return {
        label: "ملف مساعد",
        badge: "bg-teal-500/10 text-teal-600 border-teal-500/20",
        icon: "bg-teal-500/10 text-teal-600 border-teal-500/15",
        Icon: Download,
        description: "ملفات مساعدة وبنك أسئلة وتدريبات للتمكن من الحل.",
      }
    case "note":
      return {
        label: "مذكرة دراسية",
        badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        icon: "bg-emerald-500/10 text-emerald-600 border-emerald-500/15",
        Icon: FileText,
        description: "ملخص وقوانين الباب والملاحظات الهامة لسهولة الفهم.",
      }
    case "exam":
      return {
        label: "اختبار تفاعلي",
        badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        icon: "bg-purple-500/10 text-purple-600 border-purple-500/15",
        Icon: Award,
        description: "اختبار إلكتروني تفاعلي فوري لتقييم مستواك الدراسي.",
      }
    case "assignment":
      return {
        label: "واجب منزلي",
        badge: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
        icon: "bg-indigo-500/10 text-indigo-600 border-indigo-500/15",
        Icon: BookOpen,
        description: "واجب منزلي لتطبيق المفاهيم المدروسة خطوة بخطوة.",
      }
    case "link":
      return {
        label: "رابط خارجي",
        badge: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
        icon: "bg-cyan-500/10 text-cyan-600 border-cyan-500/15",
        Icon: ExternalLink,
        description: "مصدر تعليمي خارجي داعم للدرس.",
      }
  }
}

function LessonRow({ lesson, hasAccess }: { lesson: CourseLesson; hasAccess: boolean }) {
  const navigate = useNavigate()
  const meta = getLessonMeta(lesson.type)
  const { Icon } = meta
  const canAccess = hasAccess && !lesson.isLocked

  function handleAction() {
    if (!canAccess) return
    if (lesson.type === "video") navigate(`/watch/${lesson.id}`)
    if (lesson.type === "exam") navigate(`/exam/${lesson.id}`)
    if (lesson.type === "assignment") navigate(`/assignment/${lesson.id}`)
    if ((lesson.type === "link" || lesson.type === "note" || lesson.type === "file") && lesson.url) {
      window.open(lesson.url, "_blank")
    }
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } },
      }}
      className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 p-5 rounded-2xl border transition-all duration-300 relative ${
        canAccess
          ? "bg-card border-border hover:border-primary/30 hover:shadow-lg"
          : "bg-background border-border opacity-75"
      }`}
    >
      {/* Timeline Dot */}
      <div className={`absolute right-[-13px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-4 border-background hidden lg:block z-10 ${
        canAccess ? "bg-primary animate-pulse" : "bg-border"
      }`} />

      {/* Left — Icon + Info */}
      <div className="flex items-start sm:items-center gap-4 w-full lg:w-auto">
        <div className={`p-3.5 rounded-2xl border flex items-center justify-center shrink-0 ${meta.icon}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="text-right space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-secondary">{lesson.title}</span>
          </div>

          {lesson.description && (
            <p className="text-xs text-muted leading-relaxed">{lesson.description}</p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 pt-1">
            {lesson.type === "video" && lesson.duration && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted bg-card px-2.5 py-1 rounded-lg border border-border">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {lesson.duration}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right — Action */}
      <div className="w-full lg:w-auto flex flex-col items-end gap-2 shrink-0 border-t lg:border-0 border-border pt-3 lg:pt-0">
        {lesson.type === "assignment" && !lesson.isSubmitted && (
          <DueCountdown dueDate={lesson.dueDate} />
        )}

        {canAccess ? (
          <motion.button
            onClick={handleAction}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-white font-bold text-sm rounded-xl transition-all ${
              lesson.type === "video" ? "bg-amber-500 hover:bg-amber-600" :
              lesson.type === "exam" ? "bg-purple-600 hover:bg-purple-700" :
              lesson.type === "assignment" ? "bg-indigo-600 hover:bg-indigo-700" :
              lesson.type === "link" ? "bg-cyan-600 hover:bg-cyan-700" :
              "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {lesson.type === "video" && "مشاهدة"}
            {lesson.type === "file" && "تحميل"}
            {lesson.type === "note" && "تحميل"}
            {lesson.type === "exam" && "دخول الاختبار"}
            {lesson.type === "assignment" && (lesson.isSubmitted ? "تم التسليم ✓" : "دخول الواجب")}
            {lesson.type === "link" && "عرض الرابط"}
          </motion.button>
        ) : (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-background border border-border text-muted font-bold text-sm rounded-xl">
            <Lock className="w-4 h-4 text-red-400" />
            مغلق
          </div>
        )}
      </div>
    </motion.div>
  )
}

function GroupAccordion({ group, index, hasAccess }: { group: CourseGroup; index: number; hasAccess: boolean }) {
  const [open, setOpen] = useState(false)

  const typeCounts = group.lessons.reduce<Partial<Record<LessonType, number>>>((acc, l) => {
    acc[l.type] = (acc[l.type] ?? 0) + 1
    return acc
  }, {})

  return (
    <motion.div
      className={`rounded-3xl overflow-hidden border transition-all duration-500 ${
        open
          ? "border-primary/30 shadow-xl shadow-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/20 hover:scale-[1.005]"
      } bg-card`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-6 py-5 flex items-center justify-between text-right transition-all duration-300 relative ${
          open ? "bg-primary/5" : "hover:bg-primary/3"
        }`}
      >
        {/* Right Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-primary/50 rounded-l-md" />

        <div className="flex items-center gap-4 pr-3">
          {/* Number Badge */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm border transition-all ${
            open
              ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20"
              : "bg-primary/10 text-primary border-primary/20"
          }`}>
            {String(index + 1).padStart(2, "0")}
          </div>

          <div className="space-y-1.5 text-right">
            <h3 className="font-bold text-secondary text-base">{group.title}</h3>
            {group.description && (
              <p className="text-xs text-muted leading-relaxed">{group.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {(Object.entries(typeCounts) as [LessonType, number][]).map(([type, count]) => {
                const meta = getLessonMeta(type)
                const { Icon } = meta
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {count} {meta.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`p-2.5 rounded-xl border transition-all ${
            open
              ? "bg-primary text-white border-transparent shadow-md"
              : "bg-background border-border text-muted"
          }`}
        >
          <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </button>

      {/* Lessons */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }, opacity: { duration: 0.2 } } }}
            exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.3 }, opacity: { duration: 0.15 } } }}
            className="overflow-hidden border-t border-border"
          >
            <motion.div
              className="p-6 space-y-4 relative"
              variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
              initial="hidden"
              animate="visible"
            >
              {/* Timeline Line */}
              <div className="absolute right-12 top-8 bottom-8 w-0.5 border-r-2 border-dashed border-border pointer-events-none hidden lg:block" />

              {group.lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} hasAccess={hasAccess} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CourseContent({ groups, hasAccess, isLoggedIn }: Props) {
  const totalLessons = groups.reduce((acc, g) => acc + g.lessons.length, 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted bg-card border border-border px-3 py-1.5 rounded-full">
          {groups.length} وحدات • {totalLessons} عنصر
        </span>
        <h2 className="text-2xl font-bold text-secondary">محتوى الكورس</h2>
      </div>

      {/* Guest Notice */}
      {!hasAccess && (
        <motion.div
          className="bg-primary/5 border border-primary/20 rounded-3xl p-6 text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-secondary text-lg">المحتوى مغلق 🔒</h3>
          <p className="text-sm text-muted leading-7">
            {isLoggedIn
              ? "أنت مسجل الدخول ولكنك غير مشترك في هذا الكورس. اشترك الآن للوصول لكل المحتوى."
              : "سجل الدخول واشترك في الكورس للوصول لكل المحاضرات والملفات والاختبارات."}
          </p>
        </motion.div>
      )}

{/* Groups */}
      <div className="space-y-5">
        {groups.map((group, index) => (
          <GroupAccordion
            key={group.id}
            group={group}
            index={index}
            hasAccess={hasAccess}
          />
        ))}
      </div>

    </div>
  )
}

export default CourseContent