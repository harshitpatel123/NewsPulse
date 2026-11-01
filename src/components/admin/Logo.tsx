'use client'
import Image from 'next/image'
import { brand } from '../../config/brand'

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
      <Image
        src="/newspulse-logo.png"
        alt={brand.name}
        width={148}
        height={42}
        style={{ width: 148, height: 42, borderRadius: '5px', objectFit: 'cover' }}
        unoptimized
      />
    </div>
  )
}

export default Logo
