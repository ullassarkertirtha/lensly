const AdminAuth = {
  setSession(token, username) {
    localStorage.setItem('ll_admin_token', token)
    localStorage.setItem('ll_admin_username', username)
  },
  
  getToken() {
    return localStorage.getItem('ll_admin_token')
  },
  
  getUsername() {
    return localStorage.getItem('ll_admin_username')
  },
  
  isLoggedIn() {
    return !!this.getToken()
  },
  
  logout() {
    localStorage.removeItem('ll_admin_token')
    localStorage.removeItem('ll_admin_username')
    location.href = '/admin/login.html'
  },
  
  requireLogin() {
    if (!this.isLoggedIn()) {
      location.href = '/admin/login.html'
    }
  },
  
  async fetch(url, options = {}) {
    const token = this.getToken()
    const headers = {
      ...options.headers,
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const res = await fetch(url, { ...options, headers })
    
    if (res.status === 401) {
      this.logout()
      throw new Error('Unauthorized')
    }
    
    return res
  }
}