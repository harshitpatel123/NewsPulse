import { getCategoryPage, getCategories, getBreakingNews } from '../../../../lib/queries'
import { SiteHeader } from '../../../../components/site/SiteHeader'
import { BreakingTicker } from '../../../../components/site/BreakingTicker'
import { ArticleCard } from '../../../../components/site/ArticleCard'
import { Pagination } from '../../../../components/site/Pagination'
import { EmptyState } from '../../../../components/site/EmptyState'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { category } = await getCategoryPage(slug)
  if (!category) return {}
  return {
    title: category.name,
    description: category.description ?? `Latest ${category.name} news`,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)

  const [{ category, articles, totalPages }, categories, breaking] = await Promise.all([
    getCategoryPage(slug, page),
    getCategories(),
    getBreakingNews(),
  ])

  if (!category) notFound()

  return (
    <>
      <BreakingTicker data={breaking} />
      <SiteHeader categories={categories} currentCategorySlug={slug} />
      <div className="page-header">
        <div className="container">
          <p className="page-header__eyebrow">Category</p>
          <h1 className="page-header__title">{category.name}</h1>
          {category.description && <p className="page-header__desc">{category.description}</p>}
        </div>
      </div>
      <main id="main-content">
        <div className="container" style={{ paddingBottom: '3rem' }}>
          {articles.length === 0 ? (
            <EmptyState heading={`No articles in ${category.name} yet`} />
          ) : (
            <>
              <div className="grid-3">
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="standard" />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                buildHref={(p) => `/category/${slug}?page=${p}`}
              />
            </>
          )}
        </div>
      </main>
    </>
  )
}
