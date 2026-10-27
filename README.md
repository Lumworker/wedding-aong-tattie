# wedding-aong-tattie

Thai-first wedding site for **Chonprakun Panusetgul** (อ๋อง) and **Prachayaphorn Muangphrae** (แทต) on **25 ธันวาคม 2570**.

Place it on disk at `~/wedding-aong-tattie`.

Guests enter with an invite code, register their party, then land in an HD-2D ceremony in front of the pixel church from the building sheet. Guests are the 3-tone character sprites, each recolored so people in a pew do not share a palette. A few walk the aisle; the rest sit in nine pew rows (108 seats). The couple stay on the sanctuary. The scene holds **more than 100 guests**.

Ceremony lighting, dust, HUD panels, and altar flowers come from a CC0 subset of [Tiddybub/2d-assets](https://github.com/Tiddybub/2d-assets) (Kenney light masks, particle pack, pixel UI, and OGA flowers). Notes are in `public/assets/tiddybub/ATTRIBUTION.md`. Guest cats stay custom pixel art — that pack has no cat sprites that fit this scene.

## Run

```bash
git clone https://github.com/Lumworker/wedding-aong-tattie.git ~/wedding-aong-tattie
cd ~/wedding-aong-tattie
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

`npm start` builds a production bundle, then serves it. If you already ran `npm run build`, use `npm run start:prod` to skip the rebuild.

Do this from `~/wedding-aong-tattie` (the folder that contains this README and `package.json`). If Next warns about a `package-lock.json` in `/Users/aong`, you are either one directory too high, or a leftover lockfile sits in the home folder — this repo pins tracing to the project root so that warning should stay gone after you pull.

`npm run lint` runs ESLint.

## Guest flow

1. **รหัสเข้างาน** — labeled รหัสเข้างาน. Hint: ใช้เบอร์มือถือสำหรับการลงทะเบียนและติดต่อ. The field stays empty (no sample number). Same device with a saved party skips this step and opens the scene.
2. **ตอบรับ** — choose how many people are in the party (1–10). For each person: name, gender, adult or child, and whether they are coming. One party stays small; the church holds every attending party together.
3. **ฉากงาน** — the animated main page. Use **แก้ไขการตอบรับ** to change the party, or **ใช้รหัสอื่น** to switch accounts.

A return visit with the same code on this device skips the gate and opens the scene, with the saved party restored. The code itself is not printed on the venue.

## What is stored

- `localStorage` key `webding-web:session` — the current phone.
- `localStorage` key `webding-web:party:<phone>` — that party’s guests.
- Cookie `webding_phone` — a backup of the phone so a cleared session key can still be recognized. The party itself stays in `localStorage`.

A seeded congregation of about 120 cats (`src/lib/seed-guests.ts`) is always mixed into the scene so the pews look full during a demo. Those names are labeled **แขกตัวอย่าง** in the roster (collapsed after the first twelve).

## Swapping in a backend

The screen reads and writes through `guestStore` in `src/lib/guest-store.ts`. That store keeps the in-memory guest list and delegates persistence to `WeddingRepository` in `src/lib/repository.ts`. Replace `createLocalWeddingRepository()` with an HTTP implementation of the same methods when a server exists. UI components do not talk to `localStorage` directly.

## Motion

The venue uses a tilt-shift diorama camera, stained-glass shafts, Kenney light cones, and a pixel HUD. A few cats walk the aisle; sitters do not run a walk loop. `prefers-reduced-motion` settles characters in place and turns off the ambient loops.
