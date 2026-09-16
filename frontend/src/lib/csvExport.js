// Pure client-side CSV export helpers — build a CSV string, wrap it in a
// Blob, and trigger a download via a temporary object URL. No server round
// trip; works entirely from data already loaded in the page.

function escapeCsvField(value) {
  const str = value == null ? '' : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatDateForFilename(date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
}

// ─────────────────────────────────────────────
// SYSTEM ANALYTICS CSV
// ─────────────────────────────────────────────

const PHC_COLUMNS = [
  { key: 'name', header: 'PHC Facility' },
  { key: 'workers', header: 'Workers' },
  { key: 'screenings', header: 'Screenings' },
  { key: 'referrals', header: 'Referrals' },
  { key: 'attendance', header: 'Attendance' },
  { key: 'confidence', header: 'AI Confidence (%)' },
  { key: 'status', header: 'Status' },
]

/**
 * Exports a two-section analytics CSV: KPI summary, then PHC breakdown.
 * @param {string|number} timeframe  the selected date-range window in days (e.g. '30')
 * @param {Record<string, string|number>} kpiData  metric label -> value
 * @param {Array<object>} phcData  rows shaped like { name, workers, screenings, referrals, attendance, confidence, status }
 * @returns {string} the filename that was downloaded
 */
export function exportAnalyticsToCSV(timeframe, kpiData, phcData) {
  const now = new Date()
  const metadata = [
    '# DRISHTI-AI System Analytics Export',
    `# Generated: ${now.toLocaleString('en-GB')}`,
    `# Timeframe: Last ${timeframe} Days`,
    '# Report Type: Clinical Operations Governance Summary',
  ]

  const kpiSection = [
    '',
    '# SECTION 1: KEY PERFORMANCE INDICATORS',
    'Metric,Value',
    ...Object.entries(kpiData).map(([label, value]) => `${escapeCsvField(label)},${escapeCsvField(value)}`)
  ]

  const phcSection = [
    '',
    '# SECTION 2: PHC PERFORMANCE BREAKDOWN',
    PHC_COLUMNS.map(c => escapeCsvField(c.header)).join(','),
    ...phcData.map(row => PHC_COLUMNS.map(c => escapeCsvField(row[c.key])).join(','))
  ]

  const csvContent = [...metadata, ...kpiSection, ...phcSection].join('\r\n')
  const filename = `DRISHTI_System_Analytics_${timeframe}D_${formatDateForFilename(now)}.csv`
  downloadCsv(csvContent, filename)
  return filename
}
