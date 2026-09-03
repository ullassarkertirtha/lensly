const { getTabData, appendRow, updateRowByKey } = require('../services/googleSheetsSync')

function isOfferLive(offer) {
  if (offer.active !== 'TRUE') return false
  const now = Date.now()
  const starts = new Date(offer.starts_at).getTime()
  const ends = new Date(offer.ends_at).getTime()
  return now >= starts && now <= ends
}

async function getActiveOffers() {
  const rows = await getTabData('offers')
  return rows.filter(isOfferLive).map(o => ({
    offer_key: o.offer_key,
    label: o.label,
    offer_type: o.offer_type || 'percentage',
    percentage: Number(o.percentage) || 0,
    starts_at: o.starts_at,
    ends_at: o.ends_at,
  }))
}

async function getAllOffers() {
  // for admin dashboard — includes inactive/expired
  const rows = await getTabData('offers')
  return rows.map(o => ({
    ...o,
    offer_type: o.offer_type || 'percentage',
    percentage: Number(o.percentage) || 0,
    active: o.active === 'TRUE',
  }))
}

// Applies the best active percentage offer to a price, and checks for free shipping separately (allowing both).
function applyBestOffer(price, activeOffers) {
  if (!activeOffers || !activeOffers.length) return { finalPrice: price, discountLabel: null, isFreeShipping: false }
  
  let bestPercentage = null
  let isFreeShipping = false
  
  for (const o of activeOffers) {
    if (o.offer_type === 'free_shipping') isFreeShipping = true
    if (!bestPercentage || o.percentage > bestPercentage.percentage) bestPercentage = o
  }

  let finalPrice = price
  let discountLabel = null

  if (bestPercentage && bestPercentage.percentage > 0) {
    finalPrice = Math.round(price * (1 - bestPercentage.percentage / 100))
    discountLabel = bestPercentage.label
  } else if (isFreeShipping) {
    const fsOffer = activeOffers.find(o => o.offer_type === 'free_shipping')
    discountLabel = fsOffer ? fsOffer.label : 'Free Shipping'
  }

  return { finalPrice, discountLabel, isFreeShipping }
}

// ── Admin mutations ──────────────────────────────────────────────────────────

async function createOffer(data) {
  const { offer_key, label, offer_type, percentage, active, starts_at, ends_at } = data
  if (!offer_key || !label || !starts_at || !ends_at) {
    throw new Error('offer_key, label, starts_at, ends_at are required')
  }
  await appendRow('offers', {
    offer_key: String(offer_key).trim(),
    label: String(label).trim(),
    offer_type: offer_type || 'percentage',
    percentage: String(Number(percentage || 0)),
    active: (active === true || active === 'TRUE' || active === '1') ? 'TRUE' : 'FALSE',
    starts_at: String(starts_at),
    ends_at: String(ends_at),
  })
}

async function updateOffer(offer_key, updates) {
  const allowed = ['label', 'offer_type', 'percentage', 'active', 'starts_at', 'ends_at']
  const safe = {}
  for (const [k, v] of Object.entries(updates)) {
    if (allowed.includes(k)) {
      safe[k] = k === 'active'
        ? (v === true || v === 'TRUE' || v === '1' ? 'TRUE' : 'FALSE')
        : String(v)
    }
  }
  if (!Object.keys(safe).length) throw new Error('No valid fields to update')
  await updateRowByKey('offers', 'offer_key', offer_key, safe)
}

module.exports = { getActiveOffers, getAllOffers, applyBestOffer, createOffer, updateOffer }