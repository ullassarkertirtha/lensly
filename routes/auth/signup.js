const { signup } = require('../../controllers/authController')

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' })
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' })
        }

        await signup({ name, email, password })
        res.status(201).json({ ok: true })
    } catch (err) {
        res.status(400).json({ error: err.message })
    }
}