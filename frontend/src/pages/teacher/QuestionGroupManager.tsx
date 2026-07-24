import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Trash2, Save,
  Loader2, FileQuestion
} from "lucide-react"
import Toast from "../../components/ui/Toast"
import ConfirmDeleteModal from "../../components/ui/ConfirmDeleteModal"
import useToast from "../../hooks/useToast"
import { grades } from "../../constants"
import { useAuth } from "../../context/useAuth"
import { teacherGetQuestionGroups, teacherCreateQuestionGroup, teacherUpdateQuestionGroup, teacherDeleteQuestionGroup } from "../../services/api"

interface QuestionGroup {
  id: string
  grade: string
  name: string
}

type Tab = "add" | "edit" | "delete"

function QuestionGroupManager() {
  const [tab, setTab] = useState<Tab>("add")
  const [groups, setGroups] = useState<QuestionGroup[]>([])

  const [selectedGrade, setSelectedGrade] = useState("")
  const [addName, setAddName] = useState("")

  const [editGrade, setEditGrade] = useState("")
  const [editGroupId, setEditGroupId] = useState("")
  const [editName, setEditName] = useState("")

  const [delGrade, setDelGrade] = useState("")
  const [delGroupId, setDelGroupId] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const { toasts, addToast, removeToast } = useToast()
  const { getToken } = useAuth()

  useEffect(() => {
    const token = getToken()
    if (token) {
      teacherGetQuestionGroups(token).then((data) => {
        if (Array.isArray(data)) setGroups(data.map((g: { id: number; grade: string; name: string }) => ({ id: String(g.id), grade: g.grade, name: g.name })))
      })
    }
  }, [getToken])

  const groupsForGrade = (g: string) => groups.filter((qg) => qg.grade === g)

  async function handleAdd() {
    if (!selectedGrade) { addToast("اختر الصف الدراسي", "error"); return }
    if (!addName.trim()) { addToast("يرجى إدخال اسم المجموعة", "error"); return }

    setIsLoading(true)
    const token = getToken()
    const data = await teacherCreateQuestionGroup({ name: addName.trim(), grade: selectedGrade }, token!)
    setIsLoading(false)
    if (data.success) {
      setGroups((prev) => [{ id: String(data.group.id), grade: data.group.grade, name: data.group.name }, ...prev])
      setAddName("")
      addToast(`تم إضافة "${data.group.name}" بنجاح ✓`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء إضافة المجموعة", "error")
    }
  }

  function handleSelectForEdit(groupId: string) {
    setEditGroupId(groupId)
    const group = groups.find((g) => g.id === groupId)
    if (group) setEditName(group.name)
  }

  async function handleEdit() {
    if (!editGroupId) { addToast("اختر المجموعة", "error"); return }
    if (!editName.trim()) { addToast("يرجى إدخال اسم المجموعة", "error"); return }

    setIsLoading(true)
    const token = getToken()
    const data = await teacherUpdateQuestionGroup(Number(editGroupId), { name: editName.trim() }, token!)
    setIsLoading(false)
    if (data.success) {
      setGroups((prev) =>
        prev.map((g) => g.id === editGroupId ? { ...g, name: data.group.name } : g)
      )
      addToast("تم حفظ التعديلات بنجاح ✓", "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء حفظ التعديلات", "error")
    }
  }

  async function handleDelete() {
    if (!delGroupId) return
    setIsLoading(true)
    const token = getToken()
    const name = groups.find((g) => g.id === delGroupId)?.name
    const data = await teacherDeleteQuestionGroup(Number(delGroupId), token!)
    setIsLoading(false)
    if (data.success) {
      setGroups((prev) => prev.filter((g) => g.id !== delGroupId))
      setDelGroupId("")
      setShowDeleteConfirm(false)
      addToast(`تم حذف "${name}" بنجاح`, "success")
    } else {
      addToast(data.message || "حدث خطأ أثناء الحذف", "error")
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "add", label: "إضافة مجموعة" },
    { id: "edit", label: "تعديل مجموعة" },
    { id: "delete", label: "حذف مجموعة" },
  ]

  return (
    <div className="space-y-6">

      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="text-right">
        <h1 className="text-2xl font-bold text-secondary">مجموعات الأسئلة</h1>
        <p className="text-muted text-sm mt-1">إضافة وتعديل وحذف مجموعات الأسئلة</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card border border-border rounded-2xl p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setAddName("")
              setEditGroupId("")
              setEditName("")
              setDelGroupId("")
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

        {/* Add */}
        {tab === "add" && (
          <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">إضافة مجموعة أسئلة جديدة</h2>
                <p className="text-muted text-sm mt-1">أنشئ مجموعة كوعاء لتصنيف الأسئلة بداخلها</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-bold text-text mb-2">الصف الدراسي *</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  >
                    <option value="">اختر الصف</option>
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-text mb-2">اسم المجموعة *</label>
                  <input
                    type="text"
                    placeholder="مثال: مراجعة الفصل الأول"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  />
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />جاري الإضافة...</> : <><Plus className="w-5 h-5" />إضافة المجموعة</>}
              </button>

              {/* Groups List */}
              {selectedGrade && groupsForGrade(selectedGrade).length > 0 && (
                <div className="border-t border-border pt-5 space-y-3">
                  <h3 className="font-bold text-secondary text-right text-sm">مجموعات {selectedGrade}</h3>
                  {groupsForGrade(selectedGrade).map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                      <FileQuestion className="w-5 h-5 text-muted" />
                      <span className="font-bold text-secondary text-sm">{g.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Edit */}
        {tab === "edit" && (
          <motion.div key="edit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-secondary text-lg">اختر المجموعة للتعديل</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
                  <select
                    value={editGrade}
                    onChange={(e) => { setEditGrade(e.target.value); setEditGroupId(""); setEditName("") }}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  >
                    <option value="">اختر الصف</option>
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-text mb-2">المجموعة</label>
                  <select
                    value={editGroupId}
                    onChange={(e) => handleSelectForEdit(e.target.value)}
                    disabled={!editGrade}
                    className="w-full px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 outline-none transition focus:border-primary text-right disabled:opacity-50"
                  >
                    <option value="">{!editGrade ? "اختر الصف أولاً" : "اختر المجموعة"}</option>
                    {groupsForGrade(editGrade).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {editGroupId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="bg-primary/5 border border-primary/20 rounded-3xl p-6 space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                    <button onClick={() => { setEditGroupId(""); setEditName("") }} className="text-sm text-muted hover:text-red-500 transition font-bold">إلغاء</button>
                    <h2 className="font-bold text-secondary text-lg">تعديل المجموعة</h2>
                  </div>

                  <div className="text-right">
                    <label className="block text-sm font-bold text-text mb-2">اسم المجموعة *</label>
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
          <motion.div key="delete" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
              <div className="text-right border-b border-border pb-4">
                <h2 className="font-bold text-red-500 text-lg">حذف مجموعة</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="text-right">
                  <label className="block text-sm font-bold text-text mb-2">الصف الدراسي</label>
                  <select
                    value={delGrade}
                    onChange={(e) => { setDelGrade(e.target.value); setDelGroupId("") }}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none transition focus:border-primary text-right"
                  >
                    <option value="">اختر الصف</option>
                    {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-text mb-2">المجموعة</label>
                  <select
                    value={delGroupId}
                    onChange={(e) => { setDelGroupId(e.target.value); setShowDeleteConfirm(false) }}
                    disabled={!delGrade}
                    className="w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200/50 outline-none transition focus:border-red-400 text-right disabled:opacity-50"
                  >
                    <option value="">{!delGrade ? "اختر الصف أولاً" : "اختر المجموعة"}</option>
                    {groupsForGrade(delGrade).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {delGroupId && !showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-red-50/50 border border-red-200/50 rounded-3xl p-6 flex items-center justify-between"
                >
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف المجموعة
                  </button>
                  <div className="text-right">
                    <h4 className="font-bold text-secondary">{groups.find((g) => g.id === delGroupId)?.name}</h4>
                    <p className="text-xs text-muted mt-1">سيتم حذف المجموعة وكل الأسئلة بداخلها</p>
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
            هل أنت متأكد من حذف مجموعة
            <strong className="text-secondary mx-1">"{groups.find((g) => g.id === delGroupId)?.name}"</strong>؟
            سيتم حذف كل الأسئلة بداخلها نهائياً.
          </>
        }
      />

    </div>
  )
}

export default QuestionGroupManager