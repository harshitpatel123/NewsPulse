import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '../../../../payload.config'
import { getCategories, getBreakingNews } from '../../../../lib/queries'
import { SiteHeader } from '../../../../components/site/SiteHeader'
import { BreakingTicker } from '../../../../components/site/BreakingTicker'
import { RichTextRenderer } from '../../../../components/site/RichTextRenderer'
import { formatDate } from '../../../../lib/dates'
import { copy } from '../../../../config/copy'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false } }

interface Props {
  params: Promise<{ id: string }>
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function PreviewPage({ params }: Props) {
  const { id } = await params

  // Authenticate via Payload session
  const payload = await getPayload({ config })
  const reqHeaders = await headers()
  const { user } = await payload.auth({ headers: reqHeaders })
  if (!user) notFound()

  // Fetch article with access control applied
  let doc: Record<string, unknown> | null = null
  try {
    const result = await payload.findByID({
      collection: 'articles',
      id,
      depth: 2,
      overrideAccess: false,
      user,
    })
    doc = result as unknown as Record<string, unknown>
  } catch {
    notFound()
  }
  if (!doc) notFound()

  const [categories, breaking] = await Promise.all([getCategories(), getBreakingNews()])

  // Build a minimal DTO for display (preview shows all statuses)
  const img = doc.heroImage as Record<string, unknown> | null
  const sizes = img?.sizes as Record<string, { url?: string }> | undefined
  const heroSrc = (sizes?.hero?.url ?? sizes?.card?.url ?? img?.url ?? '') as string
  const fullHeroSrc = heroSrc.startsWith('http') ? heroSrc : `${serverURL}${heroSrc}`
  const cat = doc.category as Record<string, unknown>
  const auth = doc.author as Record<string, unknown>

  return (
    <>
      <div className="preview-banner">
        {copy.preview.banner} <strong>{String(doc.workflowStatus)}</strong>
      </div>
      <BreakingTicker data={breaking} />
      <SiteHeader categories={categories} />
      <main id="main-content">
        <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
          <article style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header className="article-header">
              <span className="article-category-chip">{String(cat?.name ?? '')}</span>
              <h1 className="article-title">{String(doc.title ?? '')}</h1>
              <p className="article-summary">{String(doc.summary ?? '')}</p>
              <div className="article-meta">
                <span className="article-meta__author">{String(auth?.displayName ?? '')}</span>
                <span className="article-meta__sep">·</span>
                <time>{formatDate(doc.publishedAt as string)}</time>

              </div>
            </header>
            {fullHeroSrc && (
              <Image
                src={fullHeroSrc}
                alt={String(img?.alt ?? '')}
                width={1200}
                height={675}
                className="article-hero"
                priority
                unoptimized
              />
            )}
            <RichTextRenderer content={doc.body} />
          </article>
        </div>
      </main>
    </>
  )
}
