const { cancelOrder } = require('../../../controllers/orderController')
const { requireAdmin } = require('../../../middleware/adminOnly')

// POST /api/orders/[id]/cancel
// Admin-only. Cancels the order, restocks items, sends cancellation email.
// Once cancelled, an order cannot be un-cancelled (enforced in the controller).
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }

  try {
    await cancelOrder(req.query.id)
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Cancel order error:', err)
    res.status(400).json({ error: err.message })
  }
}
