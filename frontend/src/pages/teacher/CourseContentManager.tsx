import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  GripVertical, ChevronDown, ChevronUp,
  PlayCircle, FileText, Award, BookOpen, Link as LinkIcon, Download
} from "lucide-react"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetGroups, teacherGetVideos, teacherGetExams, teacherGetAssignments, teacherReorderGroups, teacherReorderContent } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import type { LessonType } from "../../types/course"

interface Lesson {
  id: string
  title: string
  type: LessonType
}

interface ApiVideo { id: number; title: string; groupId: number }
interface ApiExam { id: number; title: string; groupId: number }
interface ApiAssignment { id: number; title: string; groupId: number }

interface Group {
  id: string
  courseId: number
  title: string
  lessons: Lesson[]
}

function getLessonIcon(type: LessonType) {
  switch (type) {
    case "video": return <PlayCircle className="w-4 h-4 text-amber-500" />
    case "file": return <Download className="w-4 h-4 text-teal-500" />
    case "note": return <FileText className="w-4 h-4 text-emerald-500" />
    case "exam": return <Award className="w-4 h-4 text-purple-500" />
    case "assignment": return <BookOpen className="w-4 h-4 text-indigo-500" />
    case "link": return <LinkIcon className="w-4 h-4 text-cyan-500" />
    default: return <FileText className="w-4 h-4 text-muted" />
  }
}

function getLessonLabel(type: LessonType) {
  switch (type) {
    case "video": return "فيديو"
    case "file": return "ملف"
    case "note": return "مذكرة"
    case "exam": return "اختبار"
    case "assignment": return "واجب"
    case "link": return "رابط"
    default: return ""
  }
}

