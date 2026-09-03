const { analyzeFaceAndSuggest } = require('../../controllers/geminiFaceScanController')
const { requireUser } = require('../../middleware/userAuth')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let user
  try {
    user = await requireUser(req)
  } catch (err) {
    return res.status(401).json({ error: err.message })
  }

  try {
    const result = await analyzeFaceAndSuggest({
      image: req.body.image,
      gender: req.body.gender,
      user
    })
    res.status(200).json(result)
  } catch (err) {
    console.error('Face scan suggest error:', err)
    // Send 400 for expected errors like rate limits, 500 for unhandled
    res.status(400).json({ error: err.message })
  }
}