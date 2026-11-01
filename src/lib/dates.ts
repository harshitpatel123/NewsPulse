// Date formatting — en-IN locale, Asia/Kolkata timezone
const fmt = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    return fmt.format(new Date(date))
  } catch {
    return ''
  }
}
