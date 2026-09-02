const { cancelConsultation } = require('../../../controllers/consultationController')
const { requireAdmin } = require('../../../middleware/adminOnly')

// POST /api/consultations/[id]/cancel
// Admin-only. Marks consultation as Cancelled and sends a cancellation email.
// Once cancelled it cannot be reverted (enforced in the controller).
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }

  try {
    await cancelConsultation(req.query.id)
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('Cancel consultation error:', err)
    res.status(400).json({ error: err.message })
  }
}
