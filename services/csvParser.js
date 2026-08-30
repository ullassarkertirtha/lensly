// Parses a CSV string into an array of objects keyed by the header row.
// Handles quoted fields (RFC 4180 subset) and trims all values.
function parseCSV(csvText) {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row')

  const headers = splitRow(lines[0])
  if (!headers.length) throw new Error('CSV header row is empty')

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i])
    if (values.every(v => !v)) continue // skip blank lines
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = (values[idx] ?? '').trim()
    })
    rows.push(obj)
  }

  return rows
}

// Splits a single CSV line respecting double-quoted fields
function splitRow(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // escaped quote inside quoted field
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

module.exports = { parseCSV }
