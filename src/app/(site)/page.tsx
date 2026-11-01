import Link from 'next/link'
import { getHome, getCategories, getBreakingNews } from '../../lib/queries'
import { SiteHeader } from '../../components/site/SiteHeader'
import { BreakingTicker } from '../../components/site/BreakingTicker'
import { ArticleCard } from '../../components/site/ArticleCard'
import { copy } from '../../config/copy'
import { EmptyState } from '../../components/site/EmptyState'

export const revalidate = 300

export default async function HomePage() {
  const [{ hero, topStories, latest, byCategory }, categories, breaking] = await Promise.all([
    getHome(),
    getCategories(),
    getBreakingNews(),
  ])

  return (
    <>
      <BreakingTicker data={breaking} />
      <SiteHeader categories={categories} />
      <main id="main-content">
        <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '1rem' }}>

          {!hero && topStories.length === 0 && latest.length === 0 && (
            <EmptyState heading={copy.home.emptyHeading} body={copy.home.emptyBody} />
          )}

          {/* Hero */}
          {hero && (
            <section className="home-hero" aria-labelledby="hero-heading">
              <h1 id="hero-heading" className="section-heading">{copy.home.topStories}</h1>
              <ArticleCard article={hero} variant="hero" />
            </section>
          )}

          {/* Top stories grid */}
          {topStories.length > 0 && (
            <section className="home-section" aria-label="More top stories">
              <div className="grid-4">
                {topStories.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="standard" />
                ))}
              </div>
            </section>
          )}

          {/* Latest news */}
          {latest.length > 0 && (
            <section className="home-section" aria-labelledby="latest-heading">
              <h2 id="latest-heading" className="section-heading">{copy.home.latestNews}</h2>
              <div className="grid-3">
                {latest.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="standard" />
                ))}
              </div>
            </section>
          )}

          {/* By category */}
          {byCategory.filter((bc) => bc.articles.length > 0).length > 0 && (
            <section className="home-section" aria-label="News by category">
              <div className="by-category-grid">
                {byCategory
                  .filter((bc) => bc.articles.length > 0)
                  .map((bc) => (
                    <div key={bc.category.id} className="by-category-section">
                      <h2 className="section-heading">
                        {bc.category.name}
                        <Link href={`/category/${bc.category.slug}`} className="section-heading__link">
                          {copy.home.viewAll} →
                        </Link>
                      </h2>
                      <div className="related-list">
                        {bc.articles.map((a) => (
                          <ArticleCard key={a.id} article={a} variant="compact" />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </>
  )
}
