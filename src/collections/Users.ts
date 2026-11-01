import type { CollectionConfig } from 'payload'

// Auth-enabled collection. Payload provides login/logout/password hashing automatically.
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 60 * 10 * 1000, // 10 minutes in ms
    useAPIKey: false,
    verify: false,
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      label: 'Display Name',
      admin: { description: 'Shown as the article byline.' },
    },
    {
      // Two fixed roles — no Roles collection, no role management UI
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
    },
    {
      name: 'bio',
      type: 'textarea',
      required: false,
    },
  ],
}
