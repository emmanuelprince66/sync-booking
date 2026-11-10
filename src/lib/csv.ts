const escapeCell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Saves rows as a .csv in the browser. */
export const downloadCsv = (filename: string, header: string[], rows: (string | number)[][]) => {
  const csv = [header, ...rows].map(row => row.map(escapeCell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
