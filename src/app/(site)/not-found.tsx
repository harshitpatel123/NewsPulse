import Link from 'next/link'
import { copy } from '../../config/copy'

export default function NotFound() {
  return (
    <main id="main-content" className="not-found-page">
      <div className="not-found-page__code" aria-hidden="true">404</div>
      <h1 className="not-found-page__heading">{copy.notFound.heading}</h1>
      <p className="not-found-page__body">{copy.notFound.body}</p>
      <Link href="/" className="btn-primary">← Back to Home</Link>
    </main>
  )
}
