const { placeOrder, getAllOrders } = require('../../controllers/orderController')
const { requireAdmin } = require('../../middleware/adminOnly')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'POST') {
      // Public — customers place orders without admin auth
      const result = await placeOrder(req.body)
      return res.status(200).json(result)
    }
    if (req.method === 'GET') {
      // Admin-only — returns all orders with customer data
      try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }
      const orders = await getAllOrders()
      return res.status(200).json({ orders })
    }
    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Order error:', err)
    res.status(400).json({ error: err.message })
  }
}
