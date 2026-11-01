'use client'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { copy } from '../../config/copy'

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

/** Inline search bar shown in the header on desktop */
export function SearchForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() ?? ''
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <form className="search-form search-form--inline" role="search" onSubmit={handleSubmit}>
      <label htmlFor="header-search" className="sr-only">{copy.search.placeholder}</label>
      <input
        ref={inputRef}
        id="header-search"
        type="search"
        name="q"
        className="search-form__input"
        placeholder={copy.search.placeholder}
        maxLength={80}
        autoComplete="off"
      />
      <button type="submit" className="search-form__btn" aria-label="Search">
        <SearchIcon />
      </button>
    </form>
  )
}

/** Icon-only toggle button + expandable row used on mobile */
export function SearchToggle() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = inputRef.current?.value.trim() ?? ''
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setOpen(false)
  }

  function handleToggle() {
    setOpen((v) => {
      if (!v) setTimeout(() => inputRef.current?.focus(), 50)
      return !v
    })
  }

  return (
    <>
      <button
        type="button"
        className="search-toggle-btn"
        aria-label="Open search"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <SearchIcon />
      </button>
      {open && (
        <div className="search-dropdown" role="search">
          <form className="search-dropdown__form" onSubmit={handleSubmit}>
            <label htmlFor="mobile-search" className="sr-only">{copy.search.placeholder}</label>
            <input
              ref={inputRef}
              id="mobile-search"
              type="search"
              name="q"
              className="search-dropdown__input"
              placeholder={copy.search.placeholder}
              maxLength={80}
              autoComplete="off"
            />
            <button type="submit" className="search-dropdown__btn" aria-label="Search">
              <SearchIcon />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
