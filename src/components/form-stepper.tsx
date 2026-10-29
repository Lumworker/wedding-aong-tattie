import { cn } from "@/lib/utils"

const STEPS = [
  { step: 1, label: "การเข้าร่วม" },
  { step: 2, label: "รายละเอียด" },
] as const

export function FormStepper({ current, className }: { current: 1 | 2; className?: string }) {
  return (
    <nav aria-label="ขั้นตอนการลงทะเบียน" className={className}>
      <ol className="flex items-center justify-center">
        {STEPS.map((item, index) => {
          const active = item.step === current
          return (
            <li key={item.step} className="flex items-center" aria-current={active ? "step" : undefined}>
              {index > 0 ? (
                <span aria-hidden="true" className="mx-2 text-muted-foreground/40">
                  ·
                </span>
              ) : null}
              <span className={cn("text-[13px] leading-normal", active ? "font-medium text-ink" : "text-muted-foreground")}>
                {item.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
