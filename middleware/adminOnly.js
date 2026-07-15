const jwt = require('jsonwebtoken')

// Usage in a protected route:
//   const { requireAdmin } = require('../../../middleware/adminOnly')
//   module.exports = async (req, res) => {
//     try { requireAdmin(req) } catch (err) { return res.status(401).json({ error: err.message }) }
//     ...
//   }

function requireAdmin(req) {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) throw new Error('Missing admin session token')

    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET)
        if (decoded.role !== 'admin') throw new Error('Not an admin session')
        return decoded
    } catch {
        throw new Error('Invalid or expired admin session')
    }
}

module.exports = { requireAdmin }