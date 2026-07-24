import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, Search } from "lucide-react"

function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 overflow-hidden relative">

      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[100px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-[80px]"
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 text-center max-w-lg">

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <motion.h1
            className="text-[9rem] md:text-[12rem] font-bold leading-none bg-gradient-to-b from-primary to-primary/20 bg-clip-text text-transparent select-none"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.h1>

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
          >
            <div className="w-20 h-20 rounded-2xl bg-card border border-border shadow-xl flex items-center justify-center -translate-y-6">
              <Search className="w-9 h-9 text-primary" />
            </div>
          </motion.div>
        </motion.div>

        <motion.h2
          className="text-2xl md:text-3xl font-bold text-secondary mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          الصفحة غير موجودة
        </motion.h2>

        <motion.p
          className="text-muted mt-3 leading-7"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مكان آخر.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8"
        >
          <Link to="/">
            <motion.button
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg shadow-primary/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Home className="w-5 h-5" />
              الرجوع للصفحة الرئيسية
            </motion.button>
          </Link>
        </motion.div>

      </div>
    </div>
  )
}

export default NotFound
