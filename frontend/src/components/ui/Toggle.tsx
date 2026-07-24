interface ToggleProps {
  value: boolean
  onChange: (v: boolean) => void
  label: string
  sublabel?: string
  /** Tailwind background class applied to the knob track when value is true. */
  activeColor?: string
  /** "static" keeps a fixed container look; "highlighted" tints the container when value is true. */
  variant?: "static" | "highlighted"
  /** Full className override for the wrapping container, for call sites with a bespoke look. */
  containerClassName?: string
}

const STATIC_CONTAINER_CLASS = "flex items-center justify-between p-4 bg-background border border-border rounded-2xl"
const HIGHLIGHTED_CONTAINER_CLASS = "flex items-center justify-between p-4 rounded-2xl border transition-all"

function Toggle({
  value,
  onChange,
  label,
  sublabel,
  activeColor = "bg-primary",
  variant = "static",
  containerClassName,
}: ToggleProps) {
  const resolvedContainerClass =
    containerClassName ??
    (variant === "highlighted"
      ? `${HIGHLIGHTED_CONTAINER_CLASS} ${value ? "bg-primary/5 border-primary/20" : "bg-background border-border"}`
      : STATIC_CONTAINER_CLASS)

  return (
    <div className={resolvedContainerClass}>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${value ? activeColor : "bg-border"}`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${value ? "left-0.5" : "left-6"}`}
        />
      </button>
      <div className="text-right">
        <p className="font-bold text-secondary text-sm">{label}</p>
        {sublabel && <p className="text-xs text-muted mt-0.5">{sublabel}</p>}
      </div>
    </div>
  )
}

export default Toggle
