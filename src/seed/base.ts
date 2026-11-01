// Essential seed: admin user, 8 categories, empty breaking news
// Run with: npm run seed
// Idempotent — safe to run twice
import 'dotenv/config'

import { getPayload } from 'payload'
import config from '../payload.config'

const CATEGORIES = [
  { name: 'Market', slug: 'market', description: 'Stock markets, indices, trading and investment trends.', order: 1 },
  { name: 'Economy', slug: 'economy', description: 'Macroeconomic indicators, policy and fiscal analysis.', order: 2 },
  { name: 'Companies', slug: 'companies', description: 'Corporate news, earnings, mergers and strategy.', order: 3 },
  { name: 'IPO', slug: 'ipo', description: 'Initial public offerings, allotments and grey market premiums.', order: 4 },
  { name: 'Personal Finance', slug: 'personal-finance', description: 'Savings, investments, tax and financial planning for individuals.', order: 5 },
  { name: 'Gujarat', slug: 'gujarat', description: 'Business and economic news from Gujarat.', order: 6 },
  { name: 'India', slug: 'india', description: 'National business and policy news.', order: 7 },
  { name: 'Global', slug: 'global', description: 'International markets, trade and global economic developments.', order: 8 },
]

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  // ── Admin user ──────────────────────────────────────────────────────────────
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: adminEmail,
        password: adminPassword,
        displayName: 'Site Admin',
        role: 'admin',
      },
      overrideAccess: true,
    })
    console.log(`✓ Admin created: ${adminEmail}`)
  } else {
    console.log(`  Admin already exists: ${adminEmail}`)
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  for (const cat of CATEGORIES) {
    const exists = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (exists.totalDocs === 0) {
      await payload.create({
        collection: 'categories',
        data: cat,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
      console.log(`✓ Category: ${cat.name}`)
    } else {
      console.log(`  Category exists: ${cat.name}`)
    }
  }

  // ── Breaking News global ────────────────────────────────────────────────────
  try {
    await payload.updateGlobal({
      slug: 'breaking-news',
      data: { enabled: false, items: [] },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    console.log('✓ Breaking News global initialised')
  } catch {
    console.log('  Breaking News global already set')
  }

  console.log('\n✅ Essential seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
