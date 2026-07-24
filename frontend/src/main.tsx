import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { siteConfig } from "./config/site"
import { AuthProvider } from "./context/AuthContext"
import { CategoriesProvider } from "./context/CategoriesContext"
import { StudyRecordsProvider } from "./context/StudyRecordsContext"

const root = document.documentElement
root.style.setProperty("--color-primary", siteConfig.colors.primary)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <CategoriesProvider>
        <StudyRecordsProvider>
          <App />
        </StudyRecordsProvider>
      </CategoriesProvider>
    </AuthProvider>
  </StrictMode>
)