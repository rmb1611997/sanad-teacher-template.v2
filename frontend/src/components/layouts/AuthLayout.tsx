import { Outlet, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { siteConfig } from "../../config/site"

function AuthLayout() {
  const location = useLocation()
  const isLogin = location.pathname === "/login"

  const sideImage = isLogin
    ? siteConfig.auth?.loginImage
    : siteConfig.auth?.registerImage

  return (
    <div className="min-h-screen flex bg-background">

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <Outlet />
      </div>

      {/* Left — Side Panel */}
      <motion.div
        className="hidden lg:flex w-[45%] relative overflow-hidden bg-surface-dark flex-col items-center justify-center text-center"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background Blobs */}
        <motion.div
          className="absolute top-0 right-0 w-72 h-72 rounded-full bg-primary/20 blur-[80px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-primary/10 blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* Side Image — تملأ المساحة بالكامل مع مسافة بسيطة من الحواف */}
        {sideImage && (
          <div className="absolute inset-0 p-6">
            <div className="relative w-full h-full rounded-3xl overflow-hidden">
              <motion.img
                src={sideImage}
                alt={siteConfig.teacher.name}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              />
            </div>
          </div>
        )}

      </motion.div>

    </div>
  )
}

export default AuthLayout