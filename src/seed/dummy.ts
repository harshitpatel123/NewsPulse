// Dummy-data seed: 2 editors, 20 articles, 20 images, breaking news
// Idempotent — safe to run twice
import 'dotenv/config'

import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../payload.config'
import { generatePlaceholderImage } from './images'
import { ARTICLE_BODIES } from './dummy-content'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const MEDIA_DIR = path.resolve(__dirname, '../../media')

const ARTICLES = [
  { n: 1,  title: 'How a SIP Works: Investing ₹5,000 a Month',                                                                                                    category: 'personal-finance', status: 'published', featured: true,  author: 'editor1' },
  { n: 2,  title: "IPO Allotment Explained: Why You Didn't Get Shares",                                                                                            category: 'ipo',              status: 'published', featured: false, author: 'editor2' },
  { n: 3,  title: 'Reading a Quarterly Result in Five Minutes',                                                                                                    category: 'companies',        status: 'published', featured: false, author: 'editor1' },
  { n: 4,  title: 'What Rising Inflation Means for Your Savings',                                                                                                  category: 'economy',          status: 'published', featured: false, author: 'editor2' },
  { n: 5,  title: 'How Small Manufacturers in Gujarat Manage Cash Flow',                                                                                           category: 'gujarat',          status: 'published', featured: false, author: 'editor1' },
  { n: 6,  title: 'Fixed Deposits vs Debt Funds: A Plain Comparison',                                                                                             category: 'personal-finance', status: 'published', featured: false, author: 'editor2' },
  { n: 7,  title: 'How Stock Market Circuit Limits Work',                                                                                                          category: 'market',           status: 'published', featured: false, author: 'editor1' },
  { n: 8,  title: 'Understanding the Repo Rate',                                                                                                                   category: 'economy',          status: 'published', featured: false, author: 'editor2' },
  { n: 9,  title: 'Why Global Oil Prices Move Local Fuel Costs',                                                                                                   category: 'global',           status: 'published', featured: false, author: 'editor1' },
  { n: 10, title: 'How to Read a Government Budget Document',                                                                                                      category: 'india',            status: 'published', featured: false, author: 'editor2' },
  { n: 11, title: "A Beginner's Guide to Mutual Fund Expense Ratios",                                                                                              category: 'market',           status: 'published', featured: false, author: 'editor1' },
  { n: 12, title: 'How Startups Raise Funds: Seed to Series A',                                                                                                   category: 'companies',        status: 'published', featured: false, author: 'editor2' },
  { n: 13, title: 'Understanding Credit Scores and Why They Matter',                                                                                               category: 'personal-finance', status: 'in_review', featured: false, author: 'editor1' },
  { n: 14, title: 'What Is a Rights Issue?',                                                                                                                       category: 'market',           status: 'in_review', featured: false, author: 'editor2' },
  { n: 15, title: 'Trade Deficits Explained with a Simple Example',                                                                                               category: 'global',           status: 'in_review', featured: false, author: 'editor1' },
  { n: 16, title: '"Five Stocks Guaranteed to Double"',                                                                                                            category: 'market',           status: 'rejected',  featured: false, author: 'editor2', rejectionReason: 'The headline makes an unverifiable guarantee. Rewrite as an educational piece about risk and diversification.' },
  { n: 17, title: '"Gujarat\'s Next Big Export Boom"',                                                                                                             category: 'gujarat',          status: 'rejected',  featured: false, author: 'editor1', rejectionReason: 'No sources or figures. Add attributed data before resubmitting.' },
  { n: 18, title: 'Gold vs Equity: A Long-Term Comparison',                                                                                                       category: 'personal-finance', status: 'draft',     featured: false, author: 'editor2' },
  { n: 19, title: 'How GST Input Credit Works for Small Sellers',                                                                                                  category: 'india',            status: 'draft',     featured: false, author: 'editor1' },
  { n: 20, title: 'A title at the maximum length to test layout wrapping in cards and article pages across all screen sizes and breakpoints in the NewsPulse CMS', category: 'companies',        status: 'draft',     featured: false, author: 'editor2' },
] as const

