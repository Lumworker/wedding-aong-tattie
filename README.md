# wedding-aong-tattie

Thai-first wedding site for **Chonprakun Panusetgul** (อ๋อง) and **Prachayaphorn Muangphrae** (แทตตี้) on **5 ธันวาคม 2570**.

Place it on disk at `~/wedding-aong-tattie`.

Guests enter with a mobile number, register their party, then land in an HD-2D ceremony in front of the pixel church. Hover or tap the couple to enlarge them and open `/story`. Blessings can float over the nave. Guest names stay hidden until someone turns them on. There is no demo crowd.

## Run

```bash
git clone https://github.com/Lumworker/wedding-aong-tattie.git ~/wedding-aong-tattie
cd ~/wedding-aong-tattie
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). Add `?mock=1` to seed a practice crowd and land in the venue.

`npm start` builds a production bundle, then serves it. If you already ran `npm run build`, use `npm run start:prod` to skip the rebuild.

Do this from `~/wedding-aong-tattie` (the folder that contains this README and `package.json`). If Next warns about a `package-lock.json` in `/Users/aong`, you are either one directory too high, or a leftover lockfile sits in the home folder — this repo pins tracing to the project root so that warning should stay gone after you pull.

`npm run lint` runs ESLint.

## Guest flow

1. **เบอร์มือถือ** — Thai mobiles `06` / `08` / `09`, 10 digits. The couple illustration is a link to their story.
2. **ตอบรับ** — name, gender, adult or child, and whether they are coming (1–10 people).
3. **ฉากงาน** — after **บันทึกและเข้างาน**. Hover/tap อ๋อง or แทตตี้ for `/story`. Write a blessing in the side panel and toggle **แสดงคำอวยพร**. The map is a placeholder pin until the real address is set.

## What is stored

- `localStorage` key `webding-web:session` — the current phone.
- `localStorage` key `webding-web:party:<phone>` — that party’s guests.
- `localStorage` key `webding-web:wishes` — guest blessings.
- Cookie `webding_phone` — a backup of the phone so a cleared session key can still be recognized. The party itself stays in `localStorage`.

## Swapping in a backend

The screen reads and writes through `guestStore` in `src/lib/guest-store.ts`. That store keeps the in-memory guest list and delegates persistence to `WeddingRepository` in `src/lib/repository.ts`. Replace `createLocalWeddingRepository()` with an HTTP implementation of the same methods when a server exists. UI components do not talk to `localStorage` directly.

## Motion

The venue uses a tilt-shift diorama camera, Kenney light cones, and a pixel HUD. `prefers-reduced-motion` settles characters and shows blessings as a short static stack.
