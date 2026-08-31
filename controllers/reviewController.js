const supabase = require('../models/db')
const { sanitize } = require('../utils/sanitize')

// ── controllers ─────────────────────────────────────────────────────────────
async function addReview({ product_id, rating, comment, user }) {
  const user_id = user.id
  let user_name = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
  user_name = sanitize(user_name)
  comment = sanitize(comment)

  if (!product_id || !rating) throw new Error('Missing required review fields')
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5')

  const { data, error } = await supabase
    .from('reviews')
    .insert({ product_id, user_id, user_name, rating, comment: comment || null })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function editReview({ review_id, rating, comment, user }) {

  if (!review_id) throw new Error('review_id is required')
  if (rating && (rating < 1 || rating > 5)) throw new Error('Rating must be between 1 and 5')

  // Fetch the review first to confirm ownership
  const { data: existing, error: fetchErr } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', review_id)
    .single()

  if (fetchErr || !existing) throw new Error('Review not found')
  if (existing.user_id !== user.id) throw new Error('Not authorised to edit this review')

  const updates = {}
  if (rating) updates.rating = rating
  if (comment !== undefined) updates.comment = sanitize(comment) || null

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', review_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function deleteReview({ review_id, user }) {

  if (!review_id) throw new Error('review_id is required')

  // Confirm ownership before deleting
  const { data: existing, error: fetchErr } = await supabase
    .from('reviews')
    .select('user_id')
    .eq('id', review_id)
    .single()

  if (fetchErr || !existing) throw new Error('Review not found')
  if (existing.user_id !== user.id) throw new Error('Not authorised to delete this review')

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', review_id)

  if (error) throw new Error(error.message)
  return { ok: true }
}

async function getReviewsByProduct(product_id) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', product_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const count = data.length
  const average = count === 0
    ? 0
    : Math.round((data.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10

  return { reviews: data, average, count }
}

module.exports = { addReview, editReview, deleteReview, getReviewsByProduct }