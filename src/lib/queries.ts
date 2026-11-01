// All public data fetching lives here. Components never call Payload directly.
// Every query uses an explicit published filter and maps to narrow DTOs.
import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CategoryDTO {
  id: string
  name: string
  slug: string
  description?: string
  order: number
}

export interface ArticleCardDTO {
  id: string
  title: string
  slug: string
  summary: string
  publishedAt: string | null
  category: CategoryDTO
  author: { displayName: string }
  heroImage: {
    url: string
    thumbnailURL: string | null
    cardURL: string | null
    alt: string
  } | null
  isFeatured: boolean
}

export interface ArticleDetailDTO extends ArticleCardDTO {
  body: unknown
  heroImage: {
    url: string
    thumbnailURL: string | null
    cardURL: string | null
    heroURL: string | null
    alt: string
    caption?: string
  } | null
}

export interface BreakingItemDTO {
  headline: string
  articleSlug: string | null
}

export interface BreakingNewsDTO {
  enabled: boolean
  items: BreakingItemDTO[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PUBLISHED = { workflowStatus: { equals: 'published' } }

function toCardDTO(doc: Record<string, unknown>): ArticleCardDTO {
  const cat = doc.category as Record<string, unknown>
  const auth = doc.author as Record<string, unknown>
  const img = doc.heroImage as Record<string, unknown> | null
  const sizes = img?.sizes as Record<string, { url?: string }> | undefined
  return {
    id: String(doc.id),
    title: String(doc.title ?? ''),
    slug: String(doc.slug ?? ''),
    summary: String(doc.summary ?? ''),
    publishedAt: (doc.publishedAt as string) ?? null,
    isFeatured: Boolean(doc.isFeatured),
    category: {
      id: String(cat?.id ?? ''),
      name: String(cat?.name ?? ''),
      slug: String(cat?.slug ?? ''),
      description: cat?.description as string | undefined,
      order: Number(cat?.order ?? 0),
    },
    author: { displayName: String(auth?.displayName ?? '') },
    heroImage: img
      ? {
          url: String(img.url ?? ''),
          thumbnailURL: (sizes?.thumbnail?.url as string) ?? null,
          cardURL: (sizes?.card?.url as string) ?? null,
          alt: String(img.alt ?? ''),
        }
      : null,
  }
}

function toDetailDTO(doc: Record<string, unknown>): ArticleDetailDTO {
  const card = toCardDTO(doc)
  const img = doc.heroImage as Record<string, unknown> | null
  const sizes = img?.sizes as Record<string, { url?: string }> | undefined
  return {
    ...card,
    body: doc.body,
    heroImage: img
      ? {
          url: String(img.url ?? ''),
          thumbnailURL: (sizes?.thumbnail?.url as string) ?? null,
          cardURL: (sizes?.card?.url as string) ?? null,
          heroURL: (sizes?.hero?.url as string) ?? null,
          alt: String(img.alt ?? ''),
          caption: img.caption as string | undefined,
        }
      : null,
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<CategoryDTO[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'categories',
    sort: 'order',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs.map((d) => ({
    id: String(d.id),
    name: String(d.name),
    slug: String(d.slug),
    description: d.description ?? undefined,
    order: Number(d.order ?? 0),
  }))
}

export async function getHome(): Promise<{
  hero: ArticleCardDTO | null
  topStories: ArticleCardDTO[]
  latest: ArticleCardDTO[]
  byCategory: { category: CategoryDTO; articles: ArticleCardDTO[] }[]
}> {
  const payload = await getPayload({ config })

  // Hero: newest featured, fallback to newest published
  const featuredRes = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED, { isFeatured: { equals: true } }] },
    sort: '-publishedAt',
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })

  let heroDoc = featuredRes.docs[0] ?? null

  if (!heroDoc) {
    const fallback = await payload.find({
      collection: 'articles',
      where: PUBLISHED,
      sort: '-publishedAt',
      limit: 1,
      depth: 2,
      overrideAccess: true,
    })
    heroDoc = fallback.docs[0] ?? null
  }

  const hero = heroDoc ? toCardDTO(heroDoc as unknown as Record<string, unknown>) : null

  // Top stories: next 4 after hero
  const topRes = await payload.find({
    collection: 'articles',
    where: hero
      ? { and: [PUBLISHED, { id: { not_equals: hero.id } }] }
      : PUBLISHED,
    sort: '-publishedAt',
    limit: 4,
    depth: 2,
    overrideAccess: true,
  })
  const topStories = topRes.docs.map((d) => toCardDTO(d as unknown as Record<string, unknown>))

