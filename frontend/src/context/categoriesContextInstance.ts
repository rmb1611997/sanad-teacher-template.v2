import { createContext } from "react"

export interface Category {
  id: string
  name: string
  order: number
}

export interface CategoriesContextType {
  categories: Category[]
  addCategory: (name: string) => Category
  updateCategory: (id: string, name: string) => void
  removeCategory: (id: string) => void
  setCategories: (categories: Category[]) => void
}

export const CategoriesContext = createContext<CategoriesContextType | null>(null)
