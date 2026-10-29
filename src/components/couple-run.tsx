/** Shown while the invite shell is still loading. CSS cycles the run strips; nothing here waits on data. */
export function CoupleRunSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center" role="status">
      <div className="flex items-end gap-1" aria-hidden="true">
        <span className="couple-run couple-run-groom" />
        <span className="couple-run couple-run-bride" />
      </div>
      <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">กำลังเปิดคำเชิญ</p>
    </div>
  )
}
