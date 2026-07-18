const { getSummary } = require('../../controllers/dashboardController')
const { requireAdmin } = require('../../middleware/adminOnly')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    requireAdmin(req)
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }

  try {
    const summary = await getSummary()
    res.status(200).json(summary)
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ error: 'Failed to load dashboard summary' })
  }
}