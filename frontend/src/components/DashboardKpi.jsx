export default function DashboardKpi({icon, label, value, detail, tone = 'green', progress}) {
  return <article className={`figma-kpi ${tone}`}><i>{icon}</i><span>{label}</span><strong>{value}</strong><small>{detail}</small>{progress !== undefined && <div className="kpi-progress"><b style={{width:`${progress}%`}} /></div>}</article>;
}
