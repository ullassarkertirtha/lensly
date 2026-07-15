const API = {
    async getProducts() {
        const cached = sessionStorage.getItem('ll_products')
        if (cached) return JSON.parse(cached)
        const res = await fetch('/api/products')
        const data = await res.json()
        sessionStorage.setItem('ll_products', JSON.stringify(data))
        return data
    },
    async getLiveProducts() {
        const res = await fetch('/api/products?live=true')
        return res.json()
    },
    async getOffers() {
        const now = Date.now()
        const cached = sessionStorage.getItem('ll_offers')
        if (cached) {
            const { data, time } = JSON.parse(cached)
            if (now - time < 30000) return data
        }
        const res = await fetch('/api/offers')
        const data = await res.json()
        sessionStorage.setItem('ll_offers', JSON.stringify({ data, time: now }))
        return data
    },
    async getProduct(id) {
        const cached = sessionStorage.getItem('ll_products')
        if (cached) {
            const parsed = JSON.parse(cached)
            const prod = parsed.products.find(p => p.folder_id === id)
            if (prod) return { product: prod }
        }
        const res = await fetch(`/api/products/${id}`)
        return res.json()
    },
    async getLiveProduct(id) {
        const res = await fetch(`/api/products/${id}?live=true`)
        return res.json()
    },
    async getReviews(productId) {
        const res = await fetch(`/api/reviews?product_id=${encodeURIComponent(productId)}`)
        return res.json()
    },
    async submitReview({ product_id, rating, comment }) {
        const accessToken = localStorage.getItem('ll_token')
        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ product_id, rating, comment }),
        })
        return res.json()
    },
    async editReview({ review_id, rating, comment }) {
        const accessToken = localStorage.getItem('ll_token')
        const res = await fetch('/api/reviews', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ review_id, rating, comment }),
        })
        return res.json()
    },
    async deleteReview({ review_id }) {
        const accessToken = localStorage.getItem('ll_token')
        const res = await fetch('/api/reviews', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ review_id }),
        })
        return res.json()
    },
    async placeOrder(data) {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return res.json()
    },
    async getOrder(orderId) {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`)
        return res.json()
    },
    async login({ email, password }) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        return res.json()
    },
    async signup({ name, email, password }) {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        })
        return res.json()
    },
    async forgotPassword({ email }) {
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
        return res.json()
    },
    async requestConsultation(data) {
        const res = await fetch('/api/consultations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return res.json()
    },
    // More endpoints added here as features grow.
}