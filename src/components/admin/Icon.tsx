'use client'
import Image from 'next/image'
import { brand } from '../../config/brand'

export function Icon() {
  return (
    <Image
      src="/favicon.png"
      alt={brand.name}
      width={24}
      height={24}
      style={{ width: 24, height: 24, objectFit: 'contain' }}
      unoptimized
    />
  )
}

export default Icon
