import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Save, PlayCircle, Upload,
  Calendar, Loader2, X, Link as LinkIcon
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import Toggle from "../../components/ui/Toggle"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetVideos, teacherCreateVideo, teacherUpdateVideo, teacherDeleteVideo } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import type { Course, VideoItem } from "../../types/course"

interface ApiVideo {
  id: number
  title: string
  description: string
  url: string
  provider: string
  duration: number
  thumbnail: string
  isFree: boolean
  isGate: boolean
  showFrom?: string
  hideTo?: string
  courseId: number
  groupId: number
}

type Tab = "add" | "edit" | "delete"
type Provider = "YouTube" | "Vimeo" | "Bunny"

interface VideoForm {
  title: string
  description: string
  duration: string
  provider: Provider
  url: string
  thumbnailUrl: string
  hasThumbnail: boolean
  isFree: boolean
  hasSchedule: boolean
  showFrom: string
  showFromTime: string
  hideTo: string
  hideToTime: string
  isGate: boolean
}

const emptyForm: VideoForm = {
  title: "",
  description: "",
  duration: "",
  provider: "YouTube",
  url: "",
  thumbnailUrl: "",
  hasThumbnail: false,
  isFree: false,
  hasSchedule: false,
  showFrom: "",
  showFromTime: "",
  hideTo: "",
  hideToTime: "",
  isGate: false,
}