const SUMMARIES = [
  'A step-by-step guide to how Systematic Investment Plans work, why rupee-cost averaging matters, and how to start your first SIP with as little as ₹500 a month.',
  'The IPO allotment process is a computerised lottery. Here is why applying from multiple accounts does not help, and what you can do to improve your odds.',
  'Quarterly results can be intimidating. Focus on five key numbers — revenue, EBITDA, PAT, EPS and debt-to-equity — and you will have the full picture in minutes.',
  'When inflation runs above your savings account interest rate, your purchasing power shrinks. Here is how to find instruments that actually beat inflation.',
  'A fictional Surat textile unit illustrates the cash-flow mismatch that affects thousands of small manufacturers, and the tools available to bridge the gap.',
  'After the 2023 tax change, the case for debt mutual funds over fixed deposits has weakened for most retail investors. Here is a plain comparison of both options.',
  'Circuit breakers pause trading when markets move too sharply. Here is how index-level and stock-level circuit limits work, and what they mean for investors.',
  "The repo rate is the RBI's primary tool for controlling inflation. When it rises, your home loan EMI rises too. Here is the full transmission chain explained.",
  'India imports 85% of its crude oil. When global prices rise, the impact on your petrol pump is real but cushioned by taxes and refining margins.',
  'The Union Budget runs to hundreds of pages. Here are the five steps and five documents that give you everything you need to know in under an hour.',
  'The Total Expense Ratio is deducted silently from your mutual fund NAV every day. Over 20 years, a 1% difference in TER can cost you lakhs of rupees.',
  'Most funded startups go through bootstrapping, angel, seed and Series A rounds. Here is what investors look for at each stage and how equity dilution works.',
  'Your credit score determines whether you get a loan and at what rate. Here is what goes into the score and how to check and improve yours.',
  'A rights issue lets a company raise capital from existing shareholders at a discount. Here are your three choices and how to decide which one makes sense.',
  'India runs a structural trade deficit because it imports far more crude oil and electronics than it exports. Here is a simple explanation of what that means.',
  'This article makes unverifiable guarantees about stock performance and has been sent back for revision.',
  "This article makes broad claims about Gujarat's export growth without citing any sources or data.",
  'Gold and equity behave differently across market cycles. This article compares their long-term returns in rupee terms. (Work in progress.)',
  'Under GST, registered businesses can claim credit for tax paid on purchases. Here is how input tax credit works for a small retailer, with a worked example.',
  'This article tests how the admin UI and public site handle article titles that are exactly 160 characters long — the maximum allowed by the content model.',
]

const CATEGORY_DEFS = [
  { name: 'Market',           slug: 'market',           description: 'Stock markets, indices, trading and investment trends.',                          order: 1 },
  { name: 'Economy',          slug: 'economy',          description: 'Macroeconomic indicators, policy and fiscal analysis.',                           order: 2 },
  { name: 'Companies',        slug: 'companies',        description: 'Corporate news, earnings, mergers and strategy.',                                 order: 3 },
  { name: 'IPO',              slug: 'ipo',              description: 'Initial public offerings, allotments and grey market premiums.',                  order: 4 },
  { name: 'Personal Finance', slug: 'personal-finance', description: 'Savings, investments, tax and financial planning for individuals.',               order: 5 },
  { name: 'Gujarat',          slug: 'gujarat',          description: 'Business and economic news from Gujarat.',                                        order: 6 },
  { name: 'India',            slug: 'india',            description: 'National business and policy news.',                                              order: 7 },
  { name: 'Global',           slug: 'global',           description: 'International markets, trade and global economic developments.',                  order: 8 },
]

const CAT_NAME_MAP: Record<string, string> = {
  'market': 'Market', 'economy': 'Economy', 'companies': 'Companies',
  'ipo': 'IPO', 'personal-finance': 'Personal Finance',
  'gujarat': 'Gujarat', 'india': 'India', 'global': 'Global',
}

