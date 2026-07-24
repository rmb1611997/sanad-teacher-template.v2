import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useParams, Link } from "react-router-dom"
import {
  ArrowRight, PlayCircle, FileText, Download,
  ChevronDown, ChevronUp, Lock, CheckCircle2, Loader2, Maximize
} from "lucide-react"
import { siteConfig } from "../config/site"
import { useStudyRecords } from "../context/useStudyRecords"
import { useAuth } from "../context/useAuth"
import { getVideo, updateVideoProgress } from "../services/api"

type Provider = "YouTube" | "Vimeo" | "Bunny"
type LessonType = "video" | "file" | "note" | "exam" | "assignment" | "link"

interface Lesson {
  id: string
  title: string
  type: LessonType
  duration?: string
  isLocked: boolean
  isCompleted?: boolean
}

interface Group {
  id: string
  title: string
  lessons: Lesson[]
}

interface VideoData {
  id: string
  title: string
  description: string
  provider: Provider
  url: string
  duration: string
  courseTitle: string
  isLocked: boolean
  groups: Group[]
}

interface ApiVideoLesson {
  id: number
  title: string
  type: LessonType
  duration?: string | number
  isLocked: boolean
  isCompleted?: boolean
}

interface ApiVideoGroup {
  id: number
  title: string
  lessons: ApiVideoLesson[]
}

interface ApiVideoResponse {
  id: number
  title: string
  description: string
  provider: Provider
  url: string | null
  duration: string | number
  courseTitle: string
  isLocked: boolean
  groups: ApiVideoGroup[]
}

