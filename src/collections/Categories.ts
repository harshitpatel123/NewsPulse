import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { isAdmin, isLoggedIn } from '../access/index'
import { slugify } from '../lib/text'
import { safeRevalidatePath } from '../lib/revalidate'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
    group: 'Editorial',
  },
  defaultSort: 'order',
  access: {
    read: isLoggedIn,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const articles = await req.payload.find({
          collection: 'articles',
          where: { category: { equals: id } },
          limit: 1,
          depth: 0,
        })
        if (articles.totalDocs > 0) {
          throw new APIError(
            'Cannot delete a category that still has articles. Reassign or delete the articles first.',
            400,
            undefined,
            true,
          )
        }
      },
    ],
    afterChange: [
      async ({ doc }) => {
        safeRevalidatePath('/')
        safeRevalidatePath(`/category/${doc.slug}`)
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Auto-generated from name if left empty.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) return slugify(data.name as string)
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Controls navigation order. Lower numbers appear first.' },
    },
  ],
}
