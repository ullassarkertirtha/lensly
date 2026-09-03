const { requireUser } = require('../../middleware/userAuth')
const { DAILY_FACE_SCAN_LIMIT } = require('../../config/constants')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireUser(req)
    const now = new Date()
    const bdTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
    const today = new Date(bdTimeStr).toISOString().split('T')[0]

    const meta = user.user_metadata || {}
    const lastScanDate = meta.face_scan_date
    let scanCount = meta.face_scan_count || 0

    if (lastScanDate !== today) {
      scanCount = 0
    }

    res.status(200).json({
      scans_used: scanCount,
      scans_total: DAILY_FACE_SCAN_LIMIT,
      scans_remaining: Math.max(0, DAILY_FACE_SCAN_LIMIT - scanCount)
    })
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}
