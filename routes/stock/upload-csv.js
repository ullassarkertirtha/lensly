const { parseCSV } = require('../../services/csvParser')
const { bulkUploadStock } = require('../../controllers/stockController')
const { requireAdmin } = require('../../middleware/adminOnly')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }

  try {
    const { csv } = req.body
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'Request body must include a "csv" string field' })
    }

    const rows = parseCSV(csv)
    if (!rows.length) return res.status(400).json({ error: 'CSV has no data rows' })

    const results = await bulkUploadStock(rows)
    res.status(200).json({ success: true, ...results })
  } catch (err) {
    console.error('CSV upload error:', err)
    res.status(400).json({ error: err.message })
  }
}
