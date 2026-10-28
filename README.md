# wedding-aong-tattie

Thai-first wedding site for **Chonprakun Panusetgul** (อ๋อง) and **Prachayaphorn Muangphrae** (แทตตี้) on **5 ธันวาคม 2570**.

The ceremony date is **5 ธันวาคม 2570** (`COUPLE.dateThai` in `src/lib/event.ts`). That date was set on purpose across the invite, story, and share text. Do not mix in 25 December.

Place it on disk at `~/wedding-aong-tattie`.

Guests enter with a mobile number, register their party, then land in an HD-2D ceremony in front of the pixel church. Hover or tap the couple to enlarge them and open `/story`. Blessings can float over the nave. Guest names stay hidden until someone turns them on. A practice crowd is only there when you open `?mock=1`.

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
2. **ตอบรับ** — ชื่อที่บ่าวสาวรู้จัก, gender, and whether they are coming (1–10 people).
3. **ฉากงาน** — after **บันทึกและเข้างาน**. Hover/tap อ๋อง or แทตตี้ for `/story`. Write a blessing in the side panel and toggle **แสดงคำอวยพร**. The map in the side panel is **อาสนวิหารอัสสัมชัญ** (Assumption Cathedral), Bang Rak.

## What is stored

The browser only keeps the session:

- `localStorage` key `webding-web:session` — the current phone.
- Cookie `webding_phone` — a backup of that phone.

Parties and wishes go through `/api/parties` and `/api/wishes`.

- **Local dev** writes `data/wedding.xlsx` (gitignored).
- **Vercel** never writes that file. It reads and writes a Google Sheet when a service account is configured. Without those env vars, saves fail with a clear error instead of touching the filesystem.

Each phone is one row. The name column key stays `name`; guests see it as **ชื่อที่บ่าวสาวรู้จัก**. Beside it: side (`อ๋อง` or `แทต`), gender, attendance, `มีผู้ติดตาม` / `ไม่มีผู้ติดตาม`, and the companion count. Saving that phone again replaces the previous row, including older sheets that stored one row per guest.

## Vercel env

Set these in the Vercel project (Production and Preview):

| Variable | Required on Vercel | Purpose |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | yes | Full service-account JSON. `private_key` newlines may be escaped as `\n`. |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | no | Defaults to the project sheet `1EUooI-1h01gSsCjjBObjIIgMHcwLbzlt2yM4y97aC2c`. |
| `HOST_DASHBOARD_SECRET` | yes, for `/host` | Shared password for the host RSVP list. Leave unset to keep `/host` closed. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Absolute site URL for LINE/Facebook previews, e.g. `https://your-domain.vercel.app`. |

Alternative to the JSON blob: `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.

Share the spreadsheet with the service account email as **Editor**. The app creates tabs `ผู้ลงทะเบียน` and `ความคิดเห็น` if they are missing.

Host list: open `/host`, enter `HOST_DASHBOARD_SECRET`, then download CSV. The cookie lasts 12 hours.

## Swapping in a backend

The screen reads and writes through `guestStore` in `src/lib/guest-store.ts`. That store keeps the session and calls `WeddingRepository` in `src/lib/repository.ts`, which talks to the API routes above. UI components do not talk to `localStorage` for the guest list.

## Motion

The venue uses a tilt-shift diorama camera, Kenney light cones, and a pixel HUD. `prefers-reduced-motion` settles characters and shows blessings as a short static stack.
