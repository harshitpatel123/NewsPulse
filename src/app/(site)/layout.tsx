import React from 'react'
import { Inter, Noto_Serif } from 'next/font/google'
import './styles.css'
import { brand } from '../../config/brand'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const notoSerif = Noto_Serif({
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
  weight: ['400', '700'],
})

export const metadata = {
  title: { default: brand.name, template: `%s — ${brand.name}` },
  description: brand.tagline,
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSerif.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  )
}
