import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '../../lib/dates'
import { copy } from '../../config/copy'
import type { ArticleCardDTO } from '../../lib/queries'

interface Props {
  article: ArticleCardDTO
  variant?: 'hero' | 'standard' | 'compact'
}

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

function imgSrc(article: ArticleCardDTO, variant: string): string {
  if (!article.heroImage) return ''
  if (variant === 'hero') return article.heroImage.cardURL ?? article.heroImage.url
  if (variant === 'compact') return article.heroImage.thumbnailURL ?? article.heroImage.url
  return article.heroImage.cardURL ?? article.heroImage.url
}

export function ArticleCard({ article, variant = 'standard' }: Props) {
  const src = imgSrc(article, variant)
  const fullSrc = src.startsWith('http') ? src : `${serverURL}${src}`

  return (
    <article className={`card card--${variant}`}>
      {src && (
        <Link href={`/article/${article.slug}`} className="card__image-wrap" tabIndex={-1} aria-hidden="true">
          <Image
            src={fullSrc}
            alt={article.heroImage?.alt ?? ''}
            fill
            sizes={variant === 'compact' ? '80px' : '(max-width:768px) 100vw, 400px'}
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        </Link>
      )}
      <div className="card__body">
        <Link href={`/category/${article.category.slug}`} className="card__category">
          {article.category.name}
        </Link>
        <Link href={`/article/${article.slug}`} className="card__title">
          {article.title}
        </Link>
        {variant !== 'compact' && (
          <p className="card__summary">{article.summary}</p>
        )}
        <div className="card__meta">
          <span>{article.author.displayName}</span>
          <span className="card__meta-sep">·</span>
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </article>
  )
}
