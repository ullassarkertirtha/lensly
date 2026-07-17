const params = new URLSearchParams(location.search)
const productId = params.get('id')
let qty = 1
let currentProduct = null
let currentOffers = []

if (!productId) location.href = '/'

async function loadProduct() {
  try {
    // Start fetching reviews immediately in parallel
    // loadReviews() // TODO: Implement reviews

    const [prodData, offerData] = await Promise.all([
      API.getProduct(productId),
      API.getOffers(),
    ])
    currentOffers = offerData.offers || []
    const product = prodData.product

    if (!product) { location.href = '/'; return }
    currentProduct = product
    renderProduct(product)
    document.getElementById('product-content').style.display = 'grid'
  } catch (err) {
    console.error('Failed to load product:', err)
    document.getElementById('product-content').innerHTML = `
      <div style="grid-column: 1/-1; padding: 100px 20px; text-align: center; color: var(--gray-600);">
        <h3>Oops, something went wrong!</h3>
        <p>We couldn't load the product details. Please check your connection and try again.</p>
        <button onclick="location.reload()" class="btn-primary" style="margin-top:20px;width:auto;padding:12px 24px;">Refresh Page</button>
      </div>
    `
    document.getElementById('product-content').style.display = 'block'
  }
}

function renderProduct(p) {
  const { finalPrice, discountLabel } = Offers.calculate(p.price, currentOffers)
  document.title = `${p.name} | LensLy`

  document.getElementById('product-name').textContent = p.name
  document.getElementById('product-gender').textContent = p.gender
  document.getElementById('product-desc').textContent = p.description

  document.getElementById('product-price').innerHTML = `
    <span>৳ ${finalPrice.toLocaleString()}</span>
    ${discountLabel && finalPrice !== p.price
      ? `<span class="price-original">৳ ${p.price.toLocaleString()}</span>`
      : ''}
  `

  const mainImg = document.getElementById('main-img')
  const thumbs = document.getElementById('thumbs')
  mainImg.src = `/glasses/${p.folder_id}/1.jpg`
  mainImg.alt = p.name
  thumbs.innerHTML = ''

  for (let i = 1; i <= 2; i++) {
    const src = `/glasses/${p.folder_id}/${i}.jpg`
    const btn = document.createElement('button')
    btn.className = `gallery-thumb ${i === 1 ? 'active' : ''}`
    btn.innerHTML = `<img src="${src}" alt="${p.name} ${i}" onerror="this.closest('button').style.display='none'" />`
    btn.onclick = () => switchImage(src, btn)
    thumbs.appendChild(btn)
  }

  const stockMsg = document.getElementById('stock-msg')
  const addBtn = document.getElementById('add-btn')
  if (p.stock === 0) {
    stockMsg.innerHTML = `<p class="stock-error">Out of stock</p>`
    addBtn.disabled = true
  } else if (p.stock <= 3) {
    stockMsg.innerHTML = `<p class="stock-warning">⚠ Only ${p.stock} left</p>`
    addBtn.disabled = false
  } else {
    stockMsg.innerHTML = `<p class="stock-ok">In stock</p>`
    addBtn.disabled = false
  }
}

function switchImage(src, thumbBtn) {
  const mainImg = document.getElementById('main-img')
  mainImg.classList.add('switching')
  setTimeout(() => {
    mainImg.src = src
    mainImg.classList.remove('switching')
  }, 150)
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'))
  thumbBtn.classList.add('active')
}

function changeQty(delta) {
  qty = Math.max(1, qty + delta)
  document.getElementById('qty-display').textContent = qty
}

document.addEventListener('DOMContentLoaded', () => {
  let isAddingToCart = false
  document.getElementById('add-btn').onclick = async () => {
    if (!currentProduct || isAddingToCart) return
    isAddingToCart = true

    const btn = document.getElementById('add-btn')
    btn.disabled = true
    btn.textContent = 'Checking stock...'

    try {
      const fresh = await API.getLiveProduct(currentProduct.folder_id)
      const liveProduct = fresh.product
      const inCart = Cart.quantityOfFrame(currentProduct.folder_id)
      const available = (liveProduct?.stock || 0) - inCart

      if (available <= 0) {
        document.getElementById('stock-msg').innerHTML = `<p class="stock-error">Sorry, this just went out of stock</p>`
        btn.disabled = true
        btn.textContent = 'Add to Cart'
        isAddingToCart = false
        return
      }
      if (qty > available) {
        document.getElementById('stock-msg').innerHTML = `<p class="stock-warning">⚠ Only ${available} available</p>`
        btn.disabled = false
        btn.textContent = 'Add to Cart'
        isAddingToCart = false
        return
      }

      const { finalPrice } = Offers.calculate(currentProduct.price, currentOffers)
      Cart.add({
        folder_id: currentProduct.folder_id,
        name: currentProduct.name,
        description: currentProduct.description,
        price: finalPrice
      }, qty)

      btn.textContent = '✓ Added to Cart'
      btn.classList.add('success')
      initNav()
      setTimeout(() => { btn.textContent = 'Add to Cart'; btn.classList.remove('success'); btn.disabled = false }, 2000)
    } catch (err) {
      console.error('Failed to add to cart:', err)
      btn.disabled = false
      btn.textContent = 'Add to Cart'
      alert('Failed to check live stock. Please try again.')
    } finally {
      isAddingToCart = false
    }
  }
})

initNav()
initOfferBanner()
loadProduct()