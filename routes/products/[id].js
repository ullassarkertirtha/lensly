const { getProductById, getAllProducts } = require('../../controllers/productController')
const { updateProduct } = require('../../controllers/stockController')
const { requireAdmin } = require('../../middleware/adminOnly')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      if (req.query.live === 'true') {
        const products = await getAllProducts(true) // bypass cache — stock re-check before add-to-cart
        const product = products.find(p => p.folder_id === id)
        return res.status(200).json({ product: product || null })
      }
      const product = await getProductById(id)
      return res.status(200).json({ product })
    }

    if (req.method === 'PUT') {
      // Admin inline edit
      try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }
      const updates = req.body
      if (!updates || !Object.keys(updates).length) {
        return res.status(400).json({ error: 'No update fields provided' })
      }
      await updateProduct(id, updates)
      return res.status(200).json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Product [id] error:', err)
    res.status(500).json({ error: err.message || 'Failed' })
  }
}