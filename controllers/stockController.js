const { getTabData, appendRow, updateRowByKey } = require('../services/googleSheetsSync')

const STOCK_COLUMNS = ['folder_id', 'name', 'description', 'gender', 'color', 'price', 'stock', 'active']

function validateRow(row) {
  if (!row.folder_id || !row.name) throw new Error(`Row missing folder_id or name: ${JSON.stringify(row)}`)
  if (isNaN(Number(row.price))) throw new Error(`Invalid price for ${row.folder_id}: "${row.price}"`)
  if (isNaN(Number(row.stock))) throw new Error(`Invalid stock for ${row.folder_id}: "${row.stock}"`)
}

// Bulk upload from CSV rows — updates existing (matched by folder_id), appends new ones
async function bulkUploadStock(rows) {
  const existing = await getTabData('stock')
  const existingIds = new Set(existing.map(r => r.folder_id))

  const results = { updated: 0, created: 0, errors: [] }

  for (const row of rows) {
    try {
      validateRow(row)
      const normalized = {
        folder_id: String(row.folder_id).trim(),
        name: String(row.name || '').trim(),
        description: String(row.description || '').trim(),
        gender: String(row.gender || '').trim(),
        color: String(row.color || '').trim(),
        price: String(Number(row.price)),
        stock: String(Number(row.stock)),
        active: (row.active === 'TRUE' || row.active === true || row.active === '1' || row.active === 1) ? 'TRUE' : 'FALSE',
      }

      if (existingIds.has(normalized.folder_id)) {
        await updateRowByKey('stock', 'folder_id', normalized.folder_id, normalized)
        results.updated++
      } else {
        await appendRow('stock', normalized)
        existingIds.add(normalized.folder_id)
        results.created++
      }
    } catch (err) {
      results.errors.push({ folder_id: row.folder_id || '?', error: err.message })
    }
  }

  return results
}

// Single product field update (admin inline edit)
async function updateProduct(folderId, updates) {
  const allowed = ['name', 'description', 'gender', 'color', 'price', 'stock', 'active']
  const safe = {}
  for (const [k, v] of Object.entries(updates)) {
    if (allowed.includes(k)) safe[k] = String(v)
  }
  if (!Object.keys(safe).length) throw new Error('No valid fields to update')
  await updateRowByKey('stock', 'folder_id', folderId, safe)
}

module.exports = { bulkUploadStock, updateProduct }