// Sortable Lesson Item
function SortableLesson({ lesson }: { lesson: Lesson }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 p-3 bg-background border border-border rounded-xl transition-all ${
        isDragging ? "opacity-50 shadow-xl scale-105" : "hover:border-primary/30"
      }`}
    >
      <button {...attributes} {...listeners} className="text-muted hover:text-primary cursor-grab active:cursor-grabbing flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-shrink-0">{getLessonIcon(lesson.type)}</div>
      <span className="flex-1 text-sm font-bold text-secondary text-right">{lesson.title}</span>
      <span className="text-xs text-muted bg-card border border-border px-2 py-0.5 rounded-lg">
        {getLessonLabel(lesson.type)}
      </span>
    </div>
  )
}

// Sortable Group
function SortableGroup({ group, onLessonsReorder }: {
  group: Group
  onLessonsReorder: (groupId: string, lessons: Lesson[]) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id })

  const sensors = useSensors(useSensor(PointerSensor))

  function handleLessonDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = group.lessons.findIndex((l) => l.id === active.id)
    const newIndex = group.lessons.findIndex((l) => l.id === over.id)
    onLessonsReorder(group.id, arrayMove(group.lessons, oldIndex, newIndex))
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-card border rounded-2xl overflow-hidden transition-all ${
        isDragging ? "opacity-50 shadow-2xl scale-[1.02] border-primary/40" : "border-border"
      }`}
    >
      {/* Group Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted hover:text-primary transition"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex-1 text-right">
          <h3 className="font-bold text-secondary">{group.title}</h3>
          <p className="text-xs text-muted mt-0.5">{group.lessons.length} عنصر</p>
        </div>

        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
          {group.lessons.length}
        </div>

        <button {...attributes} {...listeners} className="text-muted hover:text-primary cursor-grab active:cursor-grabbing flex-shrink-0 p-1">
          <GripVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Lessons */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 space-y-2">
              {group.lessons.length === 0 ? (
                <p className="text-center text-muted text-sm py-4">لا يوجد محتوى في هذه المجموعة</p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
                  <SortableContext items={group.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    {group.lessons.map((lesson) => (
                      <SortableLesson key={lesson.id} lesson={lesson} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CourseContentManager() {
  const { getToken } = useAuth()
  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const { courses } = useTeacherCoursesGroups(getToken())
  const [groups, setGroups] = useState<Group[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    Promise.all([
      teacherGetGroups(token),
      teacherGetVideos(token),
      teacherGetExams(token),
      teacherGetAssignments(token),
    ]).then(([groupsData, videosData, examsData, assignmentsData]) => {
      if (!Array.isArray(groupsData)) return
      const videos: ApiVideo[] = Array.isArray(videosData) ? videosData : []
      const exams: ApiExam[] = Array.isArray(examsData) ? examsData : []
      const assignments: ApiAssignment[] = Array.isArray(assignmentsData) ? assignmentsData : []

      setGroups(groupsData.map((g: { id: number; courseId: number; title: string }) => ({
        id: String(g.id),
        courseId: g.courseId,
        title: g.title,
        lessons: [
          ...videos
            .filter((v) => v.groupId === g.id)
            .map((v) => ({ id: String(v.id), title: v.title, type: "video" as LessonType })),
          ...exams
            .filter((e) => e.groupId === g.id)
            .map((e) => ({ id: String(e.id), title: e.title, type: "exam" as LessonType })),
          ...assignments
            .filter((a) => a.groupId === g.id)
            .map((a) => ({ id: String(a.id), title: a.title, type: "assignment" as LessonType })),
        ],
      })))
    })
  }, [getToken])

  const coursesForGrade = courses.filter((c) => c.grade === selectedGrade)
  const courseGroups = groups.filter((g) => g.courseId === Number(selectedCourseId))

  const sensors = useSensors(useSensor(PointerSensor))

  function handleGroupDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = courseGroups.findIndex((g) => g.id === active.id)
    const newIndex = courseGroups.findIndex((g) => g.id === over.id)
    const reordered = arrayMove(courseGroups, oldIndex, newIndex)
    setGroups((prev) => [
      ...prev.filter((g) => g.courseId !== Number(selectedCourseId)),
      ...reordered,
    ])
    setSaved(false)
  }

  function handleLessonsReorder(groupId: string, lessons: Lesson[]) {
    setGroups((prev) =>
      prev.map((g) => g.id === groupId ? { ...g, lessons } : g)
    )
    setSaved(false)
  }

  async function handleSave() {
    const token = getToken()
    if (!token) return

    await teacherReorderGroups(courseGroups.map((g) => Number(g.id)), token)
    await Promise.all(
      courseGroups
        .filter((g) => g.lessons.length > 0)
        .map((g) =>
          teacherReorderContent(
            g.lessons.map((l) => ({ id: Number(l.id), type: l.type as "video" | "exam" | "assignment" })),
            token
          )
        )
    )

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة محتوى الكورسات</h1>
        <p className="text-muted text-sm mt-1">إعادة ترتيب المجموعات والمحتوى بالسحب والإفلات</p>
      </div>

      {/* Selectors */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
            <select
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setSelectedCourseId("") }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">اختر الصف</option>
              {grades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الكورس</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={!selectedGrade || coursesForGrade.length === 0}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
            >
              <option value="">{!selectedGrade ? "اختر الصف أولاً" : "اختر الكورس"}</option>
              {coursesForGrade.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {selectedCourseId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-emerald-600 font-bold flex items-center gap-1"
                  >
                    ✓ تم الحفظ
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                onClick={handleSave}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition"
              >
                حفظ الترتيب
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">
                {courseGroups.length} مجموعة •{" "}
                {courseGroups.reduce((acc, g) => acc + g.lessons.length, 0)} عنصر
              </p>
              <p className="text-xs text-muted mt-0.5">اسحب للترتيب</p>
            </div>
          </div>

          {courseGroups.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
              <p className="text-muted font-bold">لا يوجد محتوى لهذا الكورس</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
              <SortableContext items={courseGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {courseGroups.map((group) => (
                    <SortableGroup
                      key={group.id}
                      group={group}
                      onLessonsReorder={handleLessonsReorder}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </motion.div>
      )}

    </div>
  )
}

export default CourseContentManager