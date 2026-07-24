import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import {
  BookOpen, Upload, CheckCircle2,
  FileText, Send, X, Image as ImageIcon, Loader2
} from "lucide-react"
import { siteConfig } from "../config/site"
import { useStudyRecords } from "../context/useStudyRecords"
import { useAuth } from "../context/useAuth"
import { useCountdown } from "../hooks/useCountdown"
import DueCountdown from "../components/common/DueCountdown"
import { getAssignment, submitAssignment, uploadMedia } from "../services/api"

interface AssignmentData {
  id: string
  title: string
  description: string
  dueDate?: string
  allowText: boolean
  allowFile: boolean
  allowImage: boolean
}

interface ApiAssignment {
  id: number
  title: string
  description: string
  dueDate?: string
  allowText: boolean
  allowFile: boolean
  allowImage: boolean
}

function mapApiAssignment(a: ApiAssignment): AssignmentData {
  return {
    id: String(a.id),
    title: a.title,
    description: a.description,
    dueDate: a.dueDate || undefined,
    allowText: a.allowText,
    allowFile: a.allowFile,
    allowImage: a.allowImage,
  }
}

type SubmitStatus = "idle" | "submitting" | "submitted"

function AssignmentPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getToken } = useAuth()

  const [assignment, setAssignment] = useState<AssignmentData | null>(null)
  const countdown = useCountdown(assignment?.dueDate)
  const isClosed = countdown.hasDeadline && countdown.expired
  const [loading, setLoading] = useState(true)
  const [textAnswer, setTextAnswer] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [images, setImages] = useState<{ file: File; preview: string }[]>([])
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { logAssignmentSubmission } = useStudyRecords()

  useEffect(() => {
    const token = getToken()
    getAssignment(Number(id), token || undefined)
      .then((data: ApiAssignment) => {
        if (data && data.id) setAssignment(mapApiAssignment(data))
      })
      .finally(() => setLoading(false))
  }, [id, getToken])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    setFiles((prev) => [...prev, ...selected])
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    selected.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImages((prev) => [...prev, { file, preview: ev.target?.result as string }])
      }
      reader.readAsDataURL(file)
    })
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!assignment || isClosed) return
    if (!textAnswer.trim() && files.length === 0 && images.length === 0) return
    const token = getToken()
    if (!token) return

    setSubmitStatus("submitting")
    setError("")

    try {
      let fileUrl = ""
      let imageUrl = ""

      if (files.length > 0) {
        const media = await uploadMedia(files[0], token)
        fileUrl = media?.source_url || ""
      }
      if (images.length > 0) {
        const media = await uploadMedia(images[0].file, token)
        imageUrl = media?.source_url || ""
      }

      const data = await submitAssignment(Number(id), {
        textAnswer: textAnswer.trim(),
        fileUrl,
        imageUrl,
      }, token)

      if (data.success) {
        setSubmitStatus("submitted")
        logAssignmentSubmission({ courseTitle: "كورس غير محدد", assignmentTitle: assignment.title, grade: null })
      } else {
        setError(data.message || "حدث خطأ أثناء إرسال الواجب")
        setSubmitStatus("idle")
      }
    } catch {
      setError("حدث خطأ أثناء إرسال الواجب")
      setSubmitStatus("idle")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-secondary mb-4">الواجب غير موجود</h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition"
          >
            رجوع
          </button>
        </div>
      </div>
    )
  }

  // Submitted Screen
  if (submitStatus === "submitted") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-3xl p-8 w-full max-w-md text-center shadow-xl space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold text-secondary">تم إرسال الواجب ✓</h1>
            <p className="text-muted text-sm mt-2">
              تم إرسال إجابتك بنجاح وسيتم مراجعتها من قِبل {siteConfig.teacher.name}
            </p>
          </div>

          <div className="bg-background border border-border rounded-2xl p-4 text-right space-y-2">
            <p className="text-xs text-muted">الواجب</p>
            <p className="font-bold text-secondary">{assignment.title}</p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 transition"
          >
            العودة
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            aria-label="إغلاق"
            className="p-2 rounded-xl border border-border hover:border-primary hover:text-primary transition text-muted"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-secondary">{assignment.title}</h1>
            <p className="text-xs text-muted">{siteConfig.name}</p>
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Assignment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <h2 className="font-bold text-secondary text-lg">{assignment.title}</h2>
              <div className="flex justify-end mt-2">
                <DueCountdown dueDate={assignment.dueDate} size="md" />
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="bg-background border border-border rounded-2xl p-4 text-right">
            <p className="text-sm text-text leading-7">{assignment.description}</p>
          </div>

          {/* Allowed Types — reflects exactly what the teacher configured */}
          <div className="flex gap-2 justify-end flex-wrap">
            {assignment.allowText && (
              <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" />
                إجابة نصية
              </span>
            )}
            {assignment.allowFile && (
              <span className="text-xs bg-teal-50 border border-teal-200 text-teal-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <Upload className="w-3 h-3" />
                ملف
              </span>
            )}
            {assignment.allowImage && (
              <span className="text-xs bg-purple-50 border border-purple-200 text-purple-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                صورة
              </span>
            )}
          </div>
        </motion.div>

        {/* Text Answer */}
        {assignment.allowText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-3xl p-6 space-y-3"
          >
            <h3 className="font-bold text-secondary text-right flex items-center gap-2 justify-end">
              <FileText className="w-4 h-4 text-blue-500" />
              الإجابة النصية
            </h3>
            <textarea
              placeholder="اكتب إجابتك هنا..."
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              rows={6}
              disabled={isClosed}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>{textAnswer.length} حرف</span>
              <span>اكتب إجابتك بوضوح</span>
            </div>
          </motion.div>
        )}

        {/* File Upload */}
        {assignment.allowFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-3xl p-6 space-y-4"
          >
            <h3 className="font-bold text-secondary text-right flex items-center gap-2 justify-end">
              <Upload className="w-4 h-4 text-teal-500" />
              رفع ملف
            </h3>

            <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary transition cursor-pointer bg-background">
              <Upload className="w-7 h-7 text-muted" />
              <span className="text-sm text-muted font-bold">اضغط لرفع ملف</span>
              <span className="text-xs text-muted">PDF, DOC, DOCX مدعوم</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                    <button onClick={() => removeFile(i)} aria-label="إزالة الملف" className="text-muted hover:text-red-500 transition">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-sm font-bold text-secondary truncate max-w-xs">{file.name}</span>
                      <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Image Upload */}
        {assignment.allowImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-3xl p-6 space-y-4"
          >
            <h3 className="font-bold text-secondary text-right flex items-center gap-2 justify-end">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              رفع صورة
            </h3>

            <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary transition cursor-pointer bg-background">
              <ImageIcon className="w-7 h-7 text-muted" />
              <span className="text-sm text-muted font-bold">اضغط لرفع صورة</span>
              <span className="text-xs text-muted">JPG, PNG مدعوم</span>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={img.preview}
                      alt={`صورة ${i + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-border"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      aria-label="إزالة الصورة"
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {error && (
            <p className="text-center text-xs text-red-500 mb-2">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={
              isClosed ||
              submitStatus === "submitting" ||
              (!textAnswer.trim() && files.length === 0 && images.length === 0)
            }
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {isClosed ? (
              "انتهى وقت التسليم"
            ) : submitStatus === "submitting" ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                إرسال الواجب
              </>
            )}
          </button>

          {!textAnswer.trim() && files.length === 0 && images.length === 0 && (
            <p className="text-center text-xs text-muted mt-2">
              يرجى إضافة إجابة قبل الإرسال
            </p>
          )}
        </motion.div>

      </div>
    </div>
  )
}

export default AssignmentPage
