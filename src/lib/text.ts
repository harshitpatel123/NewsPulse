export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
}

// Walk a Lexical JSON tree and collect all text node values
export function lexicalToPlainText(editorState: unknown): string {
  if (!editorState || typeof editorState !== 'object') return ''
  const parts: string[] = []
  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    if (n.type === 'text' && typeof n.text === 'string') {
      parts.push(n.text)
    }
    if (Array.isArray(n.children)) {
      for (const child of n.children) walk(child)
    }
    if (Array.isArray(n.root)) {
      for (const child of n.root) walk(child)
    }
    if (n.root && typeof n.root === 'object') {
      walk(n.root)
    }
  }
  walk(editorState)
  return parts.join('')
}
