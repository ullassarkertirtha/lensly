const { getAllProducts } = require('./productController')
const { getAllOrders } = require('./orderController')
const { getAllOffers } = require('./offerController')
const { getAllConsultations } = require('./consultationController')

async function getSummary() {
  const [products, orders, offers, consultations] = await Promise.all([
    getAllProducts(true), // force-live to skip cache for admin
    getAllOrders(),
    getAllOffers(),
    getAllConsultations(),
  ])

  const totalOrders = orders.length
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0)
  const activeOffers = offers.filter(o => o.active).length
  const pendingConsultations = consultations.filter(c => c.status === 'Pending').length
  const lowStock = products.filter(p => Number(p.stock) <= 3).map(p => ({
    folder_id: p.folder_id,
    name: p.name,
    stock: p.stock,
  }))

  return {
    totalOrders,
    totalRevenue,
    activeOffers,
    pendingConsultations,
    lowStock,
  }
}

module.exports = { getSummary }
