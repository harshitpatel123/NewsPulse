import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { isAdmin, isLoggedIn } from '../access/index'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Editorial',
  },
  access: {
    // Public read — browsers must load images anonymously (documented exception)
    read: () => true,
    create: isLoggedIn,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const articles = await req.payload.find({
          collection: 'articles',
          where: { heroImage: { equals: id } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (articles.totalDocs > 0) {
          const title = articles.docs[0]?.title ?? 'an article'
          throw new APIError(
            `This image is used as the hero image in "${title}". Remove it from the article before deleting.`,
            400,
            undefined,
            true,
          )
        }
      },
    ],
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 800, height: undefined, position: 'centre' },
      { name: 'hero', width: 1600, height: undefined, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      required: false,
    },
  ],
}
