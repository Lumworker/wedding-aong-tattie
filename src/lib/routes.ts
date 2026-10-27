export const ROUTES = {
  home: "/",
  welcome: "/welcome",
  register: "/register",
  dashboard: "/dashboard",
  story: "/story",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

/** Keep `?admin` across client navigations. */
export function withQuery(path: string, search?: string | null) {
  const raw = search?.startsWith("?") ? search.slice(1) : search
  const params = new URLSearchParams(
    raw ?? (typeof window !== "undefined" ? window.location.search : "")
  )
  if (!params.has("admin")) return path
  const value = params.get("admin")
  return value ? `${path}?admin=${encodeURIComponent(value)}` : `${path}?admin`
}
