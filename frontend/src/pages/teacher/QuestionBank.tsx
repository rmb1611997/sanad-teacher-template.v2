import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Edit, Trash2, AlertTriangle, Loader2, X,
  FileQuestion, Type, Image as ImageIcon, Upload, ListTodo
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetQuestionGroups, teacherGetQuestions, teacherCreateQuestion, teacherUpdateQuestion, teacherDeleteQuestion, uploadMedia } from "../../services/api"

type LabelStyle = "ar" | "en" | "num"

const LABEL_SETS: Record<LabelStyle, string[]> = {
  ar: ["أ", "ب", "ج", "د"],
  en: ["A", "B", "C", "D"],
  num: ["1", "2", "3", "4"],
}

const LABEL_STYLE_OPTIONS: { value: LabelStyle; label: string }[] = [
  { value: "ar", label: "حروف عربي" },
  { value: "en", label: "حروف إنجليزي" },
  { value: "num", label: "أرقام" },
]

interface QuestionGroup {
  id: string
  grade: string
  name: string
}

interface Question {
  id: string
  groupId: string
  grade: string
  type: "text" | "image"
  text?: string
  choices: string[]
  correctAnswer: number
  image?: string | null
  labelStyle: LabelStyle
}

interface ApiQuestion {
  id: number
  text: string
  type: "text" | "image"
  image?: string
  choices: string[]
  correctAnswer: number
  questionGroupId: number
  labelStyle?: LabelStyle
}

function mapApiQuestion(q: ApiQuestion, grade: string): Question {
  return {
    id: String(q.id),
    groupId: String(q.questionGroupId),
    grade,
    type: q.type,
    text: q.text || undefined,
    choices: q.choices,
    correctAnswer: q.correctAnswer,
    image: q.image || null,
    labelStyle: q.labelStyle || "ar",
  }
}

