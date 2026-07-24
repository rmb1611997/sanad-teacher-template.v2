import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Search, Users, FileSpreadsheet } from "lucide-react"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetVideos, teacherGetVideoStats } from "../../services/api"
import { useTeacherCoursesGroups } from "../../hooks/useTeacherCoursesGroups"
import { exportToExcel } from "../../utils/exportExcel"

interface VideoOption {
  id: number
  groupId: number
  title: string
}

interface ApiVideo {
  id: number
  groupId: number
  title: string
}

interface VideoViewResult {
  studentId: number
  studentCode: string
  studentName: string
  studentPhone: string
  parentPhone: string
  educationType: string
  hasWatched: boolean
  watchedAt?: string
  watchPercent?: number
}

function VideoStats() {
  const [search, setSearch] = useState("")
  const [grade, setGrade] = useState("")
  const [courseId, setCourseId] = useState("")
  const [groupId, setGroupId] = useState("")
  const [videoId, setVideoId] = useState("")

  const [videos, setVideos] = useState<VideoOption[]>([])
  const [results, setResults] = useState<VideoViewResult[]>([])

  const { getToken } = useAuth()
  const { courses, groups } = useTeacherCoursesGroups(getToken())

  useEffect(() => {
    const token = getToken()
    if (!token) return
    teacherGetVideos(token).then((data) => {
      if (Array.isArray(data)) setVideos(data.map((v: ApiVideo) => ({ id: v.id, groupId: v.groupId, title: v.title })))
    })
  }, [getToken])

  useEffect(() => {
    if (!videoId) return
    const token = getToken()
    if (token) teacherGetVideoStats(Number(videoId), token).then((data) => { if (Array.isArray(data)) setResults(data) })
  }, [videoId, getToken])

  const coursesForGrade = (g: string) => courses.filter((c) => c.grade === g)
  const groupsForCourse = (cId: string) => groups.filter((g) => g.courseId === Number(cId))
  const videosForGroup = (gId: string) => videos.filter((v) => v.groupId === Number(gId))

  const filtered = results.filter((r) =>
    r.studentName.includes(search) || r.studentPhone.includes(search)
  )

  const watched = results.filter((r) => r.hasWatched).length
  const notWatched = results.filter((r) => !r.hasWatched).length
  const avgPercent = watched > 0
    ? Math.round(results.filter((r) => r.hasWatched).reduce((acc, r) => acc + (r.watchPercent || 0), 0) / watched)
    : 0

  const selectedVideoTitle = videos.find((v) => v.id === Number(videoId))?.title || "الفيديو"

  function exportResults(subset: VideoViewResult[], label: string) {
    if (subset.length === 0) return
    exportToExcel(
      subset.map((r) => ({
        "كود الطالب": r.studentCode,
        "اسم الطالب": r.studentName,
        "رقم هاتف الطالب": r.studentPhone,
        "رقم ولي الأمر": r.parentPhone,
        "نوع التعليم": r.educationType,
        "نسبة المشاهدة": r.hasWatched ? `${r.watchPercent || 0}%` : "—",
        "تاريخ المشاهدة": r.watchedAt ? new Date(r.watchedAt).toLocaleDateString("ar-EG") : "—",
      })),
      `${label}-${selectedVideoTitle}`
    )
  }

  return (
    <div className="space-y-6">

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إحصائيات المشاهدات</h1>
        <p className="text-muted text-sm mt-1">تابع مين شاف الفيديوهات ومين لسه</p>
      </div>

      {/* Selectors */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
        <h2 className="font-bold text-secondary text-right border-b border-border pb-4">اختر الفيديو</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الصف</label>
            <select
              value={grade}
              onChange={(e) => { setGrade(e.target.value); setCourseId(""); setGroupId(""); setVideoId("") }}
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
              onChange={(e) => { setCourseId(e.target.value); setGroupId(""); setVideoId("") }}
              disabled={!grade}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
            >
              <option value="">{!grade ? "اختر الصف أولاً" : "اختر الكورس"}</option>
              {coursesForGrade(grade).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">المجموعة</label>
            <select
              value={groupId}
              onChange={(e) => { setGroupId(e.target.value); setVideoId("") }}
              disabled={!courseId}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
            >
              <option value="">{!courseId ? "اختر الكورس أولاً" : "اختر المجموعة"}</option>
              {groupsForCourse(courseId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الفيديو</label>
            <select
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              disabled={!groupId}
              className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
            >
              <option value="">{!groupId ? "اختر المجموعة أولاً" : "اختر الفيديو"}</option>
              {videosForGroup(groupId).map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {videoId && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 text-right space-y-2">
              <p className="text-xs text-muted">شاهدوا الفيديو</p>
              <p className="text-2xl font-bold text-emerald-500">{watched}</p>
              {watched > 0 && (
                <button
                  onClick={() => exportResults(results.filter((r) => r.hasWatched), "شاهدوا-الفيديو")}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  تصدير
                </button>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-right space-y-2">
              <p className="text-xs text-muted">لم يشاهدوا بعد</p>
              <p className="text-2xl font-bold text-red-500">{notWatched}</p>
              {notWatched > 0 && (
                <button
                  onClick={() => exportResults(results.filter((r) => !r.hasWatched), "لم-يشاهدوا-الفيديو")}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  تصدير
                </button>
              )}
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-right">
              <p className="text-xs text-muted">متوسط نسبة المشاهدة</p>
              <p className="text-2xl font-bold text-primary mt-1">{avgPercent}%</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-60">
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو رقم الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-card border border-border outline-none transition focus:border-primary text-right"
              />
              <Search className="absolute right-4 top-3.5 w-4 h-4 text-muted" />
            </div>
            {results.length > 0 && (
              <button
                onClick={() => exportResults(filtered, "كل-الطلاب")}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl font-bold text-sm hover:bg-primary/20 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                تصدير الكل
              </button>
            )}
          </div>

          {/* Results */}
          {results.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl">
              <Users className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="font-bold text-muted">لا توجد بيانات</p>
              <p className="text-xs text-muted mt-1">لا يوجد طلاب مسجلين حالياً</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl overflow-x-auto">
              <div className="grid grid-cols-8 gap-4 px-6 py-3 bg-background border-b border-border text-xs font-bold text-muted text-right min-w-275">
                <span>كود الطالب</span>
                <span className="col-span-2">الطالب</span>
                <span>رقم ولي الأمر</span>
                <span>نوع التعليم</span>
                <span>نسبة المشاهدة</span>
                <span>تاريخ المشاهدة</span>
                <span className="text-center">الحالة</span>
              </div>

              <div className="divide-y divide-border">
                {filtered.map((result) => (
                  <div key={result.studentId} className="grid grid-cols-8 gap-4 px-6 py-4 items-center hover:bg-primary/3 transition text-right min-w-275">

                    <span className="text-sm font-mono font-bold text-secondary" dir="ltr">{result.studentCode}</span>

                    <div className="col-span-2 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-xs">{result.studentName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-secondary text-sm">{result.studentName}</p>
                        <p className="text-xs text-muted" dir="ltr">{result.studentPhone}</p>
                      </div>
                    </div>

                    <span className="text-sm text-text" dir="ltr">{result.parentPhone}</span>

                    <span className="text-sm text-text">{result.educationType}</span>

                    <div>
                      {result.hasWatched ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${result.watchPercent || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-secondary">{result.watchPercent}%</span>
                        </div>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </div>

                    <span className="text-sm text-muted">
                      {result.watchedAt
                        ? new Date(result.watchedAt).toLocaleDateString("ar-EG")
                        : "—"}
                    </span>

                    <div className="flex justify-center">
                      {result.hasWatched ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          شاهد
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                          <XCircle className="w-3 h-3" />
                          لم يشاهد
                        </span>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      )}

    </div>
  )
}

export default VideoStats
