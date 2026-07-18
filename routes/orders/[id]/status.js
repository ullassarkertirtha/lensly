const { updateOrderStatus } = require('../../../controllers/orderController')
const { ORDER_STATUSES } = require('../../../config/constants')
const { requireAdmin } = require('../../../middleware/adminOnly')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })
  try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }

  const { status } = req.body
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    await updateOrderStatus(req.query.id, status)
    res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update status' })
  }
}