function getEmbedUrl(url: string, provider: Provider): string {
  if (!url) return ""
  if (provider === "YouTube") {
    const match = url.match(/(?:youtu\.be\/|watch\?v=|embed\/)([^#&?]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : url
  }
  if (provider === "Vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/)
    return match ? `https://player.vimeo.com/video/${match[1]}` : url
  }
  return url
}

function getLessonIcon(type: LessonType, isLocked: boolean) {
  if (isLocked) return <Lock className="w-4 h-4 text-muted" />
  switch (type) {
    case "video": return <PlayCircle className="w-4 h-4 text-amber-500" />
    case "file": return <Download className="w-4 h-4 text-teal-500" />
    case "note": return <FileText className="w-4 h-4 text-emerald-500" />
    default: return <PlayCircle className="w-4 h-4 text-primary" />
  }
}

function GroupAccordion({ group }: { group: Group }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-primary/5 transition text-right"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          <span className="text-xs text-muted">{group.lessons.length} درس</span>
        </div>
        <span className="font-bold text-secondary text-sm">{group.title}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="divide-y divide-border">
              {group.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`flex items-center gap-3 px-4 py-3 text-right transition ${
                    lesson.isLocked
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-primary/5 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {lesson.isCompleted && !lesson.isLocked && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {lesson.duration && (
                      <span className="text-xs text-muted">{lesson.duration}</span>
                    )}
                  </div>
                  <span className={`flex-1 text-sm ${
                    lesson.isLocked ? "text-muted" : "text-secondary font-medium"
                  }`}>
                    {lesson.title}
                  </span>
                  {getLessonIcon(lesson.type, lesson.isLocked)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function VideoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, getToken } = useAuth()
  const [position, setPosition] = useState({ top: "20%", left: "10%" })
  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"description" | "content">("description")
  const { logVideoWatch } = useStudyRecords()
  const hasLogged = useRef(false)
  const playerRef = useRef<HTMLDivElement>(null)

  function handleFullscreen() {
    playerRef.current?.requestFullscreen()
  }

  useEffect(() => {
    let cancelled = false
    const token = getToken()
    getVideo(Number(id), token || undefined)
      .then((data: ApiVideoResponse) => {
        if (cancelled) return
        if (!data || !data.id) {
          setVideo(null)
          return
        }
        setVideo({
          id: String(data.id),
          title: data.title,
          description: data.description,
          provider: data.provider,
          url: data.url || "",
          duration: String(data.duration ?? ""),
          courseTitle: data.courseTitle,
          isLocked: data.isLocked,
          groups: data.groups.map((g) => ({
            id: String(g.id),
            title: g.title,
            lessons: g.lessons.map((l) => ({
              id: String(l.id),
              title: l.title,
              type: l.type,
              duration: l.duration !== undefined ? String(l.duration) : undefined,
              isLocked: l.isLocked,
              isCompleted: l.isCompleted,
            })),
          })),
        })
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id, getToken])

  useEffect(() => {
    if (!video || video.isLocked || hasLogged.current) return
    hasLogged.current = true
    logVideoWatch({ courseTitle: video.courseTitle, videoTitle: video.title })
  }, [video, logVideoWatch])

  // Periodically report watch progress while the video is open
  useEffect(() => {
    if (!video) return
    const token = getToken()
    if (!token) return
    const interval = setInterval(() => {
      updateVideoProgress(Number(id), 50, token)
    }, 60000)
    return () => clearInterval(interval)
  }, [video, id, getToken])

  // iframes (YouTube/Vimeo embeds) don't expose a reliable onEnded event,
  // so fall back to marking the video as fully watched once its stated duration has elapsed
  useEffect(() => {
    if (!video || video.isLocked) return
    const token = getToken()
    if (!token) return
    const durationMinutes = Number(video.duration) || 0
    if (durationMinutes <= 0) return
    const timeout = setTimeout(() => {
      updateVideoProgress(Number(id), 100, token)
    }, durationMinutes * 60000)
    return () => clearTimeout(timeout)
  }, [video, id, getToken])

  function handleVideoEnded() {
    const token = getToken()
    if (!token) return
    updateVideoProgress(Number(id), 100, token)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        top: Math.random() * 70 + 10 + "%",
        left: Math.random() * 60 + 10 + "%",
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-secondary mb-4">الفيديو غير موجود</h2>
          <Link to="/courses" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition">
            العودة للكورسات
          </Link>
        </div>
      </div>
    )
  }

  const embedUrl = !video.isLocked ? getEmbedUrl(video.url, video.provider) : ""

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-right">
            <p className="text-xs text-muted">{video.courseTitle}</p>
            <h1 className="font-bold text-secondary text-sm">{video.title}</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted hover:text-primary transition text-sm font-bold"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left — Video + Info */}
          <div className="lg:col-span-2 space-y-4">

            {/* Video Player */}
            <motion.div
              ref={playerRef}
              className="relative bg-black rounded-3xl overflow-hidden shadow-2xl select-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              {user && (
                <div
                  className="absolute z-20 pointer-events-none select-none transition-all duration-[3000ms] ease-in-out"
                  style={{ top: position.top, left: position.left }}
                >
                  <p className="text-white/30 text-sm font-bold drop-shadow-lg whitespace-nowrap">
                    {user.name.split(" ").slice(0, 2).join(" ")} | {user.phone}
                  </p>
                </div>
              )}

              {embedUrl && (
                <button
                  onClick={handleFullscreen}
                  className="absolute z-20 bottom-3 left-3 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              )}

              {embedUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onEnded={handleVideoEnded}
                  />
                </div>
              ) : video.isLocked ? (
                <div className="aspect-video flex flex-col items-center justify-center gap-4 bg-surface-dark/90">
                  <Lock className="w-16 h-16 text-white/30" />
                  <p className="text-white/50 text-sm">هذا الفيديو مقفول — اشترك في الكورس لمشاهدته</p>
                </div>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center gap-4 bg-surface-dark/90">
                  <PlayCircle className="w-16 h-16 text-white/30" />
                  <p className="text-white/50 text-sm">الفيديو غير متاح حالياً</p>
                </div>
              )}
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
              <button
                onClick={() => setActiveTab("description")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === "description"
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted hover:text-primary"
                }`}
              >
                وصف الفيديو
              </button>
              <button
                onClick={() => setActiveTab("content")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === "content"
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-muted hover:text-primary"
                }`}
              >
                محتوى الكورس
              </button>
            </div>

            <AnimatePresence mode="wait">

              {/* Description Tab */}
              {activeTab === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border rounded-3xl p-6 space-y-4 text-right"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted bg-background border border-border px-3 py-1 rounded-full">
                      {video.duration} دقيقة
                    </span>
                    <h2 className="font-bold text-secondary text-lg">{video.title}</h2>
                  </div>

                  <p className="text-text text-sm leading-8">{video.description}</p>

                  <div className="flex items-center gap-3 justify-end pt-2 border-t border-border">
                    <span className="text-sm text-muted">{siteConfig.teacher.name}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-xs">
                        {siteConfig.teacher.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Content Tab */}
              {activeTab === "content" && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {video.groups.length === 0 ? (
                    <div className="text-center py-10 bg-card border border-border rounded-2xl">
                      <p className="text-muted text-sm">لا يوجد محتوى متاح</p>
                    </div>
                  ) : (
                    video.groups.map((group) => (
                      <GroupAccordion key={group.id} group={group} />
                    ))
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right — Course Content Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-3xl p-5 sticky top-20">
              <h3 className="font-bold text-secondary text-right mb-4 pb-3 border-b border-border">
                محتوى الكورس
              </h3>

              {video.groups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted text-sm">لا يوجد محتوى</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {video.groups.map((group) => (
                    <GroupAccordion key={group.id} group={group} />
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}

export default VideoPage
