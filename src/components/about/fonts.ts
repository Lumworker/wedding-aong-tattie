import { JetBrains_Mono, Mali } from "next/font/google"

/** Code face for Aong's page only. */
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-about-mono",
  display: "swap",
})

/** Hand-lettered Thai headings for Tattie's scrapbook only. */
export const hand = Mali({
  subsets: ["thai", "latin"],
  weight: ["500", "600"],
  variable: "--font-about-hand",
  display: "swap",
})
