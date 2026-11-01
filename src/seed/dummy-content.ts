import { lexicalFromBlocks } from './lexical'

// Article bodies — realistic fictional explainers, no real company facts
export const ARTICLE_BODIES = [
  // 1 — Rich-text showcase: SIP
  lexicalFromBlocks([
    { type: 'h2', text: 'What is a Systematic Investment Plan?' },
    { type: 'paragraph', text: 'A Systematic Investment Plan, or SIP, lets you invest a fixed amount in a mutual fund at regular intervals — weekly, monthly or quarterly. Instead of timing the market, you buy more units when prices are low and fewer when prices are high, a principle called rupee-cost averaging.' },
    { type: 'h3', text: 'How rupee-cost averaging works' },
    { type: 'paragraph', text: 'Imagine you invest ₹5,000 every month in a fund. In January the NAV is ₹50, so you get 100 units. In February the NAV drops to ₹40, so you get 125 units. Your average cost per unit is lower than if you had invested a lump sum at the January price.' },
    { type: 'ul', items: ['No need to time the market', 'Builds discipline through automation', 'Works with amounts as small as ₹500 per month', 'Compounding works best over long horizons'] },
    { type: 'h3', text: 'Starting your first SIP' },
    { type: 'ol', items: ['Choose a fund category that matches your risk appetite', 'Complete KYC through your broker or AMC website', 'Set up an auto-debit mandate from your bank account', 'Review performance annually, not monthly'] },
    { type: 'quote', text: 'The best time to start a SIP was yesterday. The second best time is today.' },
    { type: 'paragraph', text: 'Past performance does not guarantee future returns. Mutual fund investments are subject to market risk. Read all scheme-related documents carefully before investing.' },
  ]),

  // 2 — IPO allotment
  lexicalFromBlocks([
    { type: 'h2', text: 'Why IPO allotment feels like a lottery' },
    { type: 'paragraph', text: 'When a company lists on the stock exchange for the first time, it offers a fixed number of shares to the public. If more people apply than there are shares available — which happens with popular IPOs — SEBI rules require a computerised lottery to decide who gets shares.' },
    { type: 'paragraph', text: 'The allotment process is run by the registrar appointed by the company. Each valid application gets one lot in the draw, regardless of how many lots you applied for. Applying from multiple demat accounts in the same household does not improve your odds and can lead to rejection of all applications.' },
    { type: 'h3', text: 'Improving your chances' },
    { type: 'ul', items: ['Apply in the retail category (up to ₹2 lakh) for the lottery benefit', 'Use ASBA so funds are blocked, not debited, until allotment', 'Apply on the last day when subscription data is clearer', 'Check the grey market premium as a rough sentiment indicator'] },
    { type: 'paragraph', text: 'If you are not allotted shares, the blocked amount is released within a few working days. Listing gains are never guaranteed — some IPOs list below the issue price.' },
  ]),

  // 3 — Quarterly results
  lexicalFromBlocks([
    { type: 'h2', text: 'The five numbers that matter in a quarterly result' },
    { type: 'paragraph', text: 'Every listed company in India must publish its financial results within 45 days of the end of each quarter. The document can run to dozens of pages, but five numbers tell most of the story.' },
    { type: 'ol', items: ['Revenue from operations — the top line; is the business growing?', 'EBITDA and EBITDA margin — operating profitability before financing costs', 'Profit after tax (PAT) — the bottom line after tax', 'Earnings per share (EPS) — PAT divided by shares outstanding', 'Debt-to-equity ratio — how leveraged is the balance sheet?'] },
    { type: 'h3', text: 'Year-on-year vs quarter-on-quarter' },
    { type: 'paragraph', text: 'Always compare the same quarter of the previous year (YoY) rather than the previous quarter (QoQ) for most businesses, because many industries are seasonal. A retailer will naturally show higher revenue in Q3 (October–December) than Q2 every year.' },
    { type: 'quote', text: 'A single quarter is a data point. A trend across eight quarters is a story.' },
    { type: 'paragraph', text: 'Management commentary in the earnings call often matters as much as the numbers themselves. Listen for guidance changes and explanations of one-off items.' },
  ]),

  // 4 — Inflation and savings
  lexicalFromBlocks([
    { type: 'h2', text: 'Inflation quietly erodes your savings' },
    { type: 'paragraph', text: 'When the Consumer Price Index rises, the purchasing power of money held in a savings account falls. If your savings account pays 3.5% per year and inflation runs at 5%, your real return is negative — you can buy less with your money next year than you can today.' },
    { type: 'h3', text: 'Which savings instruments beat inflation?' },
    { type: 'ul', items: ['Equity mutual funds (long-term, higher risk)', 'Public Provident Fund — currently above CPI inflation', 'Real estate (illiquid, high entry cost)', 'Gold (hedge, not a growth asset)'] },
    { type: 'paragraph', text: 'Fixed deposits from major banks currently offer rates between 6.5% and 7.5% for one-to-three-year tenures, which is close to or slightly above recent CPI readings. The key is to not leave large sums in a zero-interest current account.' },
    { type: 'paragraph', text: 'Tax on interest income reduces the effective return further. For investors in the 30% tax bracket, a 7% FD yields an effective 4.9% post-tax — barely ahead of inflation in a high-inflation year.' },
  ]),

  // 5 — Gujarat cash flow
  lexicalFromBlocks([
    { type: 'h2', text: 'Cash flow challenges for small manufacturers' },
    { type: 'paragraph', text: 'Consider a fictional textile unit in Surat — call it Ravi Fabrics — that supplies to large garment exporters. Like many small manufacturers, it faces a structural cash-flow mismatch: raw materials must be paid for upfront, but payment from buyers arrives 60 to 90 days after delivery.' },
    { type: 'h3', text: 'Common tools to bridge the gap' },
    { type: 'ul', items: ['Invoice discounting — sell the receivable to a financier at a small discount', 'Working capital loans from banks or NBFCs', 'Negotiating shorter payment terms with buyers', 'Joining a government-backed TReDS platform for faster settlement'] },
    { type: 'paragraph', text: 'The Trade Receivables Discounting System (TReDS) was set up by RBI to help MSMEs get faster payment. Buyers above a certain turnover threshold are required to register on the platform.' },
    { type: 'quote', text: 'Profit is an opinion. Cash is a fact.' },
    { type: 'paragraph', text: 'For Ravi Fabrics and units like it, the difference between a profitable business and an insolvent one often comes down to how well the owner manages the gap between payables and receivables.' },
  ]),

  // 6 — FD vs Debt Funds
  lexicalFromBlocks([
    { type: 'h2', text: 'Fixed deposits and debt mutual funds compared' },
    { type: 'paragraph', text: 'Both fixed deposits and debt mutual funds aim to preserve capital while generating income, but they work differently and suit different investor needs.' },
    { type: 'h3', text: 'Fixed deposits' },
    { type: 'ul', items: ['Guaranteed return at a fixed rate', 'DICGC insurance up to ₹5 lakh per bank', 'Premature withdrawal penalty of 0.5–1%', 'Interest taxed as income in the year it accrues'] },
    { type: 'h3', text: 'Debt mutual funds' },
    { type: 'ul', items: ['Returns vary with interest rates and credit quality', 'No insurance; subject to credit and duration risk', 'Can be redeemed at NAV any business day', 'Gains taxed as capital gains (rate depends on holding period)'] },
    { type: 'paragraph', text: 'After the 2023 tax change, debt fund gains are taxed at the investor\'s income tax slab rate regardless of holding period, removing the indexation benefit that made them attractive for long-term investors. For most retail investors, a bank FD is now simpler and comparably taxed.' },
  ]),

  // 7 — Circuit limits
  lexicalFromBlocks([
    { type: 'h2', text: 'Circuit breakers: the stock market\'s emergency brake' },
    { type: 'paragraph', text: 'Stock exchanges use circuit limits to pause trading when prices move too sharply in a short time. The mechanism exists to prevent panic-driven crashes and give investors time to reassess.' },
    { type: 'h3', text: 'Index-level circuit breakers' },
    { type: 'paragraph', text: 'SEBI mandates market-wide halts when the Nifty 50 or Sensex moves 10%, 15% or 20% from the previous close. A 10% move triggers a 45-minute halt before 1 pm, 15 minutes between 1 pm and 2:30 pm, and no halt after 2:30 pm. A 20% move halts trading for the rest of the day.' },
    { type: 'h3', text: 'Stock-level circuit filters' },
    { type: 'ul', items: ['Most stocks have a 5%, 10% or 20% daily price band', 'Stocks in the T2T segment have a 5% band', 'F&O stocks have no individual circuit filter (index circuit applies)', 'Exchanges can tighten bands for volatile stocks'] },
    { type: 'paragraph', text: 'Circuit limits do not prevent losses — they only slow the pace of price discovery. A stock that hits its upper circuit every day for a week has still risen significantly.' },
  ]),

  // 8 — Repo rate
  lexicalFromBlocks([
    { type: 'h2', text: 'The repo rate and why it affects your EMI' },
    { type: 'paragraph', text: 'The repo rate is the interest rate at which the Reserve Bank of India lends money to commercial banks for short periods, typically overnight. When the RBI raises the repo rate, borrowing becomes more expensive for banks, and they pass that cost on to customers through higher lending rates.' },
    { type: 'h3', text: 'The transmission chain' },
    { type: 'ol', items: ['RBI raises repo rate', 'Banks\' cost of funds increases', 'Banks raise their MCLR or repo-linked lending rate', 'Home loan, car loan and business loan EMIs rise', 'Consumer spending slows, reducing demand-side inflation'] },
    { type: 'paragraph', text: 'The RBI\'s Monetary Policy Committee meets every two months to decide the repo rate. The decision is based on the inflation outlook, GDP growth and global factors such as US Federal Reserve policy and crude oil prices.' },
    { type: 'quote', text: 'Monetary policy works with long and variable lags. Rate changes today affect inflation 12 to 18 months from now.' },
  ]),

  // 9 — Oil prices
  lexicalFromBlocks([
    { type: 'h2', text: 'From Brent crude to your petrol pump' },
    { type: 'paragraph', text: 'India imports about 85% of its crude oil needs. When global oil prices rise, the cost of importing crude increases, which eventually shows up at the petrol pump — though the relationship is not immediate or one-to-one.' },
    { type: 'h3', text: 'What sits between the crude price and the pump price' },
    { type: 'ul', items: ['Refining margin — the cost of turning crude into petrol and diesel', 'Central excise duty — a fixed rupee amount per litre', 'State VAT — varies significantly by state', 'Dealer commission', 'OMC marketing margin'] },
    { type: 'paragraph', text: 'Taxes make up roughly 50–55% of the retail price of petrol in most Indian cities. This means a 10% rise in crude prices translates to roughly a 4–5% rise in the pump price, not 10%.' },
    { type: 'paragraph', text: 'The government can absorb some of the increase by cutting excise duty, as it did in 2022. Conversely, when crude prices fall, the government sometimes raises duty to maintain revenue, preventing the full benefit from reaching consumers.' },
  ]),

  // 10 — Budget document
  lexicalFromBlocks([
    { type: 'h2', text: 'Navigating the Union Budget in five steps' },
    { type: 'paragraph', text: 'The Union Budget is presented in Parliament on 1 February each year. The full document runs to hundreds of pages, but most of what matters for investors and citizens is in the Budget Speech and the Finance Bill.' },
    { type: 'ol', items: ['Read the Budget Speech highlights — the Finance Minister summarises key proposals', 'Check the fiscal deficit target — the gap between government revenue and expenditure', 'Look at capital expenditure allocation — infrastructure spending drives growth', 'Find changes to income tax slabs and deductions that affect you directly', 'Read the Finance Bill for the exact legal language of tax changes'] },
    { type: 'h3', text: 'Key documents to bookmark' },
    { type: 'ul', items: ['Budget Speech (PDF on indiabudget.gov.in)', 'Union Budget at a Glance', 'Receipts Budget', 'Expenditure Budget', 'Finance Bill'] },
    { type: 'paragraph', text: 'Markets react to the Budget within minutes of the speech, often overshooting in both directions. The actual economic impact takes months or years to materialise.' },
  ]),

  // 11 — Expense ratios
  lexicalFromBlocks([
    { type: 'h2', text: 'The silent cost of investing: expense ratios explained' },
    { type: 'paragraph', text: 'Every mutual fund charges an annual fee called the Total Expense Ratio (TER) to cover fund management, administration and distribution costs. This fee is deducted daily from the fund\'s NAV, so you never see it as a separate charge — but it compounds over time.' },
    { type: 'h3', text: 'How much does it matter?' },
    { type: 'paragraph', text: 'A 1% difference in TER may seem small, but over 20 years on a ₹10 lakh investment growing at 12% annually, a fund with 0.5% TER leaves you with roughly ₹93 lakh, while a fund with 1.5% TER leaves you with about ₹76 lakh — a difference of ₹17 lakh.' },
    { type: 'ul', items: ['Direct plans have lower TER than regular plans (no distributor commission)', 'Index funds typically have TER below 0.2%', 'Actively managed equity funds range from 0.5% to 2.25%', 'SEBI caps TER based on AUM slabs'] },
    { type: 'quote', text: 'In investing, you get what you don\'t pay for.' },
    { type: 'paragraph', text: 'Lower TER does not automatically mean better returns — a skilled active manager may justify a higher fee. But for most retail investors, low-cost index funds are a strong default choice.' },
  ]),

  // 12 — Startup funding
  lexicalFromBlocks([
    { type: 'h2', text: 'From idea to Series A: how startups raise money' },
    { type: 'paragraph', text: 'Most funded startups go through several distinct rounds before they are profitable enough to sustain themselves. Each round has a different investor profile, valuation method and use of funds.' },
    { type: 'h3', text: 'The funding ladder' },
    { type: 'ol', items: ['Bootstrapping — founders use personal savings to build an MVP', 'Friends and family — informal capital, often without formal terms', 'Angel round — individual investors write cheques of ₹25 lakh to ₹2 crore', 'Seed round — institutional seed funds, typically ₹2–10 crore', 'Series A — venture capital firms, typically ₹20–100 crore, for proven traction'] },
    { type: 'h3', text: 'What investors look for at each stage' },
    { type: 'paragraph', text: 'At the seed stage, investors bet on the team and the market size. By Series A, they want evidence of product-market fit: retention, revenue growth and unit economics that suggest the business can scale profitably.' },
    { type: 'paragraph', text: 'Equity dilution is the cost of external capital. A founder who raises ₹5 crore at a ₹20 crore post-money valuation gives up 25% of the company. Subsequent rounds dilute further, which is why founders focus on raising only what they need at each stage.' },
  ]),

  // 13 — Credit scores (in_review)
  lexicalFromBlocks([
    { type: 'h2', text: 'Your credit score: what it is and why lenders care' },
    { type: 'paragraph', text: 'A credit score is a three-digit number, typically between 300 and 900, that summarises your credit history. In India, the four licensed credit bureaus — CIBIL, Experian, Equifax and CRIF High Mark — each calculate their own score using data from banks and lenders.' },
    { type: 'h3', text: 'What goes into the score' },
    { type: 'ul', items: ['Payment history (35%) — on-time payments are the biggest factor', 'Credit utilisation (30%) — keep it below 30% of your credit limit', 'Length of credit history (15%) — older accounts help', 'Credit mix (10%) — a mix of secured and unsecured loans', 'New credit enquiries (10%) — multiple applications in a short period hurt'] },
    { type: 'paragraph', text: 'A score above 750 is generally considered good and qualifies you for the best interest rates. Below 650, lenders may reject your application or charge a higher rate to compensate for perceived risk.' },
    { type: 'paragraph', text: 'You are entitled to one free credit report per year from each bureau. Check it for errors — incorrect late-payment entries are more common than you might expect and can be disputed.' },
  ]),

  // 14 — Rights issue (in_review)
  lexicalFromBlocks([
    { type: 'h2', text: 'Rights issues: when a company asks existing shareholders for more money' },
    { type: 'paragraph', text: 'A rights issue is a way for a listed company to raise fresh capital by offering new shares to its existing shareholders at a discounted price, in proportion to their current holding. If you own 100 shares and the company announces a 1:5 rights issue, you are offered 20 new shares.' },
    { type: 'h3', text: 'Your three choices as a shareholder' },
    { type: 'ol', items: ['Subscribe — pay the issue price and receive the new shares', 'Renounce — sell your rights entitlement to another investor in the market', 'Do nothing — let the rights lapse (your stake gets diluted)'] },
    { type: 'paragraph', text: 'The rights entitlement (RE) trades on the exchange for a few days before the issue closes, so even if you do not want to subscribe, you can recover some value by selling the RE.' },
    { type: 'paragraph', text: 'Whether a rights issue is good or bad for shareholders depends on what the company plans to do with the money. Raising capital to fund growth is generally positive; raising capital to repay debt may signal financial stress.' },
  ]),

  // 15 — Trade deficits (in_review)
  lexicalFromBlocks([
    { type: 'h2', text: 'Trade deficits: a simple explanation' },
    { type: 'paragraph', text: 'A trade deficit occurs when a country imports more goods and services than it exports. For India, which imports large quantities of crude oil, electronics and gold, a trade deficit is a structural feature of the economy rather than an anomaly.' },
    { type: 'h3', text: 'A simple example' },
    { type: 'paragraph', text: 'Imagine a small town that makes excellent textiles but has no oil wells. It exports ₹100 crore of textiles but imports ₹130 crore of fuel. Its trade deficit is ₹30 crore. This is not necessarily a problem — the town is using its comparative advantage and paying for something it cannot produce efficiently.' },
    { type: 'ul', items: ['A deficit means more foreign currency is leaving than entering', 'This puts downward pressure on the rupee', 'A weaker rupee makes imports more expensive, which can worsen inflation', 'But it also makes exports cheaper, which can boost export competitiveness'] },
    { type: 'paragraph', text: 'India\'s current account deficit (which includes services and remittances, not just goods) is typically smaller than the merchandise trade deficit because India runs a large surplus in services exports, particularly IT and business process outsourcing.' },
  ]),

  // 16 — Rejected: stocks guaranteed to double
  lexicalFromBlocks([
    { type: 'h2', text: 'Five stocks that could double in value' },
    { type: 'paragraph', text: 'Every investor dreams of finding the next multibagger. Here are five stocks that analysts believe could double within the next 12 months based on their growth potential and current valuations.' },
    { type: 'paragraph', text: 'Stock A has strong fundamentals and is trading at a discount to its peers. Stock B is in a high-growth sector with a dominant market position. Stock C has recently turned profitable after years of losses.' },
    { type: 'paragraph', text: 'These picks are based on current market conditions and analyst consensus. Past performance is not indicative of future results.' },
  ]),

  // 17 — Rejected: Gujarat export boom
  lexicalFromBlocks([
    { type: 'h2', text: 'Gujarat is set for a massive export boom' },
    { type: 'paragraph', text: 'Gujarat\'s export sector is poised for explosive growth in the coming years. The state is expected to become India\'s largest exporter by 2030, driven by its world-class infrastructure and business-friendly policies.' },
    { type: 'paragraph', text: 'Industry insiders predict that exports from Gujarat will triple over the next five years. The state government has announced several new industrial corridors that will attract billions in foreign investment.' },
    { type: 'paragraph', text: 'With the new GIFT City fully operational and the Mundra port expanding capacity, Gujarat is well-positioned to capture a larger share of global trade flows.' },
  ]),

  // 18 — Draft: Gold vs Equity (short, unfinished)
  lexicalFromBlocks([
    { type: 'h2', text: 'Gold and equity: a long-term comparison' },
    { type: 'paragraph', text: 'Gold and equity are two of the most popular long-term investment options in India. They behave very differently across market cycles, which is why many financial planners recommend holding both.' },
    { type: 'paragraph', text: 'Over the last 20 years, Indian equity markets have delivered roughly 12–14% annualised returns, while gold has returned approximately 9–10% in rupee terms. However, gold tends to perform well during periods of economic uncertainty, when equity markets often fall.' },
  ]),

  // 19 — Draft: GST input credit
  lexicalFromBlocks([
    { type: 'h2', text: 'GST input tax credit: how it works for small sellers' },
    { type: 'paragraph', text: 'Under the Goods and Services Tax system, a registered business can claim credit for the GST it has already paid on its purchases. This prevents the cascading effect of tax-on-tax that existed under the old VAT regime.' },
    { type: 'h3', text: 'A simple example' },
    { type: 'paragraph', text: 'A small retailer buys goods worth ₹1,00,000 plus 18% GST (₹18,000) from a manufacturer. When the retailer sells those goods for ₹1,30,000 plus 18% GST (₹23,400), they collect ₹23,400 from the customer but only need to deposit ₹5,400 to the government — the difference between output tax and input tax credit.' },
    { type: 'ul', items: ['ITC is available only if the supplier has filed their GSTR-1', 'ITC cannot be claimed on personal expenses or blocked credits', 'Composition scheme dealers cannot claim ITC', 'ITC must be claimed within the time limit specified in the GST Act'] },
    { type: 'paragraph', text: 'The GST portal\'s GSTR-2B statement auto-populates available ITC based on your suppliers\' filings, making reconciliation easier than in the early years of GST.' },
  ]),

  // 20 — Draft: long title test
  lexicalFromBlocks([
    { type: 'h2', text: 'Testing layout with a very long title' },
    { type: 'paragraph', text: 'This article exists to verify that the admin UI and public site handle very long titles gracefully. The title is exactly 160 characters, which is the maximum allowed by the content model.' },
    { type: 'paragraph', text: 'Long titles can cause layout issues in card components, especially when combined with a hero image. This test article helps catch truncation, overflow and line-wrapping problems before they appear in production.' },
    { type: 'paragraph', text: 'The summary and body are intentionally short to keep the focus on the title rendering. A real article of this type would have a full body with multiple sections.' },
  ]),
]
