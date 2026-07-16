const { adminLogin } = require('../../controllers/authController')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { username, password } = req.body
    const result = await adminLogin({ username, password })
    res.status(200).json(result)
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}
