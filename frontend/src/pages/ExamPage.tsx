import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Award, Loader2 } from "lucide-react"
import { siteConfig } from "../config/site"
import { useStudyRecords } from "../context/useStudyRecords"
import { useAuth } from "../context/useAuth"
import { getExam, submitExam } from "../services/api"

interface Choice {
  id: string
  text: string
  image?: string
}

interface Question {
  id: string
  text?: string
  image?: string
  labelStyle?: "ar" | "en" | "num"
  choices: Choice[]
}

interface ExamData {
  id: string
  title: string
  duration: number // بالدقائق
  maxAttempts?: number
  passingScore?: number
  totalScore?: number
  perQuestionScore?: number
  showResult?: boolean
  questions: Question[]
}

interface ReviewItem {
  id: string
  text: string
  image?: string
  choices: Choice[]
  chosenAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
}

interface SubmitResult {
  success: boolean
  score: number
  totalScore: number
  passingScore: number
  passed: boolean
  correctCount: number
  totalQuestions: number
  percent: number
  showResult: boolean
  review: ReviewItem[]
}

type ExamStatus = "intro" | "running" | "finished"

const LABEL_SETS: Record<string, string[]> = {
  ar: ["أ", "ب", "ج", "د", "هـ", "و"],
  en: ["A", "B", "C", "D", "E", "F"],
  num: ["1", "2", "3", "4", "5", "6"],
}

function getLabels(style?: string) {
  return LABEL_SETS[style || "ar"] || LABEL_SETS.ar
}

function ExamPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getToken } = useAuth()

  const [exam, setExam] = useState<ExamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<ExamStatus>("intro")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [score, setScore] = useState<number | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [showAnswers, setShowAnswers] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const { logExamResult } = useStudyRecords()

  useEffect(() => {
    let cancelled = false
    const token = getToken()
    getExam(Number(id), token || undefined).then((data) => {
      if (cancelled) return
      if (data.id) {
        setExam(data)
        setTimeLeft(data.duration * 60)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id, getToken])

  const totalQuestions = exam?.questions.length ?? 0

  const handleFinish = useCallback(() => {
    setStatus("finished")
    const token = getToken()
    if (token) {
      submitExam(Number(id), { answers, startedAt }, token).then((data: SubmitResult) => {
        if (data.score !== undefined) {
          setScore(data.score)
          setResult(data)
          logExamResult({ courseTitle: "كورس غير محدد", examTitle: exam?.title || "", score: data.score, total: totalQuestions })
        }
      })
    }
  }, [id, answers, getToken, exam, totalQuestions, logExamResult, startedAt])

  // Timer tick
  useEffect(() => {
    if (status !== "running" || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timer)
  }, [status, timeLeft])

  // Auto-finish when time runs out
  useEffect(() => {
    if (status !== "running" || timeLeft > 0) return
    const t = setTimeout(() => handleFinish(), 0)
    return () => clearTimeout(t)
  }, [status, timeLeft, handleFinish])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h2 className="text-2xl font-bold text-secondary mb-4">الاختبار غير موجود</h2>
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

  const currentQuestion = exam.questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0
  const percent = result ? result.percent : 0
  const passed = result ? result.passed : percent >= 50

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  function handleAnswer(choiceId: string) {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: choiceId }))
  }

  function handleNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }

  // Intro Screen
  if (status === "intro") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-3xl p-8 w-full max-w-lg text-center shadow-xl space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-secondary">{exam.title}</h1>
            <p className="text-muted text-sm mt-2">{siteConfig.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background border border-border rounded-2xl p-4">
              <p className="text-xs text-muted">عدد الأسئلة</p>
              <p className="text-2xl font-bold text-secondary mt-1">{totalQuestions}</p>
            </div>
            <div className="bg-background border border-border rounded-2xl p-4">
              <p className="text-xs text-muted">المدة</p>
              <p className="text-2xl font-bold text-secondary mt-1">{exam.duration} دقيقة</p>
            </div>
            {!!exam.totalScore && (
              <div className="bg-background border border-border rounded-2xl p-4">
                <p className="text-xs text-muted">الدرجة الكلية</p>
                <p className="text-2xl font-bold text-secondary mt-1">{exam.totalScore}</p>
              </div>
            )}
            {!!exam.passingScore && (
              <div className="bg-background border border-border rounded-2xl p-4">
                <p className="text-xs text-muted">درجة النجاح</p>
                <p className="text-2xl font-bold text-secondary mt-1">{exam.passingScore}</p>
              </div>
            )}
            {!!exam.maxAttempts && (
              <div className="bg-background border border-border rounded-2xl p-4">
                <p className="text-xs text-muted">عدد المحاولات</p>
                <p className="text-2xl font-bold text-secondary mt-1">{exam.maxAttempts}</p>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-right space-y-2">
            <p className="text-sm font-bold text-amber-700">تعليمات:</p>
            <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
              <li>اقرأ كل سؤال بعناية قبل الإجابة</li>
              <li>يمكنك التنقل بين الأسئلة</li>
              <li>الوقت سيبدأ بمجرد الضغط على ابدأ</li>
              <li>لا يمكن العودة بعد إنهاء الاختبار</li>
            </ul>
          </div>

          {totalQuestions === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 font-bold text-sm">لا توجد أسئلة في هذا الاختبار</p>
            </div>
          ) : (
            <button
              onClick={() => { setStartedAt(new Date().toISOString()); setStatus("running") }}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition"
            >
              ابدأ الاختبار ←
            </button>
          )}

          <button
            onClick={() => navigate(-1)}
            className="w-full border border-border text-muted py-3 rounded-xl font-bold text-sm hover:border-primary hover:text-primary transition"
          >
            رجوع
          </button>
        </motion.div>
      </div>
    )
  }

  // Result Screen
  if (status === "finished") {
    if (score === null) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted text-sm">جاري تصحيح الإجابات...</p>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-3xl p-8 w-full max-w-lg text-center shadow-xl space-y-6"
        >
          {/* Result Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
              passed ? "bg-emerald-100" : "bg-red-100"
            }`}
          >
            {passed
              ? <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              : <XCircle className="w-12 h-12 text-red-500" />
            }
          </motion.div>

          <div>
            <h1 className="text-2xl font-bold text-secondary">
              {passed ? (percent >= 80 ? "ممتاز! 🎉" : percent >= 60 ? "جيد جداً 👏" : "جيد ✓") : "لم تحقق درجة النجاح 💪"}
            </h1>
            <p className="text-muted text-sm mt-1">{exam.title}</p>
          </div>

          {/* Score Circle */}
          <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="54" fill="none"
                stroke={passed ? "#10b981" : "#ef4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - percent / 100) }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-secondary">{percent}%</span>
              <span className="text-xs text-muted">{score}/{result?.totalScore ?? totalQuestions}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
              <p className="text-xs text-emerald-600">صح</p>
              <p className="text-xl font-bold text-emerald-600">{result?.correctCount ?? score}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
              <p className="text-xs text-red-500">غلط</p>
              <p className="text-xl font-bold text-red-500">{totalQuestions - (result?.correctCount ?? 0)}</p>
            </div>
            <div className="bg-background border border-border rounded-2xl p-3">
              <p className="text-xs text-muted">إجمالي</p>
              <p className="text-xl font-bold text-secondary">{totalQuestions}</p>
            </div>
          </div>

          {result?.showResult && result.review.length > 0 && (
            <>
              <button
                onClick={() => setShowAnswers((v) => !v)}
                className="w-full border border-primary/30 bg-primary/5 text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/10 transition"
              >
                {showAnswers ? "إخفاء الإجابات" : "عرض الإجابات"}
              </button>

              <AnimatePresence>
                {showAnswers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="text-right space-y-3">
                      <h3 className="font-bold text-secondary text-sm border-b border-border pb-2">مراجعة الإجابات</h3>
                      {result.review.map((r, i) => (
                        <div key={r.id} className={`rounded-2xl p-4 border ${r.isCorrect ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                          <p className="font-bold text-sm text-secondary mb-2">{i + 1}. {r.text}</p>
                          {r.image && (
                            <img
                              src={r.image}
                              alt="سؤال"
                              className="w-full max-h-48 object-contain rounded-xl mb-3 border border-border bg-card"
                            />
                          )}
                          <p className="text-xs text-muted">
                            إجابتك: <span className={r.isCorrect ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                              {r.choices.find((c) => c.id === r.chosenAnswer)?.text || "لم تُجب"}
                            </span>
                          </p>
                          {!r.isCorrect && (
                            <p className="text-xs text-muted mt-1">
                              الإجابة الصحيحة: <span className="text-emerald-600 font-bold">
                                {r.choices.find((c) => c.id === r.correctAnswer)?.text}
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStatus("intro")
                setCurrentIndex(0)
                setAnswers({})
                setScore(null)
                setResult(null)
                setShowAnswers(false)
                setStartedAt(null)
                setTimeLeft(exam.duration * 60)
              }}
              className="flex-1 border border-border text-text py-3 rounded-xl font-bold text-sm hover:border-primary hover:text-primary transition"
            >
              إعادة المحاولة
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition"
            >
              العودة
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Running Screen
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3">

          {/* Title */}
          <div className="text-center">
            <h1 className="font-bold text-secondary text-sm">{exam.title}</h1>
            <p className="text-xs text-muted mt-0.5">{answeredCount}/{totalQuestions} تمت الإجابة</p>
          </div>

          {/* Timer */}
          <motion.div
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-2xl font-mono font-bold text-xl ${
              timeLeft < 60
                ? "bg-red-50 border-2 border-red-300 text-red-600"
                : timeLeft < 300
                ? "bg-amber-50 border-2 border-amber-300 text-amber-600"
                : "bg-background border-2 border-border text-secondary"
            }`}
            animate={timeLeft < 60 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </motion.div>

          {/* Finish — only once every question has been answered */}
          <AnimatePresence>
            {answeredCount === totalQuestions && totalQuestions > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleFinish}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition"
              >
                إنهاء الاختبار وتصحيحه
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-6">

          {/* Question Number */}
          <div className="flex items-center justify-between text-right">
            <span className="text-sm text-muted">
              {totalQuestions} / {currentIndex + 1}
            </span>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              سؤال {currentIndex + 1}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >

              {/* Question Card */}
              <div className="bg-card border border-border rounded-3xl p-6 text-right">
                {currentQuestion?.image && (
                  <img
                    src={currentQuestion.image}
                    alt="سؤال"
                    className="w-full max-h-64 object-contain rounded-2xl mb-4 border border-border"
                  />
                )}
                {currentQuestion?.text && (
                  <p className="text-lg font-bold text-secondary leading-8">
                    {currentQuestion.text}
                  </p>
                )}
              </div>

              {/* Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion?.choices.map((choice, i) => {
                  const isSelected = answers[currentQuestion.id] === choice.id
                  const labels = getLabels(currentQuestion.labelStyle)

                  return (
                    <motion.button
                      key={choice.id}
                      onClick={() => handleAnswer(choice.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-right transition-all ${
                        isSelected
                          ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                          : "bg-card border-border hover:border-primary/50 hover:bg-primary/5 text-secondary"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-background border border-border text-primary"
                      }`}>
                        {labels[i]}
                      </span>
                      {choice.image ? (
                        <img src={choice.image} alt={labels[i]} className="h-16 object-contain rounded-lg" />
                      ) : (
                        <span className="font-bold text-sm flex-1">{choice.text}</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handleNext}
              disabled={currentIndex === totalQuestions - 1}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-40"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Question Dots */}
            <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
              {exam.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    i === currentIndex
                      ? "bg-primary text-white"
                      : answers[q.id]
                      ? "bg-emerald-500 text-white"
                      : "bg-background border border-border text-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-background border border-border text-text rounded-xl font-bold text-sm hover:border-primary hover:text-primary transition disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}

export default ExamPage
