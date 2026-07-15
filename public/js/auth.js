const Auth = {
    getUser() {
        try {
            const u = localStorage.getItem('ll_user')
            return u ? JSON.parse(u) : null
        } catch { return null }
    },
    setUser(user) {
        localStorage.setItem('ll_user', JSON.stringify(user))
    },
    logout() {
        localStorage.removeItem('ll_user')
        localStorage.removeItem('ll_token')
        // Signal that this was an explicit logout — login.html will use this
        // to kill the Supabase session instead of auto-signing back in.
        localStorage.setItem('ll_logged_out', '1')
        window.location.href = '/'
    },
    isLoggedIn() {
        return !!this.getUser()
    },
}