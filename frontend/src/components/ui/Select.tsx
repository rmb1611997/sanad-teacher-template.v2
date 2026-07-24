interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  error?: string
}

function Select({ label, value, onChange, options, placeholder, error }: SelectProps) {
  return (
    <div>
      <label className="block text-sm mb-2 text-text">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 rounded-xl bg-background border outline-none transition
          ${error ? "border-red-500" : "border-border focus:border-primary"}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default Select