const { getTabData, appendRow, updateRowByKey } = require('../services/googleSheetsSync')
const { generateDiscountCode } = require('../services/discountCodeGenerator')
const { sendMail } = require('../services/googleAppsScriptMailer')

function generateConsultationId() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `CON-${String(Date.now()).slice(-6)}-${randomSuffix}`
}

async function ownsAFrame(phone, email) {
  const orders = await getTabData('orders')
  return orders.some(o =>
    (phone && o.phone === phone) || (email && o.email === email)
  )
}

async function requestConsultation(body) {
  const { customer_name, phone, email, issue, preferred_time } = body

  if (!customer_name || !phone || !email || !issue || !preferred_time) {
    throw new Error('All fields are required')
  }

  const owns = await ownsAFrame(phone, email)
  const discount_code = owns ? generateDiscountCode() : ''

  const consultation_id = generateConsultationId()
  const requested_at = new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })

  await appendRow('consultations', {
    consultation_id,
    customer_name,
    phone,
    email,
    issue,
    preferred_time,
    owns_frame: owns ? 'TRUE' : 'FALSE',
    discount_code,
    status: 'Pending',
    requested_at,
  })

  await sendMail({
    type: 'consultation_confirmation',
    customer_name,
    email,
    issue,
    preferred_time,
    discount_code: discount_code || null,
  })

  return { consultation_id, owns_frame: owns, discount_code: discount_code || null }
}

async function getAllConsultations() {
  const rows = await getTabData('consultations')
  // Sort latest first by requested_at
  return rows.slice().sort((a, b) => {
    const da = new Date(a.requested_at)
    const db = new Date(b.requested_at)
    if (isNaN(da) || isNaN(db)) return 0
    return db - da
  })
}

async function updateConsultationStatus(consultationId, status) {
  await updateRowByKey('consultations', 'consultation_id', consultationId, { status })
}

// ── Cancel a consultation ─────────────────────────────────────────────────────
// Marks the consultation as Cancelled (irreversible) and sends a cancellation
// email via the Apps Script webhook.
async function cancelConsultation(consultationId) {
  const rows = await getTabData('consultations')
  const con = rows.find(c => c.consultation_id === consultationId)
  if (!con) throw new Error(`Consultation ${consultationId} not found`)
  if (con.status === 'Cancelled') throw new Error('Consultation is already cancelled')

  await updateRowByKey('consultations', 'consultation_id', consultationId, { status: 'Cancelled' })

  await sendMail({
    type: 'consultation_cancellation',
    consultation_id: consultationId,
    customer_name: con.customer_name,
    email: con.email,
    phone: con.phone,
    issue: con.issue,
    preferred_time: con.preferred_time,
  })
}

module.exports = { requestConsultation, getAllConsultations, updateConsultationStatus, cancelConsultation }