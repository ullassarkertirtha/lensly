const { getOrderById } = require('../../controllers/orderController')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const order = await getOrderById(req.query.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.status(200).json({ order })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load order' })
  }
}