  // Latest: next 9 after top stories
  const excludeIds = [hero?.id, ...topStories.map((a) => a.id)].filter(Boolean)
  const latestRes = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED, { id: { not_in: excludeIds } }] },
    sort: '-publishedAt',
    limit: 9,
    depth: 2,
    overrideAccess: true,
  })
  const latest = latestRes.docs.map((d) => toCardDTO(d as unknown as Record<string, unknown>))

  // By category: first 4 categories, 3 articles each
  const cats = await getCategories()
  const topCats = cats.slice(0, 4)
  const byCategory = await Promise.all(
    topCats.map(async (cat) => {
      const res = await payload.find({
        collection: 'articles',
        where: { and: [PUBLISHED, { category: { equals: cat.id } }] },
        sort: '-publishedAt',
        limit: 3,
        depth: 2,
        overrideAccess: true,
      })
      return { category: cat, articles: res.docs.map((d) => toCardDTO(d as unknown as Record<string, unknown>)) }
    }),
  )

  return { hero, topStories, latest, byCategory }
}

export async function getCategoryPage(
  slug: string,
  page = 1,
): Promise<{ category: CategoryDTO | null; articles: ArticleCardDTO[]; totalPages: number }> {
  const payload = await getPayload({ config })

  const catRes = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const category = catRes.docs[0]
  if (!category) return { category: null, articles: [], totalPages: 0 }

  const res = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED, { category: { equals: category.id } }] },
    sort: '-publishedAt',
    limit: 12,
    page,
    depth: 2,
    overrideAccess: true,
  })

  return {
    category: {
      id: String(category.id),
      name: String(category.name),
      slug: String(category.slug),
      description: category.description ?? undefined,
      order: Number(category.order ?? 0),
    },
    articles: res.docs.map((d) => toCardDTO(d as unknown as Record<string, unknown>)),
    totalPages: res.totalPages,
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetailDTO | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'articles',
    where: { and: [PUBLISHED, { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })
  const doc = res.docs[0]
  if (!doc) return null
  return toDetailDTO(doc as unknown as Record<string, unknown>)
}

export async function getArticleById(id: string): Promise<ArticleDetailDTO | null> {
  const payload = await getPayload({ config })
  try {
    const doc = await payload.findByID({
      collection: 'articles',
      id,
      depth: 2,
      overrideAccess: true,
    })
    if (!doc) return null
    return toDetailDTO(doc as unknown as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function getRelatedArticles(
  currentId: string,
  categoryId: string,
): Promise<ArticleCardDTO[]> {
  const payload = await getPayload({ config })

  const sameRes = await payload.find({
    collection: 'articles',
    where: {
      and: [PUBLISHED, { category: { equals: categoryId } }, { id: { not_equals: currentId } }],
    },
    sort: '-publishedAt',
    limit: 3,
    depth: 2,
    overrideAccess: true,
  })

  const related = sameRes.docs.map((d) => toCardDTO(d as unknown as Record<string, unknown>))

  if (related.length < 3) {
    const excludeIds = [currentId, ...related.map((a) => a.id)]
    const fillRes = await payload.find({
      collection: 'articles',
      where: { and: [PUBLISHED, { id: { not_in: excludeIds } }] },
      sort: '-publishedAt',
      limit: 3 - related.length,
      depth: 2,
      overrideAccess: true,
    })
    related.push(...fillRes.docs.map((d) => toCardDTO(d as unknown as Record<string, unknown>)))
  }

  return related
}

export async function searchArticles(
  q: string,
  page = 1,
): Promise<{ articles: ArticleCardDTO[]; totalPages: number }> {
  const term = q.trim()
  if (!term) return { articles: [], totalPages: 0 }

  const payload = await getPayload({ config })

  const res = await payload.find({
    collection: 'articles',
    where: {
      and: [
        PUBLISHED,
        {
          or: [
            { title: { contains: term } },
            { summary: { contains: term } },
            { searchText: { contains: term } },
          ],
        },
      ],
    },
    sort: '-publishedAt',
    limit: 10,
    page,
    depth: 2,
    overrideAccess: true,
  })

  return {
    articles: res.docs.map((d) => toCardDTO(d as unknown as Record<string, unknown>)),
    totalPages: res.totalPages,
  }
}

export async function getBreakingNews(): Promise<BreakingNewsDTO> {
  const payload = await getPayload({ config })
  try {
    const doc = await payload.findGlobal({
      slug: 'breaking-news',
      depth: 2,
      overrideAccess: true,
    })

    if (!doc?.enabled) return { enabled: false, items: [] }

    const now = new Date()
    const items: BreakingItemDTO[] = ((doc.items as unknown[]) ?? [])
      .filter((item) => {
        const i = item as Record<string, unknown>
        if (i.expiresAt && new Date(i.expiresAt as string) < now) return false
        return true
      })
      .map((item) => {
        const i = item as Record<string, unknown>
        const article = i.article as Record<string, unknown> | null
        const isPublished = article?.workflowStatus === 'published'
        return {
          headline: String(i.headline ?? ''),
          articleSlug: isPublished ? String(article?.slug ?? '') : null,
        }
      })

    return { enabled: true, items }
  } catch {
    return { enabled: false, items: [] }
  }
}
