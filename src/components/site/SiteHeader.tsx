import Link from 'next/link'
import Image from 'next/image'
import { brand } from '../../config/brand'
import { copy } from '../../config/copy'
import { SearchForm, SearchToggle } from './SearchForm'
import { AdminOrLoginButton } from './AdminOrLoginButton'
import type { CategoryDTO } from '../../lib/queries'

interface Props {
  categories: CategoryDTO[]
  currentCategorySlug?: string
}

export function SiteHeader({ categories, currentCategorySlug }: Props) {
  return (
    <header className="site-header" role="banner">
      <div className="site-header__container">
        <div className="site-header__inner">
          <Link href="/" className="site-logo" aria-label={`${brand.name} — home`}>
            <Image
              src="/newspulse-logo.png"
              alt={brand.name}
              width={172}
              height={48}
              className="site-logo__img"
              unoptimized
              priority
            />
          </Link>

          <div className="site-header__tools">
            {/* Inline search — hidden on mobile via CSS */}
            <span className="search-inline">
              <SearchForm />
            </span>
            {/* Icon toggle search — hidden on desktop via CSS */}
            <span className="search-mobile">
              <SearchToggle />
            </span>
            <AdminOrLoginButton />
          </div>
        </div>
      </div>

      <nav className="category-nav" aria-label="Categories">
        <div className="container">
          <ul className="category-nav__list" role="list">
            <li className="category-nav__item">
              <Link href="/" aria-current={!currentCategorySlug ? 'page' : undefined}>
                {copy.nav.home}
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id} className="category-nav__item">
                <Link
                  href={`/category/${cat.slug}`}
                  aria-current={currentCategorySlug === cat.slug ? 'page' : undefined}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
