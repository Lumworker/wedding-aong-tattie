/** Cache-bust for the welcome props and the replaced chapel. */
const VERSION = "1"

export const CHURCH_SPRITE = `/sprites/church.png?v=${VERSION}`

export const WELCOME_PROPS = {
  arch: `/sprites/flower-arch.png?v=${VERSION}`,
  groundFlowers: `/sprites/ground-flowers.png?v=${VERSION}`,
  bell: `/sprites/wedding-bell.png?v=${VERSION}`,
  tree: `/sprites/tree.png?v=${VERSION}`,
  treeAlt: `/sprites/tree-2.png?v=${VERSION}`,
  silhouette: `/sprites/church-silhouette.png?v=${VERSION}`,
} as const
