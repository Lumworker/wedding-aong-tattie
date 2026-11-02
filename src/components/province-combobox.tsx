"use client"

import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronDown } from "lucide-react"
import { PROVINCES } from "@/lib/plate"

const ITEMS = [...PROVINCES] as string[]

/** Province picker you can type into: filters as you type, or open the list and pick. */
export function ProvinceCombobox({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (province: string) => void
}) {
  return (
    <Combobox.Root
      items={ITEMS}
      value={value || null}
      onValueChange={(next) => {
        if (typeof next === "string" && next) onChange(next)
      }}
      autoHighlight
    >
      <Combobox.InputGroup className="relative mt-1.5 flex h-12 items-center rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <Combobox.Input
          id={id}
          placeholder="พิมพ์ชื่อจังหวัด"
          className="h-full w-full min-w-0 rounded-lg bg-transparent pr-10 pl-3 text-base outline-none placeholder:text-muted-foreground"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Combobox.Trigger
          aria-label="เปิดรายชื่อจังหวัด"
          className="absolute right-0 flex h-full w-10 items-center justify-center text-muted-foreground"
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner className="z-50 outline-none" sideOffset={4}>
          <Combobox.Popup className="w-[var(--anchor-width)] min-w-48 max-w-[var(--available-width)] rounded-lg border border-border bg-white text-ink shadow-[0_12px_32px_-12px_rgba(43,38,33,0.35)]">
            <Combobox.Empty>
              <div className="px-3 py-3 text-sm text-muted-foreground">ไม่พบจังหวัดนี้</div>
            </Combobox.Empty>
            <Combobox.List className="max-h-[min(16rem,var(--available-height))] overflow-y-auto overscroll-contain py-1 outline-0 data-empty:p-0">
              {(province: string) => (
                <Combobox.Item
                  key={province}
                  value={province}
                  className="grid min-h-11 cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 px-3 text-[15px] outline-none select-none data-highlighted:bg-[#F3ECE2]"
                >
                  <Combobox.ItemIndicator className="col-start-1 text-[#86663A]">
                    <Check className="size-4" aria-hidden="true" />
                  </Combobox.ItemIndicator>
                  <span className="col-start-2">{province}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
