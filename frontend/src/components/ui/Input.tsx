interface InputProps {
  label?: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  maxLength?: number
}

function Input({ label, type = "text", placeholder, value, onChange, error, maxLength }: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm mb-2 text-text">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-xl bg-background border outline-none transition
          ${error ? "border-red-500" : "border-border focus:border-primary"}
        `}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default Input