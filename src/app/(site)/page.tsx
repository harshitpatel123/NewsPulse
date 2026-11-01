import Link from 'next/link'
import { brand } from '../../config/brand'

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B1F3A',
      gap: '24px',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#C79A2B', fontSize: '48px', margin: 0, letterSpacing: '-1px' }}>
          {brand.name}
        </h1>
        <p style={{ color: '#FAF8F3', opacity: 0.7, marginTop: '8px', fontSize: '18px' }}>
          {brand.tagline}
        </p>
      </div>
      <Link
        href="/admin"
        style={{
          background: '#C79A2B',
          color: '#0B1F3A',
          padding: '12px 32px',
          borderRadius: '6px',
          fontWeight: 700,
          fontSize: '16px',
          textDecoration: 'none',
          letterSpacing: '0.02em',
        }}
      >
        Go to Dashboard →
      </Link>
    </main>
  )
}
