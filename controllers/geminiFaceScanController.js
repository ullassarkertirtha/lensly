const { GoogleGenerativeAI } = require('@google/generative-ai')
const supabase = require('../models/db')
const { getTabData } = require('../services/googleSheetsSync')
const { DAILY_FACE_SCAN_LIMIT } = require('../config/constants')

async function analyzeFaceAndSuggest({ image, gender, user }) {
  // 1. Enforce usage limits
  const now = new Date()
  const bdTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
  const today = new Date(bdTimeStr).toISOString().split('T')[0]

  const meta = user.user_metadata || {}
  const lastScanDate = meta.face_scan_date
  let scanCount = meta.face_scan_count || 0

  if (lastScanDate === today) {
    if (scanCount >= DAILY_FACE_SCAN_LIMIT) {
      throw new Error(`Daily limit reached. You can only perform ${DAILY_FACE_SCAN_LIMIT} face scans per day. Please try again tomorrow.`)
    }
  } else {
    // New day, reset count
    scanCount = 0
  }

  if (!image) {
    throw new Error('Image is required')
  }

  // 2. Fetch in-stock eligible products
  const products = await getTabData('stock')
  let eligible = products.filter(p => Number(p.stock) > 0)
  if (gender && gender !== 'all') {
    eligible = eligible.filter(p =>
      p.gender?.toLowerCase() === gender.toLowerCase() ||
      p.gender?.toLowerCase() === 'unisex'
    )
  }

  // Simplify catalog data sent to Gemini to save tokens
  const catalogForGemini = eligible.map(p => ({
    id: p.folder_id,
    name: p.name,
    color: p.color,
    shape: p.description
  }))

  if (catalogForGemini.length === 0) {
    throw new Error('No frames currently available for your selection.')
  }

  // 3. Call Gemini
  const geminiKey = (process.env.GEMINI_API_KEY || '').replace(/^["']|["']$/g, '').trim()
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY is missing')
  }

  const genAI = new GoogleGenerativeAI(geminiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: { responseMimeType: 'application/json' }
  })

  // Extract base64 and mime type
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const base64Data = image.replace(/^data:image\/\w+;base64,/, '')

  const prompt = `You are a professional eyewear stylist. Analyze the user's face shape and skin color from the uploaded image. Then, from the following JSON list of in-stock frames, recommend exactly 4 frames that best complement their face shape and skin tone. 

Catalog:
${JSON.stringify(catalogForGemini)}

Return ONLY a JSON object strictly matching this schema. DO NOT USE ANY EMOJIS IN YOUR RESPONSE.
{
  "face_shape": "one of: oval, round, square, heart, oblong",
  "label": "a short phrase describing the shape (e.g. 'Oval Face')",
  "tagline": "A one sentence tagline about why this shape is great",
  "tip": "A one sentence tip for choosing frames for this shape",
  "skin_tone": "The user's skin tone (e.g. Fair, Medium, Deep)",
  "recommended_folder_ids": ["id1", "id2", "id3", "id4"]
}`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Data, mimeType } }
  ])

  const responseText = result.response.text()
  let analysis
  try {
    analysis = JSON.parse(responseText)
  } catch (err) {
    throw new Error('Failed to parse AI response. Please try again.')
  }

  // 4. Update usage limits
  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...meta,
      face_scan_date: today,
      face_scan_count: scanCount + 1
    }
  })

  if (updateError) {
    console.error('Failed to update user limit:', updateError)
  }

  // 5. Construct the final result
  const suggestions = analysis.recommended_folder_ids
    .map(id => eligible.find(p => p.folder_id === id))
    .filter(Boolean)
    .slice(0, 4)

  // Fallback if AI returned bad IDs
  if (suggestions.length === 0) {
    suggestions.push(...eligible.slice(0, 4))
  }

  return {
    face_shape: analysis.face_shape.toLowerCase(),
    label: analysis.label,
    tagline: analysis.tagline,
    tip: analysis.tip,
    skin_tone: analysis.skin_tone,
    suggestions
  }
}

module.exports = { analyzeFaceAndSuggest }