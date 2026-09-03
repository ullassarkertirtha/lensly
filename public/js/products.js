let allProducts = []
let allOffers = []
let activeFilter = 'all'
// ratings map: folder_id : { average, count }
let ratingsMap = {}

async function loadPage() {
  const [prodData, offerData] = await Promise.all([
    API.getProducts(),
    API.getOffers(),
  ])
  allProducts = prodData.products || []
  allOffers = offerData.offers || []
  applyFilterAndSort()

  // Fetch ratings for all products in parallel — non-blocking, updates cards
  // after they've already rendered so the grid appears instantly.
  loadAllRatings()
}

async function loadAllRatings() {
  try {
    const results = await Promise.all(
      allProducts.map(p =>
        API.getReviews(p.folder_id)
          .then(d => ({ folder_id: p.folder_id, average: d.average || 0, count: d.count || 0 }))
          .catch(() => ({ folder_id: p.folder_id, average: 0, count: 0 }))
      )
    )
    results.forEach(r => { ratingsMap[r.folder_id] = r })
    // Update DOM in-place without destroying image elements
    updateRatingsInDOM()
  } catch {}
}

function updateRatingsInDOM() {
  document.querySelectorAll('.product-card').forEach(card => {
    const id = card.dataset.id
    const rating = ratingsMap[id]
    if (rating && rating.count > 0) {
      const container = card.querySelector('.rating-container')
      if (container) container.innerHTML = renderCardStars(rating.average, rating.count)
    }
  })
}

function setFilter(filter) {
  activeFilter = filter
  applyFilterAndSort()
}

function applyFilterAndSort() {
  const query = document.getElementById('search-input')?.value.trim().toLowerCase() || ''

  let filtered = allProducts
  if (activeFilter !== 'all') {
    if (activeFilter.startsWith('Color:')) {
      const c = activeFilter.split(':')[1]
      filtered = filtered.filter(p => p.color === c)
    } else {
      filtered = filtered.filter(p => p.gender === activeFilter)
    }
  }

  if (query) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    )
  }

  const val = document.getElementById('sort-select').value
  if (val === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price)
  else if (val === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price)
  else if (val === 'name-asc') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  document.getElementById('products-header').textContent = `${filtered.length} Frames`
  renderGrid(filtered)
}

function sortProducts() {
  applyFilterAndSort()
}

function renderCardStars(average, count) {
  if (!count) return ''
  const filled = Math.round(average)
  const stars = '★'.repeat(filled) + `<span style="color:var(--gray-200)">${'★'.repeat(5 - filled)}</span>`
  return `
    <div class="product-card-rating">
      <span class="product-card-stars">${stars}</span>
      <span class="product-card-rating-count">${average} (${count})</span>
    </div>`
}

function renderGrid(products) {
  const grid = document.getElementById('product-grid')
  grid.innerHTML = ''

  if (products.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;padding:60px 0;text-align:center;color:var(--gray-400);font-size:13px">No frames match your search.</p>`
    return
  }

  products.forEach((p, index) => {
    const hasStock = p.stock > 0
    const { finalPrice, discountLabel } = Offers.calculate(p.price, allOffers)
    const rating = ratingsMap[p.folder_id]
    const card = document.createElement('a')
    card.href = `/product-detail.html?id=${p.folder_id}`
    card.className = 'product-card'
    card.dataset.id = p.folder_id
    
    // Eager-load the first 8 images (above the fold) for instant LCP, lazy load the rest
    const lazyAttr = index > 7 ? 'loading="lazy"' : ''
    
    card.innerHTML = `
      <div class="product-card-img">
        <img class="img-primary" src="/glasses/${p.folder_id}/1.jpg" alt="${p.name}" ${lazyAttr} />
        <img class="img-secondary" src="/glasses/${p.folder_id}/2.jpg" alt="${p.name}" ${lazyAttr} />
        ${discountLabel && hasStock ? `<div class="product-card-badge">${discountLabel}</div>` : ''}
        ${!hasStock ? `<div class="sold-out-overlay">Sold Out</div>` : ''}
      </div>
      <div class="product-card-info">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-desc">${p.description}</div>
        <div class="product-card-price">
          <span>৳ ${finalPrice.toLocaleString()}</span>
          ${discountLabel && finalPrice !== p.price
            ? `<span class="price-original">৳ ${p.price.toLocaleString()}</span>`
            : ''}
        </div>
        <div class="rating-container">
          ${rating && rating.count > 0 ? renderCardStars(rating.average, rating.count) : ''}
        </div>
      </div>`
    grid.appendChild(card)
  })
}
