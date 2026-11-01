'use client'
import { useAuth } from '@payloadcms/ui'
import Link from 'next/link'

// Matches Payload's .nav-group__toggle style exactly
const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0',
  marginBottom: '5px',
  background: 'transparent',
  border: '0',
  cursor: 'pointer',
  textAlign: 'left',
  color: 'var(--theme-elevation-400)',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  textDecoration: 'none',
  gap: '10px',
}

export function ReviewQueueLink() {
  const { user, logOut } = useAuth()
  if (!user) return null

  const handleLogOut = async () => {
    try {
      await logOut()
    } finally {
      window.location.replace('/admin/login')
    }
  }

  return (
    <div style={{ width: '100%', marginBottom: '10px' }}>
      <Link href="/" style={linkStyle}>
        View Site ↗
      </Link>

      {user.role === 'admin' && (
        <Link
          href="/admin/collections/articles?where[workflowStatus][equals]=in_review"
          style={linkStyle}
        >
          Review Queue
        </Link>
      )}

      <button
        type="button"
        onClick={handleLogOut}
        style={{ ...linkStyle, cursor: 'pointer' }}
      >
        Log Out
      </button>
    </div>
  )
}

export default ReviewQueueLink
