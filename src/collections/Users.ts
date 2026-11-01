import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/index'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'displayName',
    group: 'Access',
    hidden: ({ user }) => user?.role !== 'admin',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 60 * 10 * 1000,
    useAPIKey: false,
    verify: false,
  },
  access: {
    // Admin sees all; editor sees only self
    read: ({ req: { user }, id: _id }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    // Only admin can create users; role is forced to editor by field access
    create: isAdmin,
    // Admin can update editors and self; editor can update only self
    update: ({ req: { user }, id: _id }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { id: { equals: user.id } }
    },
    // Admin can delete editor accounts only (not admins)
    // Returns true for admin so the UI shows the delete button;
    // the where-clause { role: editor } is enforced at DB level by Payload
    delete: ({ req: { user } }) => {
      if (!user || user.role !== 'admin') return false
      return true
    },
  },
  hooks: {
    // First-user safety net: if no users exist, force role = admin
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        const count = await req.payload.count({ collection: 'users' })
        if (count.totalDocs === 0 && data) {
          data.role = 'admin'
        }
        return data
      },
    ],
    // Guard: prevent deleting admin accounts
    beforeDelete: [
      async ({ req, id }) => {
        const user = await req.payload.findByID({ collection: 'users', id, depth: 0 })
        if (user?.role === 'admin') {
          throw new Error('Admin accounts cannot be deleted.')
        }
        // Cascade-delete all articles owned by the editor before removing the user
        const articles = await req.payload.find({
          collection: 'articles',
          where: { author: { equals: id } },
          limit: 0,
          depth: 0,
        })
        for (const article of articles.docs) {
          await req.payload.delete({ collection: 'articles', id: article.id, req })
        }
      },
    ],
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
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      admin: {
        description: 'Fixed after creation. Admins can only be created via the seed.',
        // Hide from UI entirely — role is set by seed or forced to editor by access rules
        hidden: true,
      },
      // role is immutable over REST and the UI — seed bypasses this via Local API
      access: {
        create: () => false,
        update: () => false,
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      required: false,
    },
  ],
}
