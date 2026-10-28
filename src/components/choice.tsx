import { cn } from "@/lib/utils"

export function Choice<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string
  name: string
  value: T | null
  onChange: (value: T) => void
  options: { value: T; label: string; hint?: string }[]
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[15px] leading-normal font-medium">{legend}</legend>
      <div className={cn("grid gap-2", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-2xl border px-2 py-2.5 text-center transition-colors",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              <input
                type="radio"
                className="sr-only"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              <span className="block text-[15px] leading-normal font-medium">{option.label}</span>
              {option.hint ? (
                <span className={cn("mt-0.5 block text-[13px] leading-normal", selected ? "text-primary-foreground/90" : "text-muted-foreground")}>
                  {option.hint}
                </span>
              ) : null}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
