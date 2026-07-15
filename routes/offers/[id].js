const { updateOffer } = require('../../controllers/offerController')
const { requireAdmin } = require('../../middleware/adminOnly')

// Note: despite filename [id].js, offers are keyed by offer_key.
// req.query.id is used as the offer_key value.

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') return res.status(200).end()

    try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }

    const offer_key = req.query.id
    if (!offer_key) return res.status(400).json({ error: 'offer_key is required' })

    try {
        if (req.method === 'PUT') {
            await updateOffer(offer_key, req.body)
            return res.status(200).json({ success: true })
        }

        if (req.method === 'DELETE') {
            // Soft-delete: set active to FALSE rather than removing the row
            await updateOffer(offer_key, { active: 'FALSE' })
            return res.status(200).json({ success: true })
        }

        res.status(405).json({ error: 'Method not allowed' })
    } catch (err) {
        console.error('Offer update error:', err)
        res.status(500).json({ error: err.message || 'Failed to update offer' })
    }
}
