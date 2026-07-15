const supabase = require('../models/db')

async function requireUser(req) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Authentication required')
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
        throw new Error('Invalid or expired token')
    }

    return user
}

module.exports = { requireUser }
