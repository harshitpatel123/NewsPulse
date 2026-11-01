import { RichText } from '@payloadcms/richtext-lexical/react'

interface Props {
  content: unknown
}

export function RichTextRenderer({ content }: Props) {
  if (!content) return null
  return (
    <div className="prose">
      {/* @ts-expect-error — RichText accepts the raw Lexical editor state */}
      <RichText data={content} />
    </div>
  )
}
