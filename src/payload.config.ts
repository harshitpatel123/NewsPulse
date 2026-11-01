import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Articles } from './collections/Articles/index'
import { BreakingNews } from './globals/BreakingNews'
import { brand } from './config/brand'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ` – ${brand.name} CMS`,
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: '@/components/admin/Logo#Logo',
        Icon: '@/components/admin/Icon#Icon',
      },
      beforeNavLinks: ['@/components/admin/ReviewQueueLink#ReviewQueueLink'],
    },
  },

  collections: [Users, Media, Categories, Articles],

  globals: [BreakingNews],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),

  sharp,

  // Disable GraphQL — REST is enough and reduces attack surface
  graphQL: {
    disable: true,
  },

  // Only allow requests from our own server URL
  cors: [serverURL],
  csrf: [serverURL],

  // Limit relationship population depth to avoid over-fetching
  maxDepth: 3,

  // 5 MB upload limit
  upload: {
    limits: {
      fileSize: 5_000_000,
    },
  },

  // HTTP-only deployment — do not set secure: true or login will break
  cookiePrefix: 'newspulse',

  plugins: [],
})
