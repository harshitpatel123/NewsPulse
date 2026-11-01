import Link from 'next/link'
import { copy } from '../../config/copy'

interface Props {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}

export function Pagination({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav className="pagination" aria-label="Pagination">
      <Link href={buildHref(page - 1)} className="pagination__btn" aria-disabled={page <= 1}>
        ← {copy.pagination.previous}
      </Link>
      <span className="pagination__info">Page {page} of {totalPages}</span>
      <Link href={buildHref(page + 1)} className="pagination__btn" aria-disabled={page >= totalPages}>
        {copy.pagination.next} →
      </Link>
    </nav>
  )
}
