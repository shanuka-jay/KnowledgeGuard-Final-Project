import { RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, ResponsiveContainer } from 'recharts'

const INDICATORS = [
  { key: 'expertiseUniqueness',     label: 'Expertise' },
  { key: 'documentationGap',        label: 'Documentation' },
  { key: 'projectCriticality',      label: 'Project' },
  { key: 'collaborationDependency', label: 'Collaboration' },
  { key: 'tenure',                  label: 'Tenure' },
]

export default function IndicatorRadar({ selfScores = {}, managerScores = null, height = 280 }) {
  const data = INDICATORS.map(ind => ({
    indicator: ind.label,
    Self:      selfScores[ind.key]    || 0,
    Manager:   managerScores?.[ind.key] || null,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(148,163,184,0.35)" />
        <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 12, fill: '#64748b' }} />
        <Radar name="Self" dataKey="Self" stroke="#2563eb" fill="#2563eb" fillOpacity={0.18} strokeWidth={2} />
        {managerScores && (
          <Radar name="Manager" dataKey="Manager" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.14} strokeWidth={2} strokeDasharray="4 2" />
        )}
        {managerScores && <Legend />}
      </RadarChart>
    </ResponsiveContainer>
  )
}
