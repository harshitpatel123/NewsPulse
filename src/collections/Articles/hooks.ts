import type { CollectionBeforeChangeHook, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { slugify, lexicalToPlainText } from '../../lib/text'
import { assertTransition, applyTransitionEffects } from '../../lib/workflow'
import type { WorkflowStatus } from '../../lib/workflow'
import { safeRevalidatePath } from '../../lib/revalidate'

export const slugHook: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc: _originalDoc }) => {
  if (operation === 'create' && !data.slug) {
    const base = data.title ? slugify(data.title as string) : `article-${Date.now()}`
    let slug = base || `article-${Date.now()}`
    // Ensure uniqueness
    let suffix = 2
    while (true) {
      const existing = await req.payload.find({
        collection: 'articles',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })
      if (existing.totalDocs === 0) break
      slug = `${base}-${suffix++}`
    }
    data.slug = slug
  }
  return data
}

export const authorHook: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' && req.user?.role === 'editor') {
    data.author = req.user.id
  }
  return data
}

export const workflowHook: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  if (!req.user) return data

  const from: WorkflowStatus | null = operation === 'create' ? null : (originalDoc?.workflowStatus ?? null)
  const to: WorkflowStatus = (data.workflowStatus ?? from ?? 'draft') as WorkflowStatus
  const role = req.user.role as 'admin' | 'editor'
  const userId = String(req.user.id)

  if (from !== to || operation === 'create') {
    assertTransition({ role, from, to, data: data as Record<string, unknown> })
    const patch = applyTransitionEffects(to, userId, originalDoc ?? {}, data as Record<string, unknown>)
    Object.assign(data, patch)
  }

  return data
}

export const derivedFieldsHook: CollectionBeforeChangeHook = ({ data }) => {
  const title = (data.title as string) ?? ''
  const summary = (data.summary as string) ?? ''
  const bodyText = lexicalToPlainText(data.body)
  data.searchText = `${title} ${summary} ${bodyText}`
  return data
}

export const afterChangeHook: CollectionAfterChangeHook = async ({ doc, previousDoc, context }) => {
  if (context?.disableRevalidate) return doc

  const wasPublished = previousDoc?.workflowStatus === 'published'
  const isPublished = doc.workflowStatus === 'published'

  if (!wasPublished && !isPublished) return doc

  safeRevalidatePath('/')

  const categorySlug = typeof doc.category === 'object' ? doc.category?.slug : null
  const prevCategorySlug = typeof previousDoc?.category === 'object' ? previousDoc?.category?.slug : null

  if (categorySlug) safeRevalidatePath(`/category/${categorySlug}`)
  if (prevCategorySlug && prevCategorySlug !== categorySlug) {
    safeRevalidatePath(`/category/${prevCategorySlug}`)
  }

  if (doc.slug) safeRevalidatePath(`/article/${doc.slug}`)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
    safeRevalidatePath(`/article/${previousDoc.slug}`)
  }

  return doc
}

export const afterDeleteHook: CollectionAfterDeleteHook = async ({ doc }) => {
  if (doc.workflowStatus !== 'published') return
  safeRevalidatePath('/')
  const categorySlug = typeof doc.category === 'object' ? doc.category?.slug : null
  if (categorySlug) safeRevalidatePath(`/category/${categorySlug}`)
  if (doc.slug) safeRevalidatePath(`/article/${doc.slug}`)
}
