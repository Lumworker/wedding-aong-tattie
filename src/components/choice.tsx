import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function Choice<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  stacked = false,
  leadFull = false,
}: {
  legend: string
  name: string
  value: T | null
  onChange: (value: T) => void
  options: { value: T; label: string; hint?: string }[]
  /** Full-width rows. Easier to tap when the labels are longer than a short word. */
  stacked?: boolean
  /** First option gets its own full row; the rest share the row below. */
  leadFull?: boolean
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[15px] leading-normal font-medium">{legend}</legend>
      <div
        className={cn(
          "grid gap-2",
          leadFull ? "grid-cols-2" : stacked ? "grid-cols-1" : options.length === 3 ? "grid-cols-3" : "grid-cols-2"
        )}
      >
        {options.map((option, index) => {
          const selected = value === option.value
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center transition-colors",
                leadFull && index === 0 && "col-span-2 min-h-14",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                // Selected = champagne fill + ink frame + check, so it never reads as the "ต่อไป" button.
                selected
                  ? "border-2 border-primary bg-[#F3ECE2] text-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
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
              <span className={cn("flex items-center gap-1.5 text-[15px] leading-normal", selected ? "font-semibold" : "font-medium")}>
                {selected ? <Check aria-hidden="true" className="size-4 text-[#86663A]" /> : null}
                {option.label}
              </span>
              {option.hint ? (
                <span className={cn("mt-0.5 block text-[13px] leading-normal", "text-muted-foreground")}>
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
