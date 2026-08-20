export default function DashboardSection({title, action, children, className = ''}) {
  return <section className={`figma-panel ${className}`}><header><h2>{title}</h2>{action && <button className="panel-action">{action}</button>}</header>{children}</section>;
}
