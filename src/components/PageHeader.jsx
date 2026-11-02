export default function PageHeader({ title, subtitle, aside }) {
  return (
    <header className="page-head d-flex justify-content-between align-items-end gap-3">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="text-muted mb-0 small">{subtitle}</p>}
      </div>
      {aside}
    </header>
  )
}
