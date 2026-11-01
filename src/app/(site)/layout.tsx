import React from 'react'
import './styles.css'

export const metadata = {
  title: 'NewsPulse',
  description: 'Business news, clearly told.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
