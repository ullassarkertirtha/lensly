const supabase = require('../models/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Email/password sign-up — name is stored in user_metadata.
// On success the caller is redirected to /login.html?registered=true.
async function signup({ name, email, password }) {
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        email_confirm: true,
    })

    if (error) throw new Error(error.message)
    return { user_id: data.user.id }
}

// Email/password login — returns the session token + a safe user object.
// The token is stored client-side as ll_token and sent on review submissions.
async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) throw new Error(error.message)

    const user = data.user
    return {
        token: data.session.access_token,
        user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
        },
    }
}

// Sends a Supabase password reset email. The RESET_PASSWORD_URL env var
// tells Supabase where to redirect the user after clicking the email link.
async function forgotPassword({ email }) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.RESET_PASSWORD_URL || 'https://lens-ly.vercel.app/reset-password.html',
    })
    if (error) throw new Error(error.message)
}

// ── Admin login ──────────────────────────────────────────────────────────
// Admins are NOT Supabase Auth users — they live in a separate `admins`
// table with a bcrypt-hashed password, manually inserted via the Supabase
// dashboard (see scripts/hash-password.js). On success we issue our own
// short-lived JWT signed with ADMIN_JWT_SECRET, verified by
// middleware/adminOnly.js on every protected admin route.
async function adminLogin({ username, password }) {
    if (!username || !password) throw new Error('Username and password are required.')

    const { data: admin, error } = await supabase
        .from('admins')
        .select('id, username, password_hash')
        .eq('username', username)
        .single()

    // Same generic error whether the username doesn't exist or the password
    // is wrong — don't let an attacker enumerate valid usernames.
    if (error || !admin) throw new Error('Invalid username or password.')

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) throw new Error('Invalid username or password.')

    const token = jwt.sign(
        { admin_id: admin.id, username: admin.username, role: 'admin' },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '8h' }
    )

    return { token, username: admin.username }
}

module.exports = { signup, login, forgotPassword, adminLogin }
