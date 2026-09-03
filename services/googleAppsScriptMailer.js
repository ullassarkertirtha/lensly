async function sendMail(payload) {
  if (!process.env.APPS_SCRIPT_WEBHOOK_URL) return
  
  payload.owner_email = process.env.OWNER_EMAIL || ''

  try {
    await fetch(process.env.APPS_SCRIPT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    // Mail failure should never block order/consultation success
    console.error('Apps Script mailer error:', err)
  }
}

module.exports = { sendMail }