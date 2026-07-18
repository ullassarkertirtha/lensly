const { getTabData, appendRow, updateRowByKey, decrementStock } = require('../services/googleSheetsSync')
const { getAllProducts } = require('./productController')
const { getActiveOffers, applyBestOffer } = require('./offerController')
const { sendMail } = require('../services/googleAppsScriptMailer')
const { SHIPPING_FEE } = require('../config/constants')

function generateOrderId() {
  const timestamp = Date.now()
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `LL-${String(timestamp).slice(-6)}-${randomSuffix}`
}

const { sanitize } = require('../utils/sanitize')

async function buildOrderTotals(cartItems) {
  const products = await getAllProducts(true) // live stock, bypass cache
  const offers = await getActiveOffers()

  let subtotal = 0
  let isFreeShipping = false
  const lineItems = []

  for (const item of cartItems) {
    const product = products.find(p => p.folder_id === item.folder_id)
    if (!product) throw new Error(`Product ${item.folder_id} not found`)
    if (product.stock < item.qty) throw new Error(`${product.name} is out of stock`)
    if (!item.lens_type) throw new Error(`Lens type is required for ${product.name}`)

    const { finalPrice, discountLabel, isFreeShipping: freeShip } = applyBestOffer(product.price, offers)
    if (freeShip) isFreeShipping = true
    
    subtotal += finalPrice * item.qty
    lineItems.push({
      folder_id: item.folder_id,
      name: product.name,
      description: product.description,
      gender: product.gender,
      qty: item.qty,
      price: finalPrice,
      lens_type: item.lens_type,
      lens_power: item.lens_power || '',
      discountLabel,
    })
  }

  const shipping = isFreeShipping ? 0 : SHIPPING_FEE
  const discountLabel = lineItems.find(i => i.discountLabel)?.discountLabel || 'None'
  const grand_total = subtotal + shipping

  return { lineItems, subtotal, shipping, discountLabel, grand_total }
}

// Each line item's lens config is folded directly into the items string.
// Full label format: "Fossil - Black Full Rim Square (MEN) x1 @ ৳4799 [None]"
function formatItemsString(lineItems) {
  return lineItems
    .map(i => {
      const lensInfo = i.lens_power ? `${i.lens_type}, ${i.lens_power}` : i.lens_type
      const fullName = i.description
        ? `${i.name} - ${i.description} (${(i.gender || '').toUpperCase()})`
        : i.name
      return `${fullName} x${i.qty} @ ৳${i.price} [${lensInfo}]`
    })
    .join(', ')
}

async function placeOrder(body) {
  let { customer_name, customer_email, phone, address, note, cart_items } = body

  if (!customer_name || !phone || !address || !cart_items?.length) {
    throw new Error('Missing required order fields')
  }

  customer_name = sanitize(customer_name)
  address = sanitize(address)
  note = sanitize(note)

  const { lineItems, subtotal, shipping, discountLabel, grand_total } = await buildOrderTotals(cart_items)

  const order_id = generateOrderId()
  const ordered_at = new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })
  const items = formatItemsString(lineItems)

  const raw_items = JSON.stringify(cart_items.map(i => ({ folder_id: i.folder_id, qty: i.qty })))

  await appendRow('orders', {
    order_id,
    customer_name,
    email: customer_email,
    phone,
    address,
    note: note || '',
    items,
    subtotal,
    shipping,
    discount: discountLabel,
    grand_total,
    status: 'Pending',
    ordered_at,
    raw_items,
  })

  try {
    await decrementStock(cart_items)
  } catch (err) {
    console.error(`Failed to decrement stock for order ${order_id}:`, err)
    try {
      await updateOrderStatus(order_id, 'Error: Stock Sync Failed')
    } catch (e) {
      console.error(`Also failed to mark order ${order_id} as error:`, e)
    }
    throw new Error('Order placed, but stock sync failed. Administrator has been notified.')
  }

  try {
    await sendMail({
      type: 'order_confirmation',
      order_id,
      customer_name,
      customer_email,
      items,
      shipping,
      grand_total,
      ordered_at,
    })
  } catch (err) {
    console.error(`Failed to send email for order ${order_id}:`, err)
  }

  return { order_id }
}

async function getOrderById(orderId) {
  const rows = await getTabData('orders')
  return rows.find(o => o.order_id === orderId) || null
}

async function getAllOrders() {
  const rows = await getTabData('orders')
  // Sort latest first — ordered_at is a locale string so we parse it for comparison
  return rows.slice().sort((a, b) => {
    const da = new Date(a.ordered_at)
    const db = new Date(b.ordered_at)
    if (isNaN(da) || isNaN(db)) return 0
    return db - da
  })
}

async function updateOrderStatus(orderId, status) {
  await updateRowByKey('orders', 'order_id', orderId, { status })
}

// ── Cancel an order ──────────────────────────────────────────────────────────
// 1. Verifies the order exists and is not already Cancelled.
// 2. Parses the raw_items JSON to accurately restock each product by folder_id.
// 3. Marks the order as Cancelled in the sheet.
// 4. Fires an order_cancellation email (Apps Script webhook)
async function cancelOrder(orderId) {
  const order = await getOrderById(orderId)
  if (!order) throw new Error(`Order ${orderId} not found`)
  if (order.status === 'Cancelled') throw new Error('Order is already cancelled')

  // ── Parse raw_items string to restore stock ─────────────────────────────
  let parsed = []
  try {
    if (order.raw_items) {
      parsed = JSON.parse(order.raw_items)
    }
  } catch (err) {
    console.error('Failed to parse raw_items for order:', orderId, err)
  }

  if (parsed.length) {
    const stockRows = await getTabData('stock')
    for (const { folder_id, qty } of parsed) {
      if (!folder_id || !qty) continue
      const row = stockRows.find(r => r.folder_id === folder_id)
      if (!row) continue
      const newStock = Number(row.stock) + Number(qty)
      await updateRowByKey('stock', 'folder_id', folder_id, { stock: String(newStock) })
    }
  }

  // ── Mark as Cancelled ─────────────────────────────────────────────────────
  await updateRowByKey('orders', 'order_id', orderId, { status: 'Cancelled' })

  // ── Send cancellation email ───
  await sendMail({
    type: 'order_cancellation',
    order_id: orderId,
    customer_name: order.customer_name,
    customer_email: order.email,
    phone: order.phone,
    items: order.items,
    shipping: order.shipping,
    grand_total: order.grand_total,
  })
}

module.exports = { placeOrder, getOrderById, getAllOrders, updateOrderStatus, cancelOrder }