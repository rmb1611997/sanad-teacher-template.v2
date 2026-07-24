import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Edit, Trash2, Save, DollarSign, Upload,
  Info, Loader2
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import Toggle from "../../components/ui/Toggle"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useCategories } from "../../context/useCategories"
import { useAuth } from "../../context/useAuth"
import { teacherGetCourses, teacherCreateCourse, teacherUpdateCourse, teacherDeleteCourse, uploadMedia } from "../../services/api"
import type { Course } from "../../types/course"

type Tab = "add" | "edit" | "delete"

interface CourseForm {
  grade: string
  category: string
  title: string
  description: string
  image: File | null
  imagePreview: string
  price: string
  discountPrice: string
  isFree: boolean
}

const emptyForm: CourseForm = {
  grade: "",
  category: "",
  title: "",
  description: "",
  image: null,
  imagePreview: "",
  price: "",
  discountPrice: "",
  isFree: false,
}

function PreviewCard({ form }: { form: CourseForm }) {
  const hasDiscount = !form.isFree && !!form.discountPrice && Number(form.discountPrice) > 0
  const discountPercent = hasDiscount
    ? Math.round(((Number(form.price) - Number(form.discountPrice)) / Number(form.price)) * 100)
    : 0
  const previewSrc = form.image ? URL.createObjectURL(form.image) : form.imagePreview

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center overflow-hidden">
        {previewSrc ? (
          <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <motion.span
            className="text-6xl"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            📚
          </motion.span>
        )}
        {hasDiscount && discountPercent > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
            خصم {discountPercent}%
          </div>
        )}
        {form.grade && (
          <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm text-text text-xs font-bold px-3 py-1.5 rounded-full border border-border">
            {form.grade}
          </div>
        )}
      </div>

      <div className="p-5 text-right space-y-3">
        <h3 className="font-bold text-secondary text-lg">
          {form.title || "عنوان الكورس"}
        </h3>
        <p className="text-sm text-muted leading-6">
          {form.description || "وصف الكورس"}
        </p>

        <div className="flex items-center gap-3 justify-end pt-2">
          {form.isFree ? (
            <span className="text-2xl font-bold text-emerald-500">مجاني 🎁</span>
          ) : hasDiscount ? (
            <>
              <span className="text-muted line-through text-sm">{form.price} ج.م</span>
              <span className="text-2xl font-bold text-primary">{form.discountPrice} ج.م</span>
            </>
          ) : (
            <span className="text-2xl font-bold text-primary">
              {form.price ? `${form.price} ج.م` : "السعر"}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <div className="flex-1 bg-primary/10 text-primary py-2 rounded-xl text-center text-sm font-bold">
            تفاصيل الكورس
          </div>
          <div className="flex-1 bg-primary text-white py-2 rounded-xl text-center text-sm font-bold">
            {form.isFree ? "ابدأ مجاناً" : "اشترك الآن"}
          </div>
        </div>
      </div>
    </div>
  )
}

