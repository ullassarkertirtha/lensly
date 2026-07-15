const { login } = require('../../controllers/authController')

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' })
        }

        const result = await login({ email, password })
        res.status(200).json(result)
    } catch (err) {
        // Supabase returns "Invalid login credentials" — pass it through as-is.
        res.status(401).json({ error: err.message })
    }
}