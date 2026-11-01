import { ArticleCard } from './ArticleCard'
import { copy } from '../../config/copy'
import type { ArticleCardDTO } from '../../lib/queries'

export function RelatedArticles({ articles }: { articles: ArticleCardDTO[] }) {
  if (articles.length === 0) return null
  return (
    <section aria-labelledby="related-heading" className="sidebar-section">
      <h2 className="section-heading" id="related-heading" style={{ fontSize: '1rem' }}>
        {copy.article.relatedArticles}
      </h2>
      <div className="related-list">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} variant="compact" />
        ))}
      </div>
    </section>
  )
}