function QuestionBank() {
  const [groups, setGroups] = useState<QuestionGroup[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [activeTab, setActiveTab] = useState<"add" | "manage">("add")

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)

  const [qType, setQType] = useState<"text" | "image">("text")
  const [qText, setQText] = useState("")
  const [qChoices, setQChoices] = useState(["", "", "", ""])
  const [qCorrect, setQCorrect] = useState(0)
  const [qImage, setQImage] = useState<string | null>(null)
  const [qImageId, setQImageId] = useState<number | null>(null)
  const [qLabelStyle, setQLabelStyle] = useState<LabelStyle>("ar")

  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { getToken } = useAuth()

  useEffect(() => {
    const token = getToken()
    if (token) {
      teacherGetQuestionGroups(token).then((data) => {
        if (Array.isArray(data)) setGroups(data.map((g: { id: number; grade: string; name: string }) => ({ id: String(g.id), grade: g.grade, name: g.name })))
      })
    }
  }, [getToken])

  useEffect(() => {
    if (!selectedGroupId) return
    const token = getToken()
    if (token) {
      teacherGetQuestions(token, Number(selectedGroupId)).then((data) => {
        if (Array.isArray(data)) setQuestions(data.map((q: ApiQuestion) => mapApiQuestion(q, selectedGrade)))
      })
    }
  }, [selectedGroupId, getToken, selectedGrade])

  const groupsForGrade = groups.filter((g) => g.grade === selectedGrade)
  const questionsForGroup = questions.filter((q) => q.groupId === selectedGroupId)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const token = getToken()
    if (!token) return
    setIsUploadingImage(true)
    const media = await uploadMedia(file, token)
    setIsUploadingImage(false)
    if (media?.source_url && media?.id) {
      setQImage(media.source_url)
      setQImageId(media.id)
    } else {
      addToast("حدث خطأ أثناء رفع الصورة", "error")
    }
  }

  function resetForm() {
    setQText("")
    setQChoices(["", "", "", ""])
    setQCorrect(0)
    setQImage(null)
    setQImageId(null)
    setQLabelStyle("ar")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function validateForm(): boolean {
    if (!selectedGroupId) { addToast("اختر مجموعة أسئلة أولاً", "error"); return false }
    if (qType === "text") {
      if (!qText.trim()) { addToast("يرجى إدخال نص السؤال", "error"); return false }
      if (qChoices.some((c) => !c.trim())) { addToast("يرجى ملء جميع الخيارات", "error"); return false }
    } else {
      if (!qImage) { addToast("يرجى إرفاق صورة السؤال", "error"); return false }
    }
    return true
  }

  async function handleAdd() {
    if (!validateForm()) return
    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateQuestion({
      text: qType === "text" ? qText.trim() : "سؤال مصور",
      type: qType,
      image: qImageId ?? undefined,
      choices: qType === "text" ? qChoices.map((c) => c.trim()) : LABEL_SETS[qLabelStyle],
      correctAnswer: qCorrect,
      questionGroupId: Number(selectedGroupId),
      labelStyle: qLabelStyle,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setQuestions((prev) => [...prev, mapApiQuestion(data.question, selectedGrade)])
      resetForm()
      addToast("تم إضافة السؤال بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة السؤال", "error")
    }
  }

  function handleStartEdit(q: Question) {
    setEditingQuestion(q)
    setQType(q.type)
    setQText(q.text || "")
    setQChoices(q.choices.length === 4 ? q.choices : ["", "", "", ""])
    setQCorrect(q.correctAnswer)
    setQImage(q.image || null)
    setQImageId(null)
    setQLabelStyle(q.labelStyle)
    setActiveTab("add")
  }

  function cancelEdit() {
    setEditingQuestion(null)
    resetForm()
  }

  async function handleEdit() {
    if (!editingQuestion) return
    if (!validateForm()) return
    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateQuestion(Number(editingQuestion.id), {
      text: qType === "text" ? qText.trim() : "سؤال مصور",
      type: qType,
      image: qImageId ?? undefined,
      choices: qType === "text" ? qChoices.map((c) => c.trim()) : LABEL_SETS[qLabelStyle],
      correctAnswer: qCorrect,
      labelStyle: qLabelStyle,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? mapApiQuestion(data.question, selectedGrade) : q))
      )
      addToast("تم تعديل السؤال بنجاح ✓", "success")
      cancelEdit()
    } else {
      addToast(data.message || "حدث خطأ أثناء تعديل السؤال", "error")
    }
  }

  async function handleDelete(id: string) {
    setIsLoading(true)
    const token = getToken()
    const data = await teacherDeleteQuestion(Number(id), token!)
    setIsLoading(false)
    if (data.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== id))
      setShowConfirmDelete(null)
      addToast("تم حذف السؤال بنجاح", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">بنك الأسئلة</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف الأسئلة</p>
      </div>

      {/* Selectors */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
        <h2 className="font-bold text-secondary text-right border-b border-border pb-4">اختر المجموعة</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
            <select
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setSelectedGroupId("") }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
            >
              <option value="">اختر الصف</option>
              {grades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="text-right">
            <label className="block text-sm font-bold text-text mb-2">مجموعة الأسئلة</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={!selectedGrade || groupsForGrade.length === 0}
              className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
            >
              <option value="">
                {!selectedGrade ? "اختر الصف أولاً" : groupsForGrade.length === 0 ? "لا توجد مجموعات" : "اختر المجموعة"}
              </option>
              {groupsForGrade.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {selectedGroupId && (
        <div className="bg-card border border-border rounded-3xl overflow-hidden">

          {/* Tabs */}
          <div className="flex gap-2 bg-background border-b border-border p-2">
            <button
              onClick={() => { setActiveTab("add"); cancelEdit() }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "add" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"
              }`}
            >
              <Plus className="w-4 h-4" />
              إضافة سؤال
            </button>
            <button
              onClick={() => { setActiveTab("manage"); cancelEdit() }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === "manage" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted hover:text-primary"
              }`}
            >
              <ListTodo className="w-4 h-4" />
              الأسئلة ({questionsForGroup.length})
            </button>
          </div>

          <div className="p-6 space-y-6">
            <AnimatePresence mode="wait">

              {/* Add / Edit */}
              {activeTab === "add" && (
                <motion.div key={editingQuestion ? "edit" : "add"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                  <div className="flex items-center justify-between border-b border-border pb-4 text-right">
                    <div>
                      {editingQuestion && (
                        <button onClick={cancelEdit} aria-label="إلغاء التعديل" className="p-2 bg-background border border-border rounded-xl hover:border-red-400 hover:text-red-500 transition">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <h2 className="font-bold text-secondary text-lg">
                      {editingQuestion ? "تعديل السؤال" : "إضافة سؤال جديد"}
                    </h2>
                  </div>

                  {/* Type Toggle */}
                  <div className="flex gap-2 bg-background border border-border rounded-2xl p-1.5 w-fit">
                    <button
                      type="button"
                      onClick={() => setQType("text")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        qType === "text" ? "bg-card shadow-sm text-secondary border border-border" : "text-muted hover:text-secondary"
                      }`}
                    >
                      <Type className="w-4 h-4" />
                      سؤال نصي
                    </button>
                    <button
                      type="button"
                      onClick={() => setQType("image")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        qType === "image" ? "bg-card shadow-sm text-secondary border border-border" : "text-muted hover:text-secondary"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      سؤال مصور
                    </button>
                  </div>

                  {/* Text */}
                  {qType === "text" && (
                    <div className="text-right">
                      <label className="block text-sm font-bold text-text mb-2">نص السؤال *</label>
                      <textarea
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        placeholder="اكتب سؤالك هنا..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
                      />
                    </div>
                  )}

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-text mb-2 text-right">
                      {qType === "image" ? "صورة السؤال *" : "صورة مساعدة (اختياري)"}
                    </label>
                    <label className="relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary transition cursor-pointer bg-background">
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-7 h-7 text-primary animate-spin" />
                          <span className="text-sm text-muted font-bold">جاري رفع الصورة...</span>
                        </>
                      ) : qImage ? (
                        <div className="flex flex-col items-center gap-3">
                          <img src={qImage} alt="preview" className="max-h-48 rounded-xl object-contain" />
                          <span className="text-xs text-primary font-bold">اضغط لتغيير الصورة</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-7 h-7 text-muted" />
                          <span className="text-sm text-muted font-bold">اضغط أو اسحب الصورة هنا</span>
                        </>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={isUploadingImage} />
                    </label>
                  </div>

                  {/* Choices */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex gap-2 bg-background border border-border rounded-xl p-1">
                        {LABEL_STYLE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setQLabelStyle(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              qLabelStyle === opt.value ? "bg-card shadow-sm text-secondary border border-border" : "text-muted hover:text-secondary"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <label className="block text-sm font-bold text-text text-right">الخيارات والإجابة الصحيحة *</label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            qCorrect === i
                              ? "bg-emerald-50 border-emerald-300"
                              : "bg-background border-border"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setQCorrect(i)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                              qCorrect === i
                                ? "bg-emerald-500 text-white"
                                : "bg-card border border-border text-muted hover:border-primary"
                            }`}
                          >
                            {LABEL_SETS[qLabelStyle][i]}
                          </button>
                          {qType === "text" ? (
                            <input
                              type="text"
                              value={qChoices[i]}
                              onChange={(e) => {
                                const newC = [...qChoices]
                                newC[i] = e.target.value
                                setQChoices(newC)
                              }}
                              placeholder={`الخيار ${LABEL_SETS[qLabelStyle][i]}`}
                              className="flex-1 bg-transparent text-sm font-bold text-secondary outline-none text-right"
                            />
                          ) : (
                            <span className="text-xs text-muted">الخيار ({LABEL_SETS[qLabelStyle][i]}) في الصورة</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={editingQuestion ? handleEdit : handleAdd}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition disabled:opacity-60 ${
                      editingQuestion ? "bg-amber-500 hover:opacity-90" : "bg-primary hover:opacity-90"
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />{editingQuestion ? "جاري الحفظ..." : "جاري الإضافة..."}</>
                    ) : (
                      <>{editingQuestion ? <><Edit className="w-5 h-5" />حفظ التعديلات</> : <><Plus className="w-5 h-5" />إضافة السؤال</>}</>
                    )}
                  </button>

                </motion.div>
              )}

              {/* Manage */}
              {activeTab === "manage" && (
                <motion.div key="manage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {questionsForGroup.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                      <FileQuestion className="w-12 h-12 text-muted mx-auto mb-3" />
                      <p className="font-bold text-muted">لا توجد أسئلة في هذه المجموعة</p>
                    </div>
                  ) : (
                    questionsForGroup.map((q, idx) => (
                      <div key={q.id} className="relative bg-background border border-border rounded-2xl p-5 group">

                        {/* Delete Confirm Overlay */}
                        <AnimatePresence>
                          {showConfirmDelete === q.id && (
                            <motion.div
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-red-50/95 backdrop-blur-sm z-10 rounded-2xl flex flex-col items-center justify-center gap-4"
                            >
                              <AlertTriangle className="w-8 h-8 text-red-500" />
                              <p className="font-bold text-red-700 text-sm">هل أنت متأكد من حذف هذا السؤال؟</p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleDelete(q.id)}
                                  disabled={isLoading}
                                  className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-red-600 transition flex items-center gap-2"
                                >
                                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  حذف
                                </button>
                                <button onClick={() => setShowConfirmDelete(null)} className="bg-card border border-border px-5 py-2 rounded-xl font-bold text-sm hover:border-primary transition">
                                  إلغاء
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Question Header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => handleStartEdit(q)} className="p-2 bg-card border border-border rounded-xl hover:border-primary hover:text-primary transition">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setShowConfirmDelete(q.id)} className="p-2 bg-card border border-border rounded-xl hover:border-red-400 hover:text-red-500 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right flex items-start gap-3">
                            <div>
                              <div className="flex items-center gap-2 justify-end mb-1">
                                <span className="text-xs text-muted flex items-center gap-1">
                                  {q.type === "text" ? <Type className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                  {q.type === "text" ? "نصي" : "مصور"}
                                </span>
                              </div>
                              {q.type === "text" && <p className="font-bold text-secondary text-sm leading-relaxed">{q.text}</p>}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </div>
                          </div>
                        </div>

                        {/* Image */}
                        {q.image && (
                          <img src={q.image} alt="question" className="max-h-40 rounded-xl border border-border mb-4 object-contain" />
                        )}

                        {/* Choices */}
                        <div className="grid grid-cols-2 gap-2">
                          {LABEL_SETS[q.labelStyle].map((lbl, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold ${
                                q.correctAnswer === i
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-card border-border text-muted"
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                q.correctAnswer === i ? "bg-emerald-500 text-white" : "bg-background border border-border"
                              }`}>
                                {lbl}
                              </span>
                              {q.type === "text" ? (q.choices[i] || "") : "خيار صوري"}
                            </div>
                          ))}
                        </div>

                      </div>
                    ))
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      )}

    </div>
  )
}

export default QuestionBank