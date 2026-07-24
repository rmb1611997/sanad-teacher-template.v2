import { useState, type ReactNode } from "react"
import { CategoriesContext, type Category } from "./categoriesContextInstance"

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("sanad_categories")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  function persist(next: Category[]) {
    setCategories(next)
    localStorage.setItem("sanad_categories", JSON.stringify(next))
  }

  function addCategory(name: string) {
    const newCategory: Category = { id: "cat-" + Date.now(), name, order: categories.length + 1 }
    persist([...categories, newCategory])
    return newCategory
  }

  function updateCategory(id: string, name: string) {
    persist(categories.map((c) => (c.id === id ? { ...c, name } : c)))
  }

  function removeCategory(id: string) {
    persist(categories.filter((c) => c.id !== id))
  }

  return (
    <CategoriesContext.Provider value={{ categories, addCategory, updateCategory, removeCategory, setCategories: persist }}>
      {children}
    </CategoriesContext.Provider>
  )
}
