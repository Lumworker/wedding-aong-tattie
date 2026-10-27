# webding-web

Thai-first wedding site for **Chonprakun Panusetgul** and **Prachayaphorn Muangphrae** (แทต). The celebration is on **25 ธันวาคม 2570** at **โบสถ์แม่พระฟาติมา** (Our Lady of Fatima Church).

The first screen is the church: the couple stands at the altar, guests who are coming walk inside, and guests who cannot come cheer from the garden. Scroll down for the date, place, and event details. Phone number is asked only after **ลงทะเบียน**.

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

```bash
npm run build
npm start
```

`npm run lint` runs ESLint.

## Guest flow

1. **หน้าแรก** — full-screen animated venue. Seeded guests are already in the scene so the church is never empty.
2. **ลงทะเบียน** — the button sits under the couple’s feet. Event details (date, venue, story) are on the next screen after you scroll.
3. **เบอร์มือถือ** — asked only after that button. Thai mobiles (`06` / `08` / `09`, 10 digits). `+66` and a missing trunk `0` are accepted. The number is the account id.
4. **ตอบรับ** — how many people (1–10), then name, gender, adult or child, and whether each person is coming. Submit returns to the church with your party in the scene.

A return visit on this device keeps the scene public. **แก้ไขการตอบรับ** opens the saved party.

## What is stored

- `localStorage` key `webding-web:session` — the current phone, after someone registers.
- `localStorage` key `webding-web:party:<phone>` — that party’s guests.
- Cookie `webding_phone` — a backup of the phone so a cleared session key can still be recognized. The party itself stays in `localStorage`.

A small seeded guest list (`src/lib/seed-guests.ts`) is always mixed into the scene. Those names are labeled **แขกในฉาก** in the roster below the fold.

## Swapping in a backend

The screen reads and writes through `guestStore` in `src/lib/guest-store.ts`. That store keeps the in-memory guest list and delegates persistence to `WeddingRepository` in `src/lib/repository.ts`. Replace `createLocalWeddingRepository()` with an HTTP implementation of the same methods when a server exists. UI components do not talk to `localStorage` directly.

## Motion

Walking, cheering, veil sway, bells, clouds, and falling petals are CSS and Framer Motion. `prefers-reduced-motion` settles characters in place and turns off the ambient loops.
