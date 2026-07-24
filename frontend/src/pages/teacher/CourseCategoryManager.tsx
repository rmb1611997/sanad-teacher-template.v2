import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Save, Grid,
  Loader2, Trash2
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { useCategories } from "../../context/useCategories"
import { useAuth } from "../../context/useAuth"
import { getCategories, saveCategories, teacherGetCourses } from "../../services/api"
import type { Category } from "../../context/categoriesContextInstance"

type Tab = "add" | "edit" | "delete"

function CategoryPreview({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-muted text-right">معاينة الأزرار في الصفحة الرئيسية:</p>
      <div className="flex flex-wrap gap-2 justify-end">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              i === 0
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-card border border-border text-text hover:border-primary hover:text-primary"
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            {cat.name}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function CourseCategoryManager() {
  const { categories, addCategory, updateCategory, removeCategory, setCategories } = useCategories()
  const { getToken } = useAuth()
  const [tab, setTab] = useState<Tab>("add")
  const [addName, setAddName] = useState("")
  const [editId, setEditId] = useState("")
  const [editName, setEditName] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => {
    getCategories().then((data) => {
      if (Array.isArray(data)) setCategories(data.map((name, i) => ({ id: "cat-" + i, name, order: i + 1 })))
    })
  }, [setCategories])

  function handleAdd() {
    if (!addName.trim()) { addToast("يرجى إدخال اسم الفئة", "error"); return }
    if (categories.find((c) => c.name === addName.trim())) {
      addToast("هذه الفئة موجودة بالفعل", "error"); return
    }
    setIsLoading(true)
    setTimeout(() => {
      const newCategory = addCategory(addName.trim())
      setAddName("")
      setIsLoading(false)
      addToast(`تم إضافة "${newCategory.name}" بنجاح ✓`, "success")

      const token = getToken()
      if (token) saveCategories([...categories.map((c) => c.name), addName.trim()], token)
    }, 600)
  }

  function handleSelectForEdit(id: string) {
    setEditId(id)
    const cat = categories.find((c) => c.id === id)
    if (cat) setEditName(cat.name)
  }

  function handleEdit() {
    if (!editId) { addToast("اختر الفئة", "error"); return }
    if (!editName.trim()) { addToast("يرجى إدخال اسم الفئة", "error"); return }
    setIsLoading(true)
    setTimeout(() => {
      updateCategory(editId, editName.trim())
      setEditId("")
      setEditName("")
      setIsLoading(false)
      addToast("تم حفظ التعديلات بنجاح ✓", "success")

      const token = getToken()
      if (token) saveCategories(categories.map((c) => (c.id === editId ? editName.trim() : c.name)), token)
    }, 600)
  }

  async function handleDeleteClick(cat: Category) {
    const token = getToken()
    if (token) {
      const courses = await teacherGetCourses(token)
      const hasCourses = Array.isArray(courses) && courses.some((c: { category: string }) => c.category === cat.name)
      if (hasCourses) {
        addToast("لا يمكن حذف الفئة لأن بها كورسات — يرجى حذف الكورسات أو تغيير فئتها أولاً", "error")
        return
      }
    }
    setDeleteId(cat.id)
  }

  function handleDelete() {
    if (!deleteId) return
    setIsLoading(true)
    setTimeout(() => {
      const name = categories.find((c) => c.id === deleteId)?.name
      removeCategory(deleteId)
      setDeleteId(null)
      setIsLoading(false)
      addToast(`تم حذف "${name}" بنجاح`, "success")

      const token = getToken()
      if (token) saveCategories(categories.filter((c) => c.id !== deleteId).map((c) => c.name), token)
    }, 600)
  }

  const tabs = [
    { id: "add" as Tab, label: "إضافة فئة" },
    { id: "edit" as Tab, label: "تعديل فئة" },
    { id: "delete" as Tab, label: "حذف فئة" },
  ]


  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">إدارة فئات الكورسات</h1>
        <p className="text-muted text-sm mt-1">أضف وعدل فئات الكورسات التي تظهر في الصفحة الرئيسية</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setAddName("")
              setEditId("")
              setEditName("")
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

        {/* Add */}
        {tab === "add" && (
          <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إضافة فئة جديدة</h2>
                <p className="text-muted text-sm mt-1">مثال: كورسات، محاضرات، مراجعات، امتحانات</p>
              </div>

              <div className="text-right">
                <label className="block text-sm font-bold text-text mb-2">اسم الفئة *</label>
                <input
                  type="text"
                  placeholder="مثال: كورسات"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإضافة...</> : <><Plus className="w-5 h-5" />إضافة الفئة</>}
              </button>
            </div>

            {/* Preview */}
            {categories.length > 0 && (
              <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
                <div className="text-right border-b border-border pb-4">
                  <h2 className="font-bold text-secondary text-lg">الفئات الحالية</h2>
                </div>
                <CategoryPreview categories={categories} />
                <div className="space-y-2">
                  {categories.map((cat, i) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
                      <span className="text-xs text-muted">{i + 1}</span>
                      <span className="font-bold text-secondary text-sm">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Edit */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">اختر الفئة للتعديل</h2>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <Grid className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-muted font-bold text-sm">لا توجد فئات بعد</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectForEdit(cat.id)}
                      className={`p-4 rounded-2xl border text-right transition-all ${
                        editId === cat.id
                          ? "bg-primary/10 border-primary ring-2 ring-primary/10"
                          : "bg-background border-border hover:border-primary/30"
                      }`}
                    >
                      <p className="font-bold text-secondary">{cat.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence>
              {editId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <button onClick={() => { setEditId(""); setEditName("") }} className="text-sm text-muted hover:text-red-500 transition font-bold">إلغاء</button>
                    <h2 className="font-bold text-secondary text-lg">تعديل الفئة</h2>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">اسم الفئة *</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                    />
                  </div>

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

        {/* Delete */}
        {tab === "delete" && (
          <motion.div key="delete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-red-500 text-lg">حذف فئة</h2>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-8">
                  <Grid className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-muted font-bold text-sm">لا توجد فئات بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-red-50/20 border border-red-200/30 rounded-2xl">
                      <button
                        onClick={() => handleDeleteClick(cat)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition border border-red-200/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-secondary">{cat.name}</span>
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
        confirmLabel="حذف"
        message={
          <>
            هل أنت متأكد من حذف فئة
            <strong className="text-secondary mx-1">"{categories.find((c) => c.id === deleteId)?.name}"</strong>؟
          </>
        }
      />

    </div>
  )
}

export default CourseCategoryManager
