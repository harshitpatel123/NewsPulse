import type { Access, AccessArgs } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'

export const isEditor: Access = ({ req: { user } }) => user?.role === 'editor'

export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user)

export const isSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false
  return user.id === id
}

// Returns a Payload where-clause if the user is an editor, true if admin, false if anonymous
export const ownsDoc = ({ req: { user } }: AccessArgs) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { author: { equals: user.id } }
}
