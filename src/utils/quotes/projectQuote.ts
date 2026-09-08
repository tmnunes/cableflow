import type { Quote } from '@/types/quote'

/** Latest quote linked to a project (by updatedAt, then createdAt). */
export function findLatestQuoteForProject(
  quotes: Quote[],
  projectId: string,
): Quote | undefined {
  const linked = quotes.filter((q) => q.projectId === projectId)
  if (linked.length === 0) return undefined
  return [...linked].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || a.createdAt) || 0
    const bTime = Date.parse(b.updatedAt || b.createdAt) || 0
    return bTime - aTime
  })[0]
}