function CourseManager() {
  const [tab, setTab] = useState<Tab>("add")
  const [courses, setCourses] = useState<Course[]>([])
  const [form, setForm] = useState<CourseForm>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { categories } = useCategories()
  const { getToken } = useAuth()

  useEffect(() => {
    const token = getToken()
    if (token) {
      teacherGetCourses(token).then((data) => {
        if (Array.isArray(data)) setCourses(data)
      })
    }
  }, [getToken])

  function updateField(field: keyof CourseForm, value: string | boolean | File | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validateForm(): boolean {
    if (!form.grade || !form.title || !form.description) {
      addToast("يرجى تعبئة جميع الحقول المطلوبة", "error")
      return false
    }
    if (!form.isFree && !form.price) {
      addToast("يرجى تحديد سعر الكورس", "error")
      return false
    }
    if (!form.isFree && form.discountPrice && Number(form.discountPrice) >= Number(form.price)) {
      addToast("سعر الخصم يجب أن يكون أقل من السعر الأصلي", "error")
      return false
    }
    return true
  }

  async function handleAdd() {
    if (!validateForm()) return
    setIsLoading(true)
    const token = getToken()

    let imageId: number | undefined
    if (form.image) {
      const media = await uploadMedia(form.image, token!)
      imageId = media.id
    }

    const data = await teacherCreateCourse({
      title: form.title,
      description: form.description,
      grade: form.grade,
      category: form.category,
      price: form.isFree ? 0 : Number(form.price),
      discountPrice: !form.isFree && form.discountPrice ? Number(form.discountPrice) : undefined,
      shortDescription: form.description,
      image: imageId,
      isFree: form.isFree,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setCourses((prev) => [data.course, ...prev])
      setForm(emptyForm)
      addToast("تم إضافة الكورس بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة الكورس", "error")
    }
  }

  function handleSelectForEdit(course: Course) {
    setEditingId(course.id)
    setForm({
      grade: course.grade,
      category: course.category || "",
      title: course.title,
      description: course.description,
      image: null,
      imagePreview: course.image,
      price: String(course.price),
      discountPrice: course.discountPrice ? String(course.discountPrice) : "",
      isFree: course.price === 0,
    })
    addToast(`تم تحميل بيانات "${course.title}" للتعديل`, "success")
  }

  async function handleEdit() {
    if (!editingId) {
      addToast("يرجى اختيار الكورس أولاً", "error")
      return
    }
    if (!validateForm()) return
    setIsLoading(true)
    const token = getToken()

    let imageId: number | undefined
    if (form.image) {
      const media = await uploadMedia(form.image, token!)
      imageId = media.id
    }

    const data = await teacherUpdateCourse(editingId, {
      title: form.title,
      description: form.description,
      grade: form.grade,
      category: form.category,
      price: form.isFree ? 0 : Number(form.price),
      discountPrice: !form.isFree && form.discountPrice ? Number(form.discountPrice) : undefined,
      shortDescription: form.description,
      isFree: form.isFree,
      image: imageId,
    }, token!)
    setIsLoading(false)
    if (data.success) {
      setCourses((prev) => prev.map((c) => (c.id === editingId ? data.course : c)))
      setEditingId(null)
      setForm(emptyForm)
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    const token = getToken()
    const title = courses.find((c) => c.id === deleteId)?.title
    const data = await teacherDeleteCourse(deleteId, token!)
    setIsLoading(false)
    if (data.success) {
      setCourses((prev) => prev.filter((c) => c.id !== deleteId))
      setDeleteId(null)
      addToast(`تم حذف كورس "${title}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "add", label: "إضافة كورس", icon: <Plus className="w-4 h-4" /> },
    { id: "edit", label: "تعديل كورس", icon: <Edit className="w-4 h-4" /> },
    { id: "delete", label: "حذف كورس", icon: <Trash2 className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة الكورسات</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف الكورسات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setForm(emptyForm)
              setEditingId(null)
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
              tab === t.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-muted hover:text-primary"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Add Tab */}
        {tab === "add" && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-5 gap-6"
          >
            {/* Form */}
            <div className="lg:col-span-3 bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إضافة كورس جديد</h2>
                <p className="text-muted text-sm mt-1">أدخل بيانات الكورس الجديد</p>
              </div>

              {/* Grade */}
              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">الصف الدراسي *</label>
                <select
                  value={form.grade}
                  onChange={(e) => updateField("grade", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                >
                  <option value="">اختر الصف الدراسي</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">فئة الكورس</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  disabled={categories.length === 0}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
                >
                  <option value="">{categories.length === 0 ? "لا يوجد فئات — أضف فئات أولاً" : "اختر الفئة"}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">عنوان الكورس *</label>
                <input
                  type="text"
                  placeholder="ادخل عنوان الكورس"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                />
              </div>

              {/* Description */}
              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">وصف الكورس *</label>
                <textarea
                  placeholder="ادخل وصف الكورس"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-bold text-text mb-2 text-right">صورة الكورس</label>
                <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary transition cursor-pointer bg-background">
                  <Upload className="w-7 h-7 text-muted" />
                  <span className="text-sm text-muted font-bold">{form.image ? form.image.name : "اضغط لرفع الصورة"}</span>
                  <input type="file" accept="image/*" onChange={(e) => updateField("image", e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>

              {/* Free Toggle */}
              <Toggle
                value={form.isFree}
                onChange={(v) => updateField("isFree", v)}
                label="كورس مجاني 🎁"
                sublabel="أي طالب مسجل يقدر يشوف الكورس بدون اشتراك"
                activeColor="bg-emerald-500"
                containerClassName="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl"
              />

              {/* Price */}
              {!form.isFree && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">السعر الأصلي (ج.م) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="300"
                        value={form.price}
                        onChange={(e) => updateField("price", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                      />
                      <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">سعر الخصم (اختياري)</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="199"
                        value={form.discountPrice}
                        onChange={(e) => updateField("discountPrice", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                      />
                      <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-muted" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit */}
              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري إضافة الكورس...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    إضافة الكورس
                  </>
                )}
              </button>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-sm font-bold text-muted text-right">معاينة الكارت</p>
              <PreviewCard form={form} />
            </div>
          </motion.div>
        )}

        {/* Edit Tab */}
        {tab === "edit" && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            {/* Course List */}
            <div className="bg-card border border-border rounded-3xl p-6">
              <div className="text-right border-b border-border pb-4 mb-5">
                <h2 className="font-bold text-secondary text-lg">اختر الكورس للتعديل</h2>
                <p className="text-muted text-sm mt-1">اضغط على الكورس لتحميل بياناته</p>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-10">
                  <Info className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="font-bold text-muted">لا يوجد كورسات</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => handleSelectForEdit(course)}
                      className={`flex gap-4 p-4 rounded-2xl border text-right transition-all w-full items-center ${
                        editingId === course.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-primary/3"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">📚</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-secondary text-sm truncate">{course.title}</h4>
                        <p className="text-xs text-muted mt-1 truncate">{course.grade}</p>
                        <p className="text-xs text-primary font-bold mt-1">
                          {course.price === 0 ? "مجاني" : `${course.discountPrice ?? course.price} ج.م`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Edit Form */}
            <AnimatePresence>
              {editingId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid lg:grid-cols-5 gap-6"
                >
                  <div className="lg:col-span-3 bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                      <button
                        onClick={() => { setEditingId(null); setForm(emptyForm) }}
                        className="text-sm text-muted hover:text-red-500 transition font-bold"
                      >
                        إلغاء التعديل
                      </button>
                      <h2 className="font-bold text-secondary text-lg">تعديل الكورس</h2>
                    </div>

                    <div className="text-right">
                      <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
                      <select
                        value={form.grade}
                        onChange={(e) => updateField("grade", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                      >
                        {grades.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-right">
                      <label className="block text-sm font-bold text-text mb-2">فئة الكورس</label>
                      <select
                        value={form.category}
                        onChange={(e) => updateField("category", e.target.value)}
                        disabled={categories.length === 0}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right disabled:opacity-50"
                      >
                        <option value="">{categories.length === 0 ? "لا يوجد فئات — أضف فئات أولاً" : "اختر الفئة"}</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-right">
                      <label className="block text-sm font-bold text-text mb-2">عنوان الكورس</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                      />
                    </div>

                    <div className="text-right">
                      <label className="block text-sm font-bold text-text mb-2">وصف الكورس</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-text mb-2 text-right">صورة الكورس</label>
                      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-border hover:border-primary transition cursor-pointer bg-background">
                        <Upload className="w-7 h-7 text-muted" />
                        <span className="text-sm text-muted font-bold">{form.image ? form.image.name : "اضغط لرفع الصورة"}</span>
                        <input type="file" accept="image/*" onChange={(e) => updateField("image", e.target.files?.[0] || null)} className="hidden" />
                      </label>
                    </div>

                    <Toggle
                      value={form.isFree}
                      onChange={(v) => updateField("isFree", v)}
                      label="كورس مجاني 🎁"
                      activeColor="bg-emerald-500"
                      containerClassName="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl"
                    />

                    {!form.isFree && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-right">
                          <label className="block text-sm font-bold text-text mb-2">السعر الأصلي</label>
                          <input
                            type="number"
                            value={form.price}
                            onChange={(e) => updateField("price", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                          />
                        </div>
                        <div className="text-right">
                          <label className="block text-sm font-bold text-text mb-2">سعر الخصم</label>
                          <input
                            type="number"
                            value={form.discountPrice}
                            onChange={(e) => updateField("discountPrice", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleEdit}
                      disabled={isLoading}
                      className="w-full bg-amber-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          جاري حفظ التعديلات...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          حفظ التعديلات
                        </>
                      )}
                    </button>
                  </div>

                  <div className="lg:col-span-2 space-y-3">
                    <p className="text-sm font-bold text-muted text-right">معاينة الكارت</p>
                    <PreviewCard form={form} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Delete Tab */}
        {tab === "delete" && (
          <motion.div
            key="delete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-card border border-border rounded-3xl p-6">
              <div className="text-right border-b border-border pb-4 mb-5">
                <h2 className="font-bold text-red-500 text-lg">حذف الكورسات</h2>
                <p className="text-muted text-sm mt-1">اضغط على زر الحذف لإزالة الكورس نهائياً</p>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-10">
                  <Info className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="font-bold text-muted">لا يوجد كورسات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 bg-red-50/20 border border-red-200/30 rounded-2xl gap-4"
                    >
                      <button
                        onClick={() => setDeleteId(course.id)}
                        className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition border border-red-200/50 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex gap-4 items-center flex-1 text-right overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-secondary text-sm truncate">{course.title}</h4>
                          <p className="text-xs text-muted mt-1">{course.grade}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {course.image ? (
                            <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">📚</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Delete Modal */}
      <ConfirmDeleteModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isLoading}
        message={
          <>
            هل أنت متأكد من حذف كورس
            <strong className="text-secondary mx-1">
              "{courses.find((c) => c.id === deleteId)?.title}"
            </strong>
            ؟ هذا الإجراء لا يمكن التراجع عنه.
          </>
        }
      />

    </div>
  )
}

export default CourseManager