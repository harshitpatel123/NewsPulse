import type { GlobalConfig } from 'payload'
import { isAdmin, isLoggedIn } from '../access/index'
import { safeRevalidatePath } from '../lib/revalidate'

export const BreakingNews: GlobalConfig = {
  slug: 'breaking-news',
  admin: {
    group: 'Settings',
    description: 'Controls the breaking news ticker shown at the top of the site.',
  },
  access: {
    read: isLoggedIn,
    update: isAdmin,
  },
  hooks: {
    afterChange: [
      async ({ context }) => {
        if (context?.disableRevalidate) return
        safeRevalidatePath('/', 'layout')
      },
    ],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Master on/off switch for the ticker.' },
    },
    {
      name: 'items',
      type: 'array',
      maxRows: 5,
      validate: (value, { data }: { data: any }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (data?.enabled && (!value || (value as unknown[]).length === 0)) {
          return 'At least one item is required when the ticker is enabled.'
        }
        return true
      },
      fields: [
        {
          name: 'headline',
          type: 'text',
          required: true,
          maxLength: 140,
        },
        {
          name: 'article',
          type: 'relationship',
          relationTo: 'articles',
          required: false,
          filterOptions: {
            workflowStatus: { equals: 'published' },
          },
        },
        {
          name: 'expiresAt',
          type: 'date',
          required: false,
          admin: { description: 'Item is hidden automatically after this date.' },
        },
      ],
    },
  ],
}
