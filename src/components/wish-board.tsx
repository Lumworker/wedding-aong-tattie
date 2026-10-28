import type { Wish } from "@/lib/types"

/** Full blessing text at a readable size. Scene bubbles only preview a few lines. */
export function WishBoard({ wishes }: { wishes: Wish[] }) {
  if (wishes.length === 0) return null
  const ordered = wishes.slice().reverse()

  return (
    <div id="wishes-all">
      <h2 className="font-serif text-xl text-ink">คำอวยพรทั้งหมด</h2>
      <p className="mt-1 text-[13px] leading-5 text-muted-foreground">เลื่อนการ์ดเพื่ออ่านข้อความเต็ม</p>
      <ul className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {ordered.map((wish) => (
          <li
            key={wish.id}
            className="w-[86%] max-w-sm shrink-0 snap-start rounded-2xl border border-[#e0b85a] bg-[#fffaf0] px-4 py-3"
          >
            <p className="text-[15px] font-semibold text-[#7a2438]">{wish.from}</p>
            <p className="mt-1 text-base leading-relaxed break-words whitespace-pre-wrap text-[#1c1612]">{wish.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
