import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Cormorant_Garamond, Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google"
import { COUPLE, VENUE_MAP } from "@/lib/event"
import "./globals.css"

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://127.0.0.1:43123")

const shareTitle = `อ๋อง & แทตตี้ · งานมงคลสมรส ${COUPLE.dateThai}`
const shareDescription = `ขอเชิญร่วมงานมงคลสมรสของอ๋อง (${COUPLE.groomShort}) และแทตตี้ (${COUPLE.brideShort}) วันที่ ${COUPLE.dateThai} ณ ${VENUE_MAP.name} ดินแดง`

const thaiSans = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-thai-sans",
  display: "swap",
})

const thaiSerif = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-thai-serif",
  display: "swap",
})

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: shareTitle,
  description: shareDescription,
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    locale: "th_TH",
    type: "website",
    siteName: "อ๋อง & แทตตี้",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: shareTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: ["/og.png"],
  },
}

export const viewport: Viewport = {
  themeColor: "#F6F1EA",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="th"
      className={`${thaiSans.variable} ${thaiSerif.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          ข้ามไปยังเนื้อหา
        </a>
        <div id="content">{children}</div>
      </body>
    </html>
  )
}
