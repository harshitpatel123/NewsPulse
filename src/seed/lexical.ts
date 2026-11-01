// Lexical rich-text builder — creates a minimal Lexical editor state from blocks
// Each block is { type: 'paragraph'|'h2'|'h3'|'quote'|'ul'|'ol', text: string | string[] }

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }

function textNode(text: string) {
  return { type: 'text', text, version: 1 }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function heading(tag: 'h2' | 'h3', text: string) {
  return {
    type: 'heading',
    tag,
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function quote(text: string) {
  return {
    type: 'quote',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function listItem(text: string) {
  return {
    type: 'listitem',
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    value: 1,
    version: 1,
  }
}

function list(listType: 'bullet' | 'number', items: string[]) {
  return {
    type: 'list',
    listType,
    children: items.map(listItem),
    direction: 'ltr',
    format: '',
    indent: 0,
    start: 1,
    tag: listType === 'bullet' ? 'ul' : 'ol',
    version: 1,
  }
}

export function lexicalFromBlocks(blocks: Block[]): object {
  const children = blocks.map((b) => {
    switch (b.type) {
      case 'paragraph':
        return paragraph(b.text)
      case 'h2':
        return heading('h2', b.text)
      case 'h3':
        return heading('h3', b.text)
      case 'quote':
        return quote(b.text)
      case 'ul':
        return list('bullet', b.items)
      case 'ol':
        return list('number', b.items)
    }
  })

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
