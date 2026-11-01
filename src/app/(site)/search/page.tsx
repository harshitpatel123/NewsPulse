import Link from 'next/link'
import { searchArticles, getCategories, getBreakingNews } from '../../../lib/queries'
import { SiteHeader } from '../../../components/site/SiteHeader'
import { BreakingTicker } from '../../../components/site/BreakingTicker'
import { Pagination } from '../../../components/site/Pagination'
import { formatDate } from '../../../lib/dates'
import { copy } from '../../../config/copy'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export const metadata = { title: 'Search' }

export default async function SearchPage({ searchParams }: Props) {
  const { q = '', page: pageStr } = await searchParams
  const term = q.trim()
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)

  const [categories, breaking] = await Promise.all([getCategories(), getBreakingNews()])

  let articles: Awaited<ReturnType<typeof searchArticles>>['articles'] = []
  let totalPages = 0
  let validationMsg = ''

  if (term.length > 80) {
    validationMsg = copy.search.tooLong
  } else if (term.length > 0) {
    const result = await searchArticles(term, page)
    articles = result.articles
    totalPages = result.totalPages
  }

  return (
    <>
      <BreakingTicker data={breaking} />
      <SiteHeader categories={categories} />
      <main id="main-content">
        <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
          <h1 className="section-heading" style={{ marginBottom: '1.5rem' }}>Search</h1>

          <form className="search-page-form" role="search" method="GET" action="/search">
            <label htmlFor="search-input" className="sr-only">{copy.search.placeholder}</label>
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={term}
              className="search-page-input"
              placeholder={copy.search.placeholder}
              maxLength={80}
              autoFocus
            />
            <button type="submit" className="search-page-btn">Search</button>
          </form>

          {validationMsg && (
            <p role="alert" style={{ color: 'var(--breaking)', marginBottom: '1rem' }}>{validationMsg}</p>
          )}

          {term.length > 0 && articles.length === 0 && !validationMsg && (
            <p style={{ color: 'var(--muted)' }}>
              {copy.search.noResults} &ldquo;<strong>{term}</strong>&rdquo;
            </p>
          )}

          {articles.length > 0 && (
            <>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Results for &ldquo;<strong>{term}</strong>&rdquo;
              </p>
              <div className="search-results-list">
                {articles.map((a) => (
                  <article key={a.id} className="search-result-item">
                    <Link href={`/article/${a.slug}`} className="search-result-title">{a.title}</Link>
                    <p className="search-result-summary">{a.summary}</p>
                    <div className="search-result-meta">
                      <span>{a.category.name}</span>
                      <span>·</span>
                      <span>{a.author.displayName}</span>
                      <span>·</span>
                      <time dateTime={a.publishedAt ?? undefined}>{formatDate(a.publishedAt)}</time>
                    </div>
                  </article>
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                buildHref={(p) => `/search?q=${encodeURIComponent(term)}&page=${p}`}
              />
            </>
          )}
        </div>
      </main>
    </>
  )
}
