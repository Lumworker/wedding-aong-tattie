# wedding-aong-tattie

Thai-first wedding site for **Chonprakun Panusetgul** and **Prachayaphorn Muangphrae** (แทต) on **25 ธันวาคม 2570**.

Place it on disk at `~/aong/wedding-aong-tattie`.

Guests enter with a mobile number, register their party, then land in an animated scene: the couple stands as pixel sprites, guests who are coming walk inside as cats, and guests who cannot come cheer from outside.

## Run

```bash
mkdir -p ~/aong
git clone https://github.com/Lumworker/wedding-aong-tattie.git ~/aong/wedding-aong-tattie
cd ~/aong/wedding-aong-tattie
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

1. **เบอร์มือถือ** — enter a Thai mobile number (`06` / `08` / `09`, 10 digits). `+66` and a missing trunk `0` are accepted. The number is the account id. There is no password and no third-party auth. This is the first screen on a fresh visit.
2. **ตอบรับ** — choose how many people are in the party (1–10). For each person: name, gender, adult or child, and whether they are coming.
3. **ฉากงาน** — the animated main page. Use **แก้ไขการตอบรับ** to change the party, or **ใช้เบอร์อื่น** to switch accounts.

A return visit with the same number on this device skips the phone step and opens the scene, with the saved party restored.

## What is stored

- `localStorage` key `webding-web:session` — the current phone.
- `localStorage` key `webding-web:party:<phone>` — that party’s guests.
- Cookie `webding_phone` — a backup of the phone so a cleared session key can still be recognized. The party itself stays in `localStorage`.

A small seeded guest list (`src/lib/seed-guests.ts`) is always mixed into the scene so it is not empty during a demo. Those names are labeled **แขกตัวอย่าง** in the roster.

## Swapping in a backend

The screen reads and writes through `guestStore` in `src/lib/guest-store.ts`. That store keeps the in-memory guest list and delegates persistence to `WeddingRepository` in `src/lib/repository.ts`. Replace `createLocalWeddingRepository()` with an HTTP implementation of the same methods when a server exists. UI components do not talk to `localStorage` directly.

## Motion

Walking cats, cheering, veil sway, bells, clouds, and falling petals are CSS and Framer Motion. `prefers-reduced-motion` settles characters in place and turns off the ambient loops.
