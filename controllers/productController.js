const { getTabData } = require('../services/googleSheetsSync')

async function getAllProducts(forceLive = false) {
  const rows = await getTabData('stock', forceLive)
  const active = rows.filter(r => r.active === 'TRUE')

  return active.map(row => ({
    folder_id: row.folder_id,
    name: row.name,
    description: row.description,
    gender: row.gender,
    color: row.color,
    price: Number(row.price),
    stock: Number(row.stock),
  }))
}

async function getProductById(folderId) {
  const products = await getAllProducts()
  return products.find(p => p.folder_id === folderId) || null
}

module.exports = { getAllProducts, getProductById }
