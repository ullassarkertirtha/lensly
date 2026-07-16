const { getAllProducts } = require('../../controllers/productController')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const products = await getAllProducts()
    res.status(200).json({ products })
  } catch (err) {
    console.error('Products error:', err)
    res.status(500).json({ error: 'Failed to load products' })
  }
}
