export function EmptyState({ heading, body }: { heading: string; body?: string }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon" aria-hidden="true">📰</div>
      <h2 className="empty-state__heading">{heading}</h2>
      {body && <p>{body}</p>}
    </div>
  )
}
