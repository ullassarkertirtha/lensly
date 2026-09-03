const params = new URLSearchParams(location.search)
const productId = params.get('id')
let qty = 1
let currentProduct = null
let currentOffers = []
let selectedRating = 0
// Track edit state — null means "new review" mode
let editingReviewId = null

if (!productId) location.href = '/'

function togglePowerFields() {
  const lensType = document.getElementById('f-lens-type').value
  const powerFields = document.getElementById('power-fields')
  powerFields.style.display = lensType === 'None' ? 'none' : 'block'
}

async function loadProduct() {
  try {
    // Start fetching reviews immediately in parallel
    loadReviews()

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

    const lensType = document.getElementById('f-lens-type').value
    const lensErrEl = document.getElementById('lens-error')
    lensErrEl.textContent = ''

    if (!lensType) {
      lensErrEl.textContent = 'Please select a lens type.'
      isAddingToCart = false
      return
    }

    let lensPower = ''
    if (lensType !== 'None') {
      const sph = document.getElementById('f-sph').value.trim()
      const cyl = document.getElementById('f-cyl').value.trim()
      const axis = document.getElementById('f-axis').value.trim()
      const parts = []
      if (sph) parts.push(`SPH: ${sph}`)
      if (cyl) parts.push(`CYL: ${cyl}`)
      if (axis) parts.push(`AXIS: ${axis}`)
      lensPower = parts.join(', ')
    }

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
        price: finalPrice,
        lens_type: lensType,
        lens_power: lensPower,
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

  // Star rating input
  document.querySelectorAll('.star-input button').forEach(btn => {
    btn.onclick = () => {
      selectedRating = Number(btn.dataset.star)
      document.querySelectorAll('.star-input button').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.star) <= selectedRating)
      })
    }
  })
})

// ── Render helpers ────────────────────────────────────────────────────────────

function renderStars(rating) {
  const full = '★'.repeat(rating)
  const empty = `<span class="dim">${'★'.repeat(5 - rating)}</span>`
  return `<span class="stars">${full}${empty}</span>`
}

// ── Review form state ─────────────────────────────────────────────────────────

function setStarRating(n) {
  selectedRating = n
  document.querySelectorAll('.star-input button').forEach(b => {
    b.classList.toggle('active', Number(b.dataset.star) <= selectedRating)
  })
}

function enterEditMode(review) {
  editingReviewId = review.id
  setStarRating(review.rating)
  document.getElementById('review-comment').value = review.comment || ''
  document.getElementById('review-submit-btn').textContent = 'Update Review'
  document.getElementById('review-cancel-btn').style.display = 'inline-block'
  document.getElementById('review-form-title').textContent = 'Edit your review'
  // Scroll to the form
  document.getElementById('review-logged-in').scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function cancelEdit() {
  editingReviewId = null
  selectedRating = 0
  setStarRating(0)
  document.getElementById('review-comment').value = ''
  document.getElementById('review-submit-btn').textContent = 'Submit Review'
  document.getElementById('review-cancel-btn').style.display = 'none'
  document.getElementById('review-form-title').textContent = 'Write a review'
}

// ── Review load & render ──────────────────────────────────────────────────────

async function loadReviews() {
  const data = await API.getReviews(productId)
  const { reviews = [], average = 0, count = 0 } = data

  document.getElementById('reviews-average').innerHTML = count > 0
    ? `${renderStars(Math.round(average))} ${average} out of 5 (${count} review${count === 1 ? '' : 's'})`
    : 'No reviews yet'

  const currentUser = Auth.getUser()
  const list = document.getElementById('reviews-list')

  if (reviews.length === 0) {
    list.innerHTML = `<p class="no-reviews">Be the first to review this frame.</p>`
    return
  }

  list.innerHTML = reviews.map(r => {
    const isOwn = currentUser && r.user_id === currentUser.id
    return `
      <div class="review-item" id="review-${r.id}">
        <div class="review-item-top">
          <span class="review-item-name">${r.user_name}</span>
          <div style="display:flex;align-items:center;gap:12px">
            <span class="review-item-date">${new Date(r.created_at).toLocaleDateString()}</span>
            ${isOwn ? `
              <button class="review-action-btn" onclick="startEdit(${JSON.stringify(r).replace(/"/g, '&quot;')})">Edit</button>
              <button class="review-action-btn review-delete-btn" onclick="doDeleteReview('${r.id}')">Delete</button>
            ` : ''}
          </div>
        </div>
        ${renderStars(r.rating)}
        ${r.comment ? `<p class="review-item-comment">${r.comment}</p>` : ''}
      </div>
    `
  }).join('')
}

// ── Review actions ─────────────────────────────────────────────────────────────

function startEdit(review) {
  enterEditMode(review)
}

async function doDeleteReview(reviewId) {
  if (!confirm('Delete your review? This cannot be undone.')) return

  const itemEl = document.getElementById(`review-${reviewId}`)
  if (itemEl) { itemEl.style.opacity = '0.4'; itemEl.style.pointerEvents = 'none' }

  const result = await API.deleteReview({ review_id: reviewId })

  if (result.error) {
    alert(result.error)
    if (itemEl) { itemEl.style.opacity = ''; itemEl.style.pointerEvents = '' }
    return
  }

  loadReviews()
}

async function submitReview() {
  const comment = document.getElementById('review-comment').value.trim()
  const errEl = document.getElementById('review-error')
  errEl.textContent = ''

  if (selectedRating === 0) {
    errEl.textContent = 'Please select a star rating.'
    return
  }

  const btn = document.getElementById('review-submit-btn')
  btn.disabled = true
  btn.textContent = editingReviewId ? 'Updating...' : 'Submitting...'

  let result
  if (editingReviewId) {
    result = await API.editReview({ review_id: editingReviewId, rating: selectedRating, comment })
  } else {
    result = await API.submitReview({ product_id: productId, rating: selectedRating, comment })
  }

  if (result.error) {
    errEl.textContent = result.error
    btn.disabled = false
    btn.textContent = editingReviewId ? 'Update Review' : 'Submit Review'
    return
  }

  cancelEdit()
  btn.disabled = false
  loadReviews()
}

initNav()
initOfferBanner()
loadProduct()