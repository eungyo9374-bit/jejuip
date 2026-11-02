export default function PageHeader({ title, subtitle }) {
  return (
    <header className="page-head">
      <h2>{title}</h2>
      {subtitle && <p className="text-muted mb-0 small">{subtitle}</p>}
    </header>
  )
}
