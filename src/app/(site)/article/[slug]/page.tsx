import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getArticleBySlug, getRelatedArticles, getCategories, getBreakingNews } from '../../../../lib/queries'
import { SiteHeader } from '../../../../components/site/SiteHeader'
import { BreakingTicker } from '../../../../components/site/BreakingTicker'
import { RichTextRenderer } from '../../../../components/site/RichTextRenderer'
import { RelatedArticles } from '../../../../components/site/RelatedArticles'
import { formatDate } from '../../../../lib/dates'
import { copy } from '../../../../config/copy'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}
  const ogImage = article.heroImage?.heroURL ?? article.heroImage?.cardURL ?? article.heroImage?.url
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: ogImage ? [{ url: ogImage.startsWith('http') ? ogImage : `${serverURL}${ogImage}` }] : [],
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: `${serverURL}/article/${slug}` },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const [related, categories, breaking] = await Promise.all([
    getRelatedArticles(article.id, article.category.id),
    getCategories(),
    getBreakingNews(),
  ])

  const heroSrc = article.heroImage?.heroURL ?? article.heroImage?.cardURL ?? article.heroImage?.url ?? ''
  const fullHeroSrc = heroSrc.startsWith('http') ? heroSrc : `${serverURL}${heroSrc}`

  return (
    <>
      <BreakingTicker data={breaking} />
      <SiteHeader categories={categories} currentCategorySlug={article.category.slug} />
      <main id="main-content">
        <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
          <div className="article-layout">
            {/* Main content */}
            <article>
              <header className="article-header">
                <Link href={`/category/${article.category.slug}`} className="article-category-chip">
                  {article.category.name}
                </Link>
                <h1 className="article-title">{article.title}</h1>
                <p className="article-summary">{article.summary}</p>
                <div className="article-meta">
                  <span className="article-meta__author">{article.author.displayName}</span>
                  <span className="article-meta__sep">·</span>
                  <time dateTime={article.publishedAt ?? undefined}>{formatDate(article.publishedAt)}</time>
                </div>
              </header>

              {fullHeroSrc && (
                <>
                  <Image
                    src={fullHeroSrc}
                    alt={article.heroImage?.alt ?? ''}
                    width={1200}
                    height={675}
                    className="article-hero"
                    priority
                    unoptimized
                  />
                  {article.heroImage?.caption && (
                    <p className="article-hero-caption">{article.heroImage.caption}</p>
                  )}
                </>
              )}

              <RichTextRenderer content={article.body} />
            </article>

            {/* Sidebar */}
            <aside className="sidebar" aria-label="Related articles">
              <RelatedArticles articles={related} />
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
