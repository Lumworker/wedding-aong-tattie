import { PetalField } from "@/components/petal-field"

/** Shown while the invite shell is still loading. CSS cycles the run strip; nothing here waits on data. */
export function CoupleRunSplash() {
  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 text-center"
      role="status"
    >
      <PetalField />
      <div className="relative z-10 flex flex-col items-center">
        <div aria-hidden="true">
          <span className="couple-run" />
        </div>
        <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">กำลังเปิดคำเชิญ</p>
      </div>
    </div>
  )
}
