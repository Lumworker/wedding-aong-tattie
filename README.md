# wedding-aong-tattie

Thai-first wedding site for **Chonprakun Panusetgul** (อ๋อง) and **Prachayaphorn Muangphrae** (แทต) on **25 ธันวาคม 2570**.

Place it on disk at `~/wedding-aong-tattie`.

Guests enter with a mobile number, register their party, then land in an HD-2D ceremony scene in the Octopath sense: pixel sprites on a lit diorama church, a few cats walking the aisle, the rest seated in nine pew rows (108 seats, plus standing room), and the couple alone on the sanctuary. The nave is built to hold **more than 100 guests** in one scene.

Ceremony lighting, dust, HUD panels, and altar flowers come from a CC0 subset of [Tiddybub/2d-assets](https://github.com/Tiddybub/2d-assets) (Kenney light masks, particle pack, pixel UI, and OGA flowers). Notes are in `public/assets/tiddybub/ATTRIBUTION.md`. Guest cats stay custom pixel art — that pack has no cat sprites that fit this scene.

## Run

```bash
git clone https://github.com/Lumworker/wedding-aong-tattie.git ~/wedding-aong-tattie
cd ~/wedding-aong-tattie
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
2. **ตอบรับ** — choose how many people are in the party (1–10). For each person: name, gender, adult or child, and whether they are coming. One party stays small; the church holds every attending party together.
3. **ฉากงาน** — the animated main page. Use **แก้ไขการตอบรับ** to change the party, or **ใช้เบอร์อื่น** to switch accounts.

A return visit with the same number on this device skips the phone step and opens the scene, with the saved party restored.

## What is stored

- `localStorage` key `webding-web:session` — the current phone.
- `localStorage` key `webding-web:party:<phone>` — that party’s guests.
- Cookie `webding_phone` — a backup of the phone so a cleared session key can still be recognized. The party itself stays in `localStorage`.

A seeded congregation of about 120 cats (`src/lib/seed-guests.ts`) is always mixed into the scene so the pews look full during a demo. Those names are labeled **แขกตัวอย่าง** in the roster (collapsed after the first twelve).

## Swapping in a backend

The screen reads and writes through `guestStore` in `src/lib/guest-store.ts`. That store keeps the in-memory guest list and delegates persistence to `WeddingRepository` in `src/lib/repository.ts`. Replace `createLocalWeddingRepository()` with an HTTP implementation of the same methods when a server exists. UI components do not talk to `localStorage` directly.

## Motion

The venue uses a tilt-shift diorama camera, stained-glass shafts, Kenney light cones, and a pixel HUD. A few cats walk the aisle; sitters do not run a walk loop. `prefers-reduced-motion` settles characters in place and turns off the ambient loops.
