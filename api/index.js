const express = require('express')
const app = express()

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const v = (handler) => async (req, res, next) => {
  // Merge Express route params into req.query
  const mergedQuery = { ...(req.query || {}), ...(req.params || {}) }
  Object.defineProperty(req, 'query', { value: mergedQuery, writable: true })
  
  try {
    await handler(req, res)
  } catch (err) {
    console.error('Unhandled API Error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }
}

// ── ADMIN ──
app.all('/api/admin/dashboard-summary', v(require('../routes/admin/dashboard-summary')))
app.all('/api/admin/login', v(require('../routes/admin/login')))

// ── AUTH ──
app.all('/api/auth/forgot-password', v(require('../routes/auth/forgot-password')))
app.all('/api/auth/login', v(require('../routes/auth/login')))
app.all('/api/auth/signup', v(require('../routes/auth/signup')))

// ── CONSULTATIONS ──
app.all('/api/consultations', v(require('../routes/consultations/index')))
app.all('/api/consultations/:id/cancel', v(require('../routes/consultations/[id]/cancel')))
app.all('/api/consultations/:id/status', v(require('../routes/consultations/[id]/status')))

// ── FACE SCAN ──
app.all('/api/face-scan/status', v(require('../routes/face-scan/status')))
app.all('/api/face-scan/suggest', v(require('../routes/face-scan/suggest')))

// ── OFFERS ──
app.all('/api/offers', v(require('../routes/offers/index')))
app.all('/api/offers/:id', v(require('../routes/offers/[id]')))

// ── ORDERS ──
app.all('/api/orders', v(require('../routes/orders/index')))
app.all('/api/orders/:id/cancel', v(require('../routes/orders/[id]/cancel')))
app.all('/api/orders/:id/status', v(require('../routes/orders/[id]/status')))
app.all('/api/orders/:id', v(require('../routes/orders/[id]')))

// ── PRODUCTS ──
app.all('/api/products', v(require('../routes/products/index')))
app.all('/api/products/:id', v(require('../routes/products/[id]')))

// ── REVIEWS ──
app.all('/api/reviews', v(require('../routes/reviews/index')))

// ── STOCK ──
app.all('/api/stock/upload-csv', v(require('../routes/stock/upload-csv')))

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

module.exports = app