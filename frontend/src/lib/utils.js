export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Registration-time Risk Score tier styling — shared between Register.jsx
// (where the tier is computed) and PatientHistory.jsx (where it's displayed).
export const RISK_TIER_STYLES = {
  'Low risk profile': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Moderate risk profile': 'bg-amber-50 text-amber-800 border-amber-200',
  'Elevated risk profile': 'bg-rose-50 text-rose-800 border-rose-200'
}

export function getRiskTierFromScore(totalScore) {
  if (totalScore <= 5) return 'Low risk profile'
  if (totalScore <= 10) return 'Moderate risk profile'
  return 'Elevated risk profile'
}
