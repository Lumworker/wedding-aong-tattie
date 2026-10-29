import type { Wish } from "@/lib/types"

/** Full blessing text. Scene bubbles only preview a few lines. */
export function WishBoard({
  wishes,
  phone,
  onEdit,
}: {
  wishes: Wish[]
  phone: string
  onEdit: (wish: Wish) => void
}) {
  if (wishes.length === 0) return null
  const ordered = wishes.slice().reverse()
  const preview = ordered.slice(0, 4)
  const extra = ordered.slice(4)

  return (
    <div id="wishes-all" className="flex flex-col gap-2">
      <WishList wishes={preview} phone={phone} onEdit={onEdit} />
      {extra.length > 0 ? (
        <details>
          <summary className="cursor-pointer py-1 text-[15px] text-muted-foreground">ดูอีก {extra.length} ข้อความ</summary>
          <div className="mt-2">
            <WishList wishes={extra} phone={phone} onEdit={onEdit} />
          </div>
        </details>
      ) : null}
    </div>
  )
}

function WishList({
  wishes,
  phone,
  onEdit,
}: {
  wishes: Wish[]
  phone: string
  onEdit: (wish: Wish) => void
}) {
  return (
    <ul className="flex flex-col gap-2">
      {wishes.map((wish) => {
        const mine = wish.partyPhone === phone
        return (
          <li key={wish.id} className="rounded-2xl border border-[#e0b85a] bg-[#fffaf0] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-[15px] font-semibold break-words text-[#7a2438]">{wish.from}</p>
              {mine ? (
                <button
                  type="button"
                  onClick={() => onEdit(wish)}
                  className="shrink-0 text-[13px] font-medium text-rose underline-offset-2 hover:underline"
                >
                  แก้ไข
                </button>
              ) : null}
            </div>
            <p className="mt-1 text-base leading-relaxed break-words whitespace-pre-wrap text-[#1c1612]">{wish.text}</p>
          </li>
        )
      })}
    </ul>
  )
}
