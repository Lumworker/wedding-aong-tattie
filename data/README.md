# Wedding data storage

## Local development

ไฟล์ `wedding.xlsx` จะถูกสร้างอัตโนมัติเมื่อมีการบันทึกครั้งแรกในโฟลเดอร์นี้ (ใช้เมื่อยังไม่ได้ตั้ง Google service account)

### ชีต

#### `ผู้ลงทะเบียน`
| คอลัมน์ | ความหมาย |
|---|---|
| phone | เบอร์โทรผู้ลงทะเบียน |
| guestId | รหัสแขก |
| name | ชื่อ |
| gender | male / female / other |
| ageGroup | adult / child |
| attendance | attending / unsure |
| side | groom / bride |
| isCompanion | true = ผู้ติดตาม |
| updatedAt | เวลาอัปเดตล่าสุด |

#### `ความคิดเห็น`
| คอลัมน์ | ความหมาย |
|---|---|
| id | รหัสข้อความ |
| from | ชื่อผู้ส่ง |
| text | ข้อความอวยพร |
| partyPhone | เบอร์ของคณะ |
| createdAt | เวลาที่ส่ง |

## Production (Google Sheets)

Production เขียนลง Google Sheet  
https://docs.google.com/spreadsheets/d/1EUooI-1h01gSsCjjBObjIIgMHcwLbzlt2yM4y97aC2c/edit

ชีต `ผู้ลงทะเบียน` และ `ความคิดเห็น` จะถูกสร้าง/เติมหัวตารางอัตโนมัติเมื่อ API เขียนครั้งแรก

### ตั้งค่าบน Vercel

1. สร้าง Google Cloud service account แล้วเปิด **Google Sheets API**
2. ดาวน์โหลด JSON key ของ service account
3. **แชร์สเปรดชีต** กับอีเมล service account เป็น Editor
4. ใส่ env บน Vercel (อย่างใดอย่างหนึ่ง):

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=1EUooI-1h01gSsCjjBObjIIgMHcwLbzlt2yM4y97aC2c
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","client_email":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}
```

หรือแยกเป็น:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=1EUooI-1h01gSsCjjBObjIIgMHcwLbzlt2yM4y97aC2c
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-bot@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

5. Redeploy แล้วลอง POST `/api/parties` อีกครั้ง

ถ้ามี `GOOGLE_SERVICE_ACCOUNT_*` แอปจะใช้ Google Sheets; ถ้าไม่มี (เช่น `npm run dev` ในเครื่อง) จะใช้ `wedding.xlsx` ตามเดิม
