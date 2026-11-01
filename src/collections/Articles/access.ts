import type { Access, FieldAccess } from 'payload'

export const articlesRead: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true
  if (user?.role === 'editor') return { author: { equals: user.id } }
  return false
}

export const articlesCreate: Access = ({ req: { user } }) => Boolean(user)

export const articlesUpdate: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { author: { equals: user.id }, workflowStatus: { in: ['draft', 'rejected'] } } as any
}

export const articlesDelete: Access = ({ req: { user } }) => user?.role === 'admin'

export const articlesReadVersions: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { 'version.author': { equals: user.id } } as any
}

export const adminOnlyField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'
export const nobodyField: FieldAccess = () => false
export const authorOrAdminField: FieldAccess = ({ req: { user }, doc }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  const authorId = typeof doc?.author === 'object' ? (doc?.author as { id: string })?.id : doc?.author
  return user.id === authorId
}
