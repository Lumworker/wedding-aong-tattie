# Excel database

ไฟล์ `wedding.xlsx` จะถูกสร้างอัตโนมัติเมื่อมีการบันทึกครั้งแรก

## ชีต

### `ผู้ลงทะเบียน`
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

### `ความคิดเห็น`
| คอลัมน์ | ความหมาย |
|---|---|
| id | รหัสข้อความ |
| from | ชื่อผู้ส่ง |
| text | ข้อความอวยพร |
| partyPhone | เบอร์ของคณะ |
| createdAt | เวลาที่ส่ง |
