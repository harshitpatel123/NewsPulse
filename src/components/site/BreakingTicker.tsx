import { copy } from '../../config/copy'
import type { BreakingNewsDTO } from '../../lib/queries'

export function BreakingTicker({ data }: { data: BreakingNewsDTO }) {
  if (!data.enabled || data.items.length === 0) return null

  // Duplicate items for seamless loop
  const items = [...data.items, ...data.items]

  return (
    <div className="breaking-bar" role="region" aria-label="Breaking news">
      <span className="breaking-label" aria-hidden="true">{copy.breaking.label}</span>
      <div className="breaking-track">
        <div className="breaking-marquee" aria-live="polite">
          {items.map((item, i) => (
            <span key={i} className="breaking-item">
              {item.articleSlug ? (
                <a href={`/article/${item.articleSlug}`}>{item.headline}</a>
              ) : (
                item.headline
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
