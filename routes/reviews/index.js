const { addReview, editReview, deleteReview, getReviewsByProduct } = require('../../controllers/reviewController')
const { requireUser } = require('../../middleware/userAuth')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'POST') {
      const user = await requireUser(req)
      const review = await addReview({ ...req.body, user })
      return res.status(201).json({ review })
    }

    if (req.method === 'PATCH') {
      const user = await requireUser(req)
      const review = await editReview({ ...req.body, user })
      return res.status(200).json({ review })
    }

    if (req.method === 'DELETE') {
      const user = await requireUser(req)
      const result = await deleteReview({ ...req.body, user })
      return res.status(200).json(result)
    }

    if (req.method === 'GET') {
      const { product_id } = req.query
      if (!product_id) return res.status(400).json({ error: 'product_id required' })
      const result = await getReviewsByProduct(product_id)
      return res.status(200).json(result)
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Review error:', err)
    res.status(400).json({ error: err.message })
  }
}
