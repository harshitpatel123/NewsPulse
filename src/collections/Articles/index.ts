import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  articlesRead, articlesCreate, articlesUpdate, articlesDelete, articlesReadVersions,
  adminOnlyField, nobodyField, authorOrAdminField,
} from './access'
import { slugHook, authorHook, workflowHook, derivedFieldsHook, afterChangeHook, afterDeleteHook } from './hooks'

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'author', 'workflowStatus', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    group: 'Editorial',
    preview: (doc) => `${serverURL}/preview/${doc.id}`,
  },
  versions: { maxPerDoc: 25 },
  access: {
    read: articlesRead,
    create: articlesCreate,
    update: articlesUpdate,
    delete: articlesDelete,
    readVersions: articlesReadVersions,
  },
  hooks: {
    beforeChange: [slugHook, authorHook, workflowHook, derivedFieldsHook],
    afterChange: [afterChangeHook],
    afterDelete: [afterDeleteHook],
  },
  fields: [
    // --- Content fields ---
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Auto-generated from title. Editable by admin only after first save.' },
      access: { update: adminOnlyField },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      maxLength: 280,
      admin: { description: 'Used as the card blurb and meta description.' },
    },
    { name: 'body', type: 'richText', required: true, editor: lexicalEditor() },
    { name: 'heroImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'category', type: 'relationship', relationTo: 'categories', required: true },

    // --- Workflow and editorial fields (sidebar) ---
    {
      name: 'workflowStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Published', value: 'published' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Set to "In Review" when ready for an admin to review it.',
      },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Filled by admin when rejecting. Visible to the author.',
        condition: (data) => data?.workflowStatus === 'rejected',
      },
      access: { read: authorOrAdminField, update: adminOnlyField },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Auto-set to the creating user. Editable by admin only.',
      },
      access: { update: adminOnlyField },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Featured articles appear as the hero on the home page.',
      },
      access: { update: adminOnlyField },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', description: 'Auto-set on first publish.', readOnly: true },
      access: { update: adminOnlyField },
    },
    {
      name: 'submittedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true, description: 'Auto-set when submitted for review.' },
      access: { read: authorOrAdminField, update: nobodyField },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
      access: { read: authorOrAdminField, update: nobodyField },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
      access: { read: authorOrAdminField, update: nobodyField },
    },
    {
      name: 'reviewLog',
      type: 'array',
      admin: { position: 'sidebar', readOnly: true },
      access: { read: authorOrAdminField, update: nobodyField },
      fields: [
        { name: 'action', type: 'text' },
        { name: 'by', type: 'text' },
        { name: 'at', type: 'text' },
        { name: 'reason', type: 'text' },
      ],
    },

    // --- Derived fields ---
    {
      name: 'readingTime',
      type: 'number',
      defaultValue: 1,
      admin: { position: 'sidebar', readOnly: true },
      access: { update: nobodyField },
    },
    {
      name: 'searchText',
      type: 'textarea',
      admin: { hidden: true },
      access: { read: nobodyField, update: nobodyField },
    },
    {
      name: 'views',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
      access: { update: adminOnlyField },
    },
  ],
}
