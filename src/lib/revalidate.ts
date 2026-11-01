import { revalidatePath } from 'next/cache'

export function safeRevalidatePath(path: string, type?: 'layout' | 'page'): void {
  try {
    if (type) {
      revalidatePath(path, type)
    } else {
      revalidatePath(path)
    }
  } catch {
    // revalidatePath throws outside a Next.js request context (e.g. seed scripts)
  }
}
