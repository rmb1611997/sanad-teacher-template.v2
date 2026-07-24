import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import AnnouncementBanner from "./AnnouncementBanner"
import Footer from "./Footer"
import WhatsAppButton from "../common/WhatsAppButton"

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-20">
        <AnnouncementBanner />
        <Outlet />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default PublicLayout