// Generates placeholder images using sharp — no downloads, no licensing issues
// Each image has a category-coloured background with the category name and article number
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const CATEGORY_COLORS: Record<string, string> = {
  Market: '#1a3a5c',
  Economy: '#2d5a27',
  Companies: '#5a2d2d',
  IPO: '#5a4a1a',
  'Personal Finance': '#2d3a5a',
  Gujarat: '#5a2d4a',
  India: '#1a4a3a',
  Global: '#3a2d5a',
}

const DEFAULT_COLOR = '#1a2a3a'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  const lr = Math.min(255, r + amount)
  const lg = Math.min(255, g + amount)
  const lb = Math.min(255, b + amount)
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}

export async function generatePlaceholderImage(
  category: string,
  articleNumber: number,
  outputDir: string,
): Promise<string> {
  const color = CATEGORY_COLORS[category] ?? DEFAULT_COLOR
  const light = lighten(color, 60)
  const { r, g, b } = hexToRgb(color)

  const width = 1200
  const height = 675

  // Build SVG with category name and article number
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${light};stop-opacity:1" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <rect x="0" y="${height - 8}" width="${width}" height="8" fill="rgba(199,154,43,0.8)"/>
  <text x="${width / 2}" y="${height / 2 - 30}" font-family="Arial, sans-serif" font-size="64"
    font-weight="bold" fill="rgba(255,255,255,0.9)" text-anchor="middle" dominant-baseline="middle">
    ${category}
  </text>
  <text x="${width / 2}" y="${height / 2 + 40}" font-family="Arial, sans-serif" font-size="32"
    fill="rgba(255,255,255,0.5)" text-anchor="middle" dominant-baseline="middle">
    Article #${articleNumber}
  </text>
  <circle cx="60" cy="60" r="30" fill="rgba(${r},${g},${b},0.3)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <text x="60" y="60" font-family="Arial, sans-serif" font-size="20" font-weight="bold"
    fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="middle">NP</text>
</svg>`

  const filename = `article-${String(articleNumber).padStart(2, '0')}-${category.toLowerCase().replace(/\s+/g, '-')}.jpg`
  const outputPath = path.join(outputDir, filename)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toFile(outputPath)

  return outputPath
}
