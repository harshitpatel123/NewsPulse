'use client'
import { brand } from '../../config/brand'

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="4" fill="#0B1F3A" />
        <text x="5" y="20" fontFamily="serif" fontSize="16" fontWeight="bold" fill="#C79A2B">N</text>
      </svg>
      <span style={{ fontWeight: 700, fontSize: '16px', color: '#0B1F3A', letterSpacing: '-0.02em' }}>
        {brand.name}
      </span>
    </div>
  )
}

export default Logo
