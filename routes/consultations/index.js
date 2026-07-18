const { requestConsultation, getAllConsultations } = require('../../controllers/consultationController')
const { requireAdmin } = require('../../middleware/adminOnly')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'POST') {
      // Public — customers submit consultation requests without admin auth
      const result = await requestConsultation(req.body)
      return res.status(200).json(result)
    }
    if (req.method === 'GET') {
      // Admin-only — returns all consultations with phone/email data
      try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }
      const consultations = await getAllConsultations()
      return res.status(200).json({ consultations })
    }
    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Consultation error:', err)
    res.status(400).json({ error: err.message })
  }
}
