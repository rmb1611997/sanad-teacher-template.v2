interface ButtonProps {
  label: string
  onClick?: () => void
  type?: "button" | "submit"
  loading?: boolean
}

function Button({ label, onClick, type = "button", loading }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-60"
    >
      {loading ? "جاري التحميل..." : label}
    </button>
  )
}

export default Button