async function seed() {
  const payload = await getPayload({ config })

  const adminEmail    = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  const e1Email       = process.env.SEED_EDITOR1_EMAIL
  const e1Password    = process.env.SEED_EDITOR1_PASSWORD
  const e2Email       = process.env.SEED_EDITOR2_EMAIL
  const e2Password    = process.env.SEED_EDITOR2_PASSWORD

  if (!adminEmail || !adminPassword || !e1Email || !e1Password || !e2Email || !e2Password) {
    console.error('ERROR: All seed env vars must be set. Check .env.example.')
    process.exit(1)
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminRes = await payload.find({ collection: 'users', where: { email: { equals: adminEmail } }, limit: 1, depth: 0, overrideAccess: true })
  let adminId: number
  if (adminRes.totalDocs === 0) {
    const a = await payload.create({ collection: 'users', data: { email: adminEmail, password: adminPassword, displayName: 'Site Admin', role: 'admin' }, overrideAccess: true })
    adminId = a.id
    console.log(`✓ Admin: ${adminEmail}`)
  } else {
    adminId = adminRes.docs[0].id
    console.log(`  Admin exists: ${adminEmail}`)
  }

  // ── Categories ────────────────────────────────────────────────────────────
  const catMap: Record<string, number> = {}
  for (const cat of CATEGORY_DEFS) {
    const res = await payload.find({ collection: 'categories', where: { slug: { equals: cat.slug } }, limit: 1, depth: 0, overrideAccess: true })
    if (res.totalDocs === 0) {
      const c = await payload.create({ collection: 'categories', data: cat, overrideAccess: true, context: { disableRevalidate: true } })
      catMap[cat.slug] = c.id
      console.log(`✓ Category: ${cat.name}`)
    } else {
      catMap[cat.slug] = res.docs[0].id
      console.log(`  Category exists: ${cat.name}`)
    }
  }

  // ── Editors ───────────────────────────────────────────────────────────────
  async function ensureEditor(email: string, password: string, displayName: string, bio: string) {
    const res = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
    if (res.totalDocs === 0) {
      const u = await payload.create({ collection: 'users', data: { email, password, displayName, bio, role: 'editor' }, overrideAccess: true })
      console.log(`✓ Editor: ${email}`)
      return u.id
    }
    console.log(`  Editor exists: ${email}`)
    return res.docs[0].id
  }

  const e1Id = await ensureEditor(e1Email, e1Password, 'Aarav Mehta', 'Business journalist covering markets, personal finance and the Gujarat economy.')
  const e2Id = await ensureEditor(e2Email, e2Password, 'Nisha Shah', 'Chartered accountant turned financial writer. Specialises in IPOs and corporate finance.')
  const authorMap: Record<string, number> = { editor1: e1Id, editor2: e2Id }

  // ── Images ────────────────────────────────────────────────────────────────
  const mediaIds: number[] = []
  for (const art of ARTICLES) {
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { contains: `article-${String(art.n).padStart(2, '0')}-` } },
      limit: 1, depth: 0, overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      mediaIds.push(existing.docs[0].id)
      console.log(`  Image exists: article ${art.n}`)
      continue
    }
    const catName = CAT_NAME_MAP[art.category] ?? art.category
    const imgPath = await generatePlaceholderImage(catName, art.n, MEDIA_DIR)
    const fs = await import('fs')
    const fileBuffer = fs.readFileSync(imgPath)
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${catName} illustration for article ${art.n}`, caption: `Placeholder image — ${catName}` },
      file: { data: fileBuffer, mimetype: 'image/jpeg', name: path.basename(imgPath), size: fileBuffer.length },
      overrideAccess: true,
    })
    mediaIds.push(media.id)
    console.log(`✓ Image: article ${art.n}`)
  }

  // ── Articles ──────────────────────────────────────────────────────────────
  const now = Date.now()
  const DAY = 86_400_000

  for (let i = 0; i < ARTICLES.length; i++) {
    const art = ARTICLES[i]
    const existing = await payload.find({ collection: 'articles', where: { title: { equals: art.title } }, limit: 1, depth: 0, overrideAccess: true })
    if (existing.totalDocs > 0) {
      console.log(`  Article exists: ${art.n}`)
      continue
    }

    const authorId   = authorMap[art.author]
    const categoryId = catMap[art.category]
    const mediaId    = mediaIds[i]
    const body       = ARTICLE_BODIES[i]
    const summary    = SUMMARIES[i]

    const publishedAt = art.status === 'published' ? new Date(now - (i * 2 + 1) * DAY).toISOString() : undefined
    const submittedAt = ['published', 'in_review', 'rejected'].includes(art.status) ? new Date(now - (i * 2 + 3) * DAY).toISOString() : undefined
    const reviewedAt  = ['published', 'rejected'].includes(art.status) ? new Date(now - (i * 2 + 2) * DAY).toISOString() : undefined

    const reviewLog: { action: string; by: string; at: string; reason?: string }[] = []
    if (submittedAt) reviewLog.push({ action: 'submitted', by: String(authorId), at: submittedAt })
    if (art.status === 'published' && reviewedAt) reviewLog.push({ action: 'published', by: String(adminId), at: reviewedAt })
    if (art.status === 'rejected' && reviewedAt) {
      const reason = 'rejectionReason' in art ? art.rejectionReason : undefined
      reviewLog.push({ action: 'rejected', by: String(adminId), at: reviewedAt, reason })
    }

    const rejectionReason = 'rejectionReason' in art ? art.rejectionReason : undefined

    // Local API with overrideAccess bypasses relationship type constraints
    await (payload.create as (opts: Record<string, unknown>) => Promise<unknown>)({
      collection: 'articles',
      data: {
        title: art.title, summary, body,
        heroImage: mediaId, category: categoryId, author: authorId,
        workflowStatus: art.status,
        isFeatured: art.featured,
        publishedAt, submittedAt,
        reviewedBy: reviewedAt ? String(adminId) : undefined,
        reviewedAt, rejectionReason, reviewLog,
      },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    console.log(`✓ Article ${art.n}: ${art.title.slice(0, 55)} [${art.status}]`)
  }

  // ── Breaking News ─────────────────────────────────────────────────────────
  const ipoRes = await payload.find({ collection: 'articles', where: { title: { contains: 'IPO Allotment Explained' } }, limit: 1, depth: 0, overrideAccess: true })
  const ipoId = ipoRes.docs[0]?.id ?? null
  const adminUser = await payload.findByID({ collection: 'users', id: adminId, depth: 0, overrideAccess: true })

  await payload.updateGlobal({
    slug: 'breaking-news',
    user: adminUser,
    data: {
      enabled: true,
      items: [
        { headline: 'RBI holds repo rate steady at 6.5% in latest MPC meeting', article: ipoId, expiresAt: null },
        { headline: 'Sensex crosses 80,000 for the first time in history', expiresAt: null },
        { headline: 'This item has expired and should not appear on the site', expiresAt: new Date(Date.now() - DAY).toISOString() },
      ],
    },
    overrideAccess: true,
    context: { disableRevalidate: true },
  })
  console.log('✓ Breaking News (3 items, 1 expired)')
  console.log('\n✅ Dummy seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(JSON.stringify(err?.data?.errors ?? err, null, 2))
  process.exit(1)
})
