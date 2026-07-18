// Must match config/constants.js SHIPPING_FEE on the backend — the server
// always recalculates the authoritative total at order placement, this is display only.
const SHIPPING_FEE = 100

let currentOffers = []

// Pre-fill name & email if the user is logged in
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser()
  if (user) {
    const nameEl = document.getElementById('f-name')
    const emailEl = document.getElementById('f-email')
    if (nameEl && user.name) nameEl.value = user.name
    if (emailEl && user.email) emailEl.value = user.email
  }
})
async function init() {
  const cart = Cart.get()
  if (cart.length === 0) { location.href = '/cart.html'; return }

  const offerData = await API.getOffers()
  currentOffers = offerData.offers || []

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const { discountLabel, isFreeShipping } = Offers.calculate(0, currentOffers)
  const shippingAmount = isFreeShipping ? 0 : SHIPPING_FEE
  const grand = subtotal + shippingAmount

  const sidebar = document.getElementById('order-sidebar')
  sidebar.innerHTML = `
    <div class="order-summary-title">Your Order</div>
    ${cart.map(item => `
      <div class="summary-item-row">
        <img class="summary-item-img" src="/glasses/${item.folder_id}/1.jpg" alt="${item.name}" />
        <div>
          <div class="summary-item-name">${item.name}</div>
          ${item.description ? `<div class="summary-item-qty">${item.description}</div>` : ''}
          <div class="summary-item-qty">Qty ${item.qty} · ${item.lens_type}${item.lens_power ? ' — ' + item.lens_power : ''}</div>
        </div>
        <div class="summary-item-price">৳ ${(item.price * item.qty).toLocaleString()}</div>
      </div>`).join('')}
    <hr class="summary-divider" />
    ${discountLabel ? `<div class="summary-row" style="color:#16a34a"><span>${discountLabel}</span><span>Applied</span></div>` : ''}
    <div class="summary-row"><span>Subtotal</span><span>৳ ${subtotal.toLocaleString()}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${isFreeShipping ? 'Free' : `৳ ${SHIPPING_FEE}`}</span></div>
    <div class="summary-total"><span>Total</span><span>৳ ${grand.toLocaleString()}</span></div>
  `
}

async function placeOrder() {
  const name = document.getElementById('f-name').value.trim()
  const email = document.getElementById('f-email').value.trim()
  const phone = document.getElementById('f-phone').value.trim()
  const address = document.getElementById('f-address').value.trim()
  const note = document.getElementById('f-note').value.trim()
  const errEl = document.getElementById('form-error')
  errEl.classList.remove('visible')

  if (!name || !email || !phone || !address) {
    errEl.textContent = 'Please fill in all required fields.'
    errEl.classList.add('visible')
    return
  }

  const cart = Cart.get()
  const cartItems = cart.map(i => ({
    folder_id: i.folder_id,
    qty: i.qty,
    lens_type: i.lens_type,
    lens_power: i.lens_power,
  }))

  const btn = document.getElementById('submit-btn')
  btn.disabled = true
  btn.textContent = 'Placing Order...'

  const data = await API.placeOrder({
    customer_name: name,
    customer_email: email,
    phone,
    address,
    note,
    cart_items: cartItems,
  })

  if (data.error) {
    errEl.textContent = data.error
    errEl.classList.add('visible')
    btn.disabled = false
    btn.textContent = 'Place Order — Cash on Delivery'
    return
  }

  Cart.clear()
  sessionStorage.removeItem('ll_products')
  sessionStorage.removeItem('ll_offers')
  location.href = `/order-confirmed.html?id=${data.order_id}`
}

initNav()
initOfferBanner()
init()