function getEmbedUrl(url: string, provider: Provider): string {
  if (!url) return ""
  if (provider === "YouTube") {
    const match = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([^#&?]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : url
  }
  if (provider === "Vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? `https://player.vimeo.com/video/${match[1]}` : url
  }
  return url
}

function ScheduleFields({ form, updateField }: {
  form: VideoForm
  updateField: (f: keyof VideoForm, v: string) => void
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4 p-4 bg-background border border-border rounded-2xl">
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl w-fit">
          <Calendar className="w-4 h-4" />
          تاريخ الظهور
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-muted mb-1">التاريخ</label>
            <input type="date" value={form.showFrom} onChange={(e) => updateField("showFrom", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">الوقت</label>
            <input type="time" value={form.showFromTime} onChange={(e) => updateField("showFromTime", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl w-fit">
          <Calendar className="w-4 h-4" />
          تاريخ الإخفاء (اختياري)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-muted mb-1">التاريخ</label>
            <input type="date" value={form.hideTo} onChange={(e) => updateField("hideTo", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">الوقت</label>
            <input type="time" value={form.hideToTime} onChange={(e) => updateField("hideToTime", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border outline-none text-sm focus:border-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface VideoFormFieldsProps {
  form: VideoForm
  updateField: (field: keyof VideoForm, value: string | boolean) => void
  showPreview: boolean
  setShowPreview: (v: boolean) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function VideoFormFields({ form, updateField, showPreview, setShowPreview, onImageUpload }: VideoFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">عنوان الفيديو *</label>
        <input
          type="text"
          placeholder="مثال: الباب الأول — المحاضرة الأولى"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        />
      </div>

      {/* Description */}
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">وصف الفيديو</label>
        <textarea
          placeholder="نبذة عن محتوى الفيديو..."
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
        />
      </div>

      {/* Duration + Provider */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">المدة (بالدقائق) *</label>
          <input
            type="number"
            min="1"
            placeholder="45"
            value={form.duration}
            onChange={(e) => updateField("duration", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
          />
        </div>
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">مزود الفيديو *</label>
          <select
            value={form.provider}
            onChange={(e) => updateField("provider", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
          >
            <option value="YouTube">YouTube</option>
            <option value="Vimeo">Vimeo</option>
            <option value="Bunny">Bunny</option>
          </select>
        </div>
      </div>

      {/* URL + Preview */}
      <div className="text-right space-y-3">
        <label className="block text-sm font-bold text-text">رابط الفيديو *</label>
        <input
          type="url"
          placeholder="https://..."
          value={form.url}
          onChange={(e) => { updateField("url", e.target.value); setShowPreview(false) }}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary"
          dir="ltr"
        />

        {form.url && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition"
          >
            <PlayCircle className="w-4 h-4" />
            {showPreview ? "إخفاء المعاينة" : "معاينة الفيديو"}
          </button>
        )}

        <AnimatePresence>
          {showPreview && form.url && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl overflow-hidden border border-border bg-black aspect-video"
            >
              {form.provider === "Bunny" ? (
                <iframe src={form.url} className="w-full h-full border-0" allowFullScreen />
              ) : (
                <iframe
                  src={getEmbedUrl(form.url, form.provider)}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnail */}
      <Toggle
        value={form.hasThumbnail}
        onChange={(v) => updateField("hasThumbnail", v)}
        label="إضافة صورة غلاف"
        sublabel="رفع صورة مخصصة لغلاف الفيديو"
        variant="highlighted"
      />

      <AnimatePresence>
        {form.hasThumbnail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary transition cursor-pointer bg-background">
              <Upload className="w-6 h-6 text-muted" />
              <span className="text-sm font-bold text-muted">رفع صورة الغلاف</span>
              <input type="file" accept="image/*" onChange={onImageUpload} className="hidden" />
            </label>

            {form.thumbnailUrl && (
              <div className="relative w-48 aspect-video rounded-xl overflow-hidden border border-border">
                <img src={form.thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => updateField("thumbnailUrl", "")}
                  aria-label="إزالة الصورة"
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free Toggle */}
      <Toggle
        value={form.isFree}
        onChange={(v) => updateField("isFree", v)}
        label="فيديو مجاني 🎁"
        sublabel="أي طالب مسجل يقدر يشوفه بدون اشتراك"
        variant="highlighted"
        activeColor="bg-emerald-500"
      />

      {/* Schedule Toggle */}
      <Toggle
        value={form.hasSchedule}
        onChange={(v) => updateField("hasSchedule", v)}
        label="جدولة الظهور والإخفاء"
        sublabel="لو مش محددتش هيفضل ظاهر علطول"
        variant="highlighted"
      />

      <AnimatePresence>
        {form.hasSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ScheduleFields form={form} updateField={(f, v) => updateField(f, v as string)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gate Toggle */}
      <Toggle
        value={form.isGate}
        onChange={(v) => updateField("isGate", v)}
        label="غلق ما بعده من محتوى"
        sublabel="يمنع الطالب من فتح المحتوى اللي بعده لحد ما يخلّص ده"
        variant="highlighted"
      />

      <AnimatePresence>
        {form.isGate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2.5 p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-xs text-muted leading-relaxed text-right flex-1">
                الطالب لازم يشاهد الفيديو ده الأول عشان يقدر يفتح المحتوى اللي بعده
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface SelectorsProps {
  grade: string; setGrade: (v: string) => void
  courseId: string; setCourseId: (v: string) => void
  groupId: string; setGroupId: (v: string) => void
  videoId?: string; setVideoId?: (v: string) => void
  showVideo?: boolean
  coursesForGrade: Course[]
  groupsForCourse: { id: number; courseId: number; name: string }[]
  videosForGroup: VideoItem[]
  onSelectVideo?: (id: string) => void
}

function Selectors({
  grade, setGrade,
  courseId, setCourseId,
  groupId, setGroupId,
  videoId, setVideoId,
  showVideo = false,
  coursesForGrade, groupsForCourse, videosForGroup,
  onSelectVideo,
}: SelectorsProps) {
  return (
    <div className={`grid gap-4 ${showVideo ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
        <select
          value={grade}
          onChange={(e) => { setGrade(e.target.value); setCourseId(""); setGroupId(""); if (setVideoId) setVideoId("") }}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
        >
          <option value="">اختر الصف</option>
          {grades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">الكورس</label>
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setGroupId(""); if (setVideoId) setVideoId("") }}
          disabled={!grade}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!grade ? "اختر الصف أولاً" : "اختر الكورس"}</option>
          {coursesForGrade.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      <div className="text-right">
        <label className="block text-sm font-bold text-text mb-2">المجموعة</label>
        <select
          value={groupId}
          onChange={(e) => { setGroupId(e.target.value); if (setVideoId) setVideoId("") }}
          disabled={!courseId}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
        >
          <option value="">{!courseId ? "اختر الكورس أولاً" : "اختر المجموعة"}</option>
          {groupsForCourse.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {showVideo && setVideoId && (
        <div className="text-right">
          <label className="block text-sm font-bold text-text mb-2">الفيديو</label>
          <select
            value={videoId}
            onChange={(e) => { setVideoId(e.target.value); onSelectVideo?.(e.target.value) }}
            disabled={!groupId}
            className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
          >
            <option value="">{!groupId ? "اختر المجموعة أولاً" : "اختر الفيديو"}</option>
            {videosForGroup.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
        </div>
      )}
    </div>
  )
}

function VideoList({ videos }: { videos: VideoItem[] }) {
  if (videos.length === 0) return (
    <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
      <p className="text-muted font-bold text-sm">لا يوجد فيديوهات في هذه المجموعة</p>
    </div>
  )

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((v) => (
        <div key={v.id} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="relative aspect-video bg-surface-dark">
            {v.thumbnailUrl ? (
              <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
            ) : (
              <iframe
                src={getEmbedUrl(v.url, v.provider)}
                className="w-full h-full border-0"
                allowFullScreen
              />
            )}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
              {v.duration} د
            </div>
            {v.isFree && (
              <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded font-bold">
                مجاني
              </div>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h4 className="font-bold text-secondary text-sm text-right">{v.title}</h4>
            {v.description && <p className="text-xs text-muted text-right line-clamp-2">{v.description}</p>}
            <div className="flex items-center justify-between pt-1">
              <a href={v.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                <LinkIcon className="w-3 h-3" />
                فتح الرابط
              </a>
              <span className="text-xs text-muted bg-background border border-border px-2 py-0.5 rounded">{v.provider}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VideoManager() {
  const [tab, setTab] = useState<Tab>("add")
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [form, setForm] = useState<VideoForm>(emptyForm)
  const [showPreview, setShowPreview] = useState(false)

  // Add selectors
  const [addGrade, setAddGrade] = useState("")
  const [addCourseId, setAddCourseId] = useState("")
  const [addGroupId, setAddGroupId] = useState("")

  // Edit selectors
  const [editGrade, setEditGrade] = useState("")
  const [editCourseId, setEditCourseId] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editVideoId, setEditVideoId] = useState("")

  // Delete selectors
  const [delGrade, setDelGrade] = useState("")
  const [delCourseId, setDelCourseId] = useState("")
  const [delGroupId, setDelGroupId] = useState("")
  const [delVideoId, setDelVideoId] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()
  const { courses, groups } = useTeacherCoursesGroups(getToken())

  const mapApiVideo = useCallback((v: ApiVideo): VideoItem => {
    return {
      id: String(v.id),
      groupId: v.groupId,
      courseId: v.courseId,
      grade: courses.find((c) => c.id === v.courseId)?.grade || "",
      title: v.title,
      description: v.description,
      duration: String(v.duration),
      provider: v.provider as Provider,
      url: v.url,
      thumbnailUrl: v.thumbnail || undefined,
      showFrom: v.showFrom || undefined,
      hideTo: v.hideTo || undefined,
      isFree: v.isFree,
      isGate: v.isGate,
    }
  }, [courses])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetVideos(token).then((data) => {
      if (Array.isArray(data)) setVideos(data.map(mapApiVideo))
    })
  }, [getToken, mapApiVideo])

  function updateField(field: keyof VideoForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => updateField("thumbnailUrl", reader.result as string)
    reader.readAsDataURL(file)
  }

  // Filtered lists
  const coursesForGrade = (g: string) => courses.filter((c) => c.grade === g)
  const groupsForCourse = (cId: string) => groups.filter((g) => g.courseId === Number(cId))
  const videosForGroup = (gId: string) => videos.filter((v) => v.groupId === Number(gId))

  function validateForm(): boolean {
    if (!form.title || !form.url || !form.duration) {
      addToast("يرجى تعبئة العنوان والرابط والمدة", "error")
      return false
    }
    return true
  }

  async function handleAdd() {
    if (!addGrade) { addToast("اختر الصف الدراسي", "error"); return }
    if (!addCourseId) { addToast("اختر الكورس", "error"); return }
    if (!addGroupId) { addToast("اختر المجموعة", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateVideo({
      title: form.title,
      description: form.description,
      url: form.url,
      provider: form.provider,
      duration: Number(form.duration),
      isFree: form.isFree,
      isGate: form.isGate,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.showFrom : undefined,
      hideTo: form.hasSchedule ? form.hideTo : undefined,
      courseId: Number(addCourseId),
      groupId: Number(addGroupId),
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setVideos((prev) => [...prev, mapApiVideo(data.video)])
      setForm(emptyForm)
      setShowPreview(false)
      addToast(`تم إضافة "${form.title}" بنجاح ✓`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة الفيديو", "error")
    }
  }

  function handleSelectForEdit(videoId: string) {
    setEditVideoId(videoId)
    const video = videos.find((v) => v.id === videoId)
    if (video) {
      setForm({
        title: video.title,
        description: video.description || "",
        duration: video.duration,
        provider: video.provider,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl || "",
        hasThumbnail: !!video.thumbnailUrl,
        isFree: video.isFree,
        hasSchedule: !!video.showFrom,
        showFrom: video.showFrom || "",
        showFromTime: video.showFromTime || "",
        hideTo: video.hideTo || "",
        hideToTime: video.hideToTime || "",
        isGate: video.isGate ?? false,
      })
      setShowPreview(false)
    }
  }

  async function handleEdit() {
    if (!editVideoId) { addToast("اختر الفيديو", "error"); return }
    if (!validateForm()) return

    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateVideo(Number(editVideoId), {
      title: form.title,
      description: form.description,
      url: form.url,
      provider: form.provider,
      duration: Number(form.duration),
      isFree: form.isFree,
      isGate: form.isGate,
      hasSchedule: form.hasSchedule,
      showFrom: form.hasSchedule ? form.showFrom : undefined,
      hideTo: form.hasSchedule ? form.hideTo : undefined,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setVideos((prev) => prev.map((v) => (v.id === editVideoId ? mapApiVideo(data.video) : v)))
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!delVideoId) return
    setIsLoading(true)
    const token = getToken()
    const title = videos.find((v) => v.id === delVideoId)?.title
    const data = await teacherDeleteVideo(Number(delVideoId), token!)
    setIsLoading(false)
    if (data.success) {
      setVideos((prev) => prev.filter((v) => v.id !== delVideoId))
      setDelVideoId("")
      setShowDeleteConfirm(false)
      addToast(`تم حذف "${title}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "add", label: "إضافة فيديو" },
    { id: "edit", label: "تعديل فيديو" },
    { id: "delete", label: "حذف فيديو" },
  ]

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة الفيديوهات</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف فيديوهات الكورسات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setForm(emptyForm)
              setShowPreview(false)
              setEditVideoId("")
              setDelVideoId("")
              setShowDeleteConfirm(false)
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
              tab === t.id
                ? t.id === "delete"
                  ? "bg-red-500 text-white shadow-lg"
                  : "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Add Tab */}
        {tab === "add" && (
          <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إضافة فيديو جديد</h2>
              </div>

              <Selectors
                grade={addGrade} setGrade={setAddGrade}
                courseId={addCourseId} setCourseId={setAddCourseId}
                groupId={addGroupId} setGroupId={setAddGroupId}
                coursesForGrade={coursesForGrade(addGrade)}
                groupsForCourse={groupsForCourse(addCourseId)}
                videosForGroup={videosForGroup(addGroupId)}
              />

              <div className="border-t border-border pt-5">
                <VideoFormFields
                  form={form} updateField={updateField}
                  showPreview={showPreview} setShowPreview={setShowPreview}
                  onImageUpload={handleImageUpload}
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإضافة...</> : <><Plus className="w-5 h-5" />إضافة الفيديو</>}
              </button>
            </div>

            {/* Video List */}
            {addGroupId && (
              <div className="space-y-4">
                <h3 className="font-bold text-secondary text-right">فيديوهات المجموعة</h3>
                <VideoList videos={videosForGroup(addGroupId)} />
              </div>
            )}
          </motion.div>
        )}

        {/* Edit Tab */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">اختر الفيديو للتعديل</h2>
              </div>
              <Selectors
                grade={editGrade} setGrade={setEditGrade}
                courseId={editCourseId} setCourseId={setEditCourseId}
                groupId={editGroupId} setGroupId={setEditGroupId}
                videoId={editVideoId} setVideoId={setEditVideoId}
                showVideo
                coursesForGrade={coursesForGrade(editGrade)}
                groupsForCourse={groupsForCourse(editCourseId)}
                videosForGroup={videosForGroup(editGroupId)}
                onSelectVideo={handleSelectForEdit}
              />
            </div>

            <AnimatePresence>
              {editVideoId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <button onClick={() => { setEditVideoId(""); setForm(emptyForm) }} className="text-sm text-muted hover:text-red-500 transition font-bold">إلغاء</button>
                    <h2 className="font-bold text-secondary text-lg">تعديل الفيديو</h2>
                  </div>

                  <VideoFormFields
                    form={form} updateField={updateField}
                    showPreview={showPreview} setShowPreview={setShowPreview}
                    onImageUpload={handleImageUpload}
                  />

                  <button
                    onClick={handleEdit}
                    disabled={isLoading}
                    className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                  >
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الحفظ...</> : <><Save className="w-5 h-5" />حفظ التعديلات</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Delete Tab */}
        {tab === "delete" && (
          <motion.div key="delete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-red-500 text-lg">حذف فيديو</h2>
              </div>
              <Selectors
                grade={delGrade} setGrade={setDelGrade}
                courseId={delCourseId} setCourseId={setDelCourseId}
                groupId={delGroupId} setGroupId={setDelGroupId}
                videoId={delVideoId} setVideoId={setDelVideoId}
                showVideo
                coursesForGrade={coursesForGrade(delGrade)}
                groupsForCourse={groupsForCourse(delCourseId)}
                videosForGroup={videosForGroup(delGroupId)}
              />
            </div>

            <AnimatePresence>
              {delVideoId && !showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-50/50 border border-red-200/50 rounded-3xl p-6 flex items-center justify-between"
                >
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف الفيديو
                  </button>
                  <div className="text-right">
                    <h4 className="font-bold text-secondary">{videos.find((v) => v.id === delVideoId)?.title}</h4>
                    <p className="text-xs text-muted mt-1">{videos.find((v) => v.id === delVideoId)?.provider} • {videos.find((v) => v.id === delVideoId)?.duration} دقيقة</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        message={
          <>
            هل أنت متأكد من حذف فيديو
            <strong className="text-secondary mx-1">"{videos.find((v) => v.id === delVideoId)?.title}"</strong>؟
            هذا الإجراء لا يمكن التراجع عنه.
          </>
        }
      />

    </div>
  )
}

export default VideoManager