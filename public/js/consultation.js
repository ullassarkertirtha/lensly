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

async function submitConsultation() {
  const name = document.getElementById('f-name').value.trim()
  const email = document.getElementById('f-email').value.trim()
  const phone = document.getElementById('f-phone').value.trim()
  const issue = document.getElementById('f-issue').value.trim()
  const preferred_time = document.getElementById('f-preferred-time').value.trim()
  const errEl = document.getElementById('form-error')
  errEl.classList.remove('visible')

  if (!name || !email || !phone || !issue || !preferred_time) {
    errEl.textContent = 'Please fill in all required fields.'
    errEl.classList.add('visible')
    return
  }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRx.test(email)) {
    errEl.textContent = 'Please enter a valid email address.'
    errEl.classList.add('visible')
    return
  }

  const btn = document.getElementById('submit-btn')
  btn.disabled = true
  btn.textContent = 'Submitting...'

  const data = await API.requestConsultation({
    customer_name: name,
    email,
    phone,
    issue,
    preferred_time,
  })

  if (data.error) {
    errEl.textContent = data.error
    errEl.classList.add('visible')
    btn.disabled = false
    btn.textContent = 'Book Consultation'
    return
  }

  // Show success state — hide form, reveal confirmation panel
  document.getElementById('consultation-form').style.display = 'none'
  document.getElementById('consultation-success').style.display = 'block'
  document.getElementById('success-id').textContent = data.consultation_id

  if (data.owns_frame && data.discount_code) {
    document.getElementById('discount-block').style.display = 'block'
    document.getElementById('discount-code').textContent = data.discount_code
  }
}
