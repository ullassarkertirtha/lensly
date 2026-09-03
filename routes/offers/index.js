const { getActiveOffers, getAllOffers, createOffer } = require('../../controllers/offerController')
const { requireAdmin } = require('../../middleware/adminOnly')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      // GET ?all=true is admin-only, plain GET is public (active offers for banner)
      if (req.query.all === 'true') {
        try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }
        const offers = await getAllOffers()
        return res.status(200).json({ offers })
      }
      const offers = await getActiveOffers()
      return res.status(200).json({ offers })
    }

    if (req.method === 'POST') {
      try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }
      await createOffer(req.body)
      return res.status(201).json({ success: true })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Offers error:', err)
    res.status(500).json({ error: err.message || 'Failed to process offers request' })
  }
}
