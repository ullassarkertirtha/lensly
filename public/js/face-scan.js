// ── LensLy Face Scan — Cloud AI with Gemini ────────────────────────────────
//
// Pipeline:
//   1. Check Auth (redirect to login if not logged in)
//   2. User grants camera access (or uploads a photo)
//   3. Capture base64 JPEG from canvas
//   4. POST /api/face-scan/suggest (with Auth Bearer token)
//   5. Backend limits usage (configurable daily limit) and calls Gemini 3.1 Flash-Lite
//   6. Render results

if (!Auth.isLoggedIn()) {
  window.location.href = '/login.html?facescan=1'
}

let stream = null
let videoEl = null
let isAnalysing = false
let selectedGender = 'all'
let scansRemaining = null

async function fetchLimits() {
  try {
    const token = localStorage.getItem('ll_token')
    const res = await fetch('/api/face-scan/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      scansRemaining = data.scans_remaining
      updateLimitsUI()
    } else if (res.status === 401) {
      alert('Your session has expired. Please log in again.')
      Auth.logout()
    }
  } catch(e) {
    console.error('Failed to fetch limits:', e)
  }
}

function updateLimitsUI() {
  const limitsBox = document.getElementById('scan-limits-box')
  const limitsText = document.getElementById('scan-limits-text')
  const ctaArea = document.getElementById('scan-cta-area')
  const startBtn = document.querySelector('.scan-start-btn')
  const uploadInput = document.getElementById('upload-input')
  
  if (limitsBox) {
    limitsBox.style.display = 'block'
    if (scansRemaining > 0) {
      limitsText.textContent = scansRemaining
      ctaArea.style.opacity = '1'
      ctaArea.style.pointerEvents = 'auto'
      if(startBtn) startBtn.disabled = false
      if(uploadInput) uploadInput.disabled = false
    } else {
      limitsBox.innerHTML = '<span style="color:#b91c1c; font-weight: 500;">You have 0 scans left today. It will get reset tomorrow.</span>'
      ctaArea.style.opacity = '0.4'
      ctaArea.style.pointerEvents = 'none'
      if(startBtn) startBtn.disabled = true
      if(uploadInput) uploadInput.disabled = true
    }
  }
}

fetchLimits()

// ── Camera ─────────────────────────────────────────────────────────────────

async function startCamera() {
  setStep('camera')
  updateStatus('Requesting camera access…')

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not supported or blocked (HTTPS required).")
    }
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    videoEl = document.getElementById('face-video')
    videoEl.srcObject = stream
    await new Promise(r => videoEl.onloadedmetadata = r)
    videoEl.play()
    updateStatus('Position your face in the circle and tap Capture.')
    document.getElementById('capture-btn').disabled = false
  } catch (err) {
    console.error("Camera Error:", err)
    updateStatus(`Camera error: ${err.name || err.message || 'Access denied'}. Please upload a photo.`, true)
    document.getElementById('upload-fallback').style.display = 'block'
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
}

async function captureAndAnalyse() {
  if (isAnalysing) return
  isAnalysing = true

  const btn = document.getElementById('capture-btn')
  btn.disabled = true
  btn.textContent = 'Analysing…'
  setStep('analysing')

  const canvas = document.getElementById('snap-canvas')
  canvas.width  = videoEl.videoWidth
  canvas.height = videoEl.videoHeight
  const ctx = canvas.getContext('2d')
  // Mirror the video (front camera) so it looks natural
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(videoEl, 0, 0)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  stopCamera()
  await runDetection(canvas)
}

// ── Upload fallback ────────────────────────────────────────────────────────

function handleUpload(input) {
  const file = input.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    updateStatus('Please select an image file.', true)
    return
  }
  setStep('analysing')
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = async () => {
    const canvas = document.getElementById('snap-canvas')
    
    // Scale down image to save bandwidth/tokens
    const MAX_DIM = 800
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) { h = Math.round(h * (MAX_DIM / w)); w = MAX_DIM }
      else { w = Math.round(w * (MAX_DIM / h)); h = MAX_DIM }
    }
    
    canvas.width  = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    URL.revokeObjectURL(url)
    await runDetection(canvas)
  }
  img.src = url
}

// ── Detection + results ────────────────────────────────────────────────────

async function runDetection(canvas) {
  updateAnalysisStatus('Uploading to AI stylist…')
  
  // Compress to jpeg
  const base64Image = canvas.toDataURL('image/jpeg', 0.7)

  try {
    const token = localStorage.getItem('ll_token')
    const res = await fetch('/api/face-scan/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ image: base64Image, gender: selectedGender })
    })

    const data = await res.json()

    if (!res.ok) {
      if (res.status === 401) {
        alert('Your session has expired. Please log in again.')
        Auth.logout()
        return
      }
      showError(data.error || 'Analysis failed. Please try again.')
      return
    }

    // Store snapshot for the results panel
    const preview = document.getElementById('result-snapshot')
    if (preview) preview.src = base64Image

    // Persist results
    localStorage.setItem('lensly_last_scan_data', JSON.stringify(data))
    localStorage.setItem('lensly_last_scan_image', base64Image)

    scansRemaining--
    updateLimitsUI()

    renderResults(data)
    setStep('results')
    isAnalysing = false

  } catch (e) {
    showError('Network error. Please try again with a clearer photo.')
  }
}

// ── Render results ─────────────────────────────────────────────────────────

function renderResults(data) {
  document.getElementById('result-shape-label').textContent = data.label
  document.getElementById('result-tagline').textContent     = `${data.tagline} (Skin Tone: ${data.skin_tone})`
  document.getElementById('result-tip').textContent         = data.tip.replace(/[\u1000-\uFFFF]+/g, '').trim()

  const grid = document.getElementById('suggestions-grid')
  const offers = [] // offers already baked into live price from products tab
  grid.innerHTML = data.suggestions.map(p => `
    <a href="/product-detail.html?id=${p.folder_id}" class="product-card">
      <div class="product-card-img">
        <img class="img-primary"   src="/glasses/${p.folder_id}/1.jpg" alt="${p.name}" />
        <img class="img-secondary" src="/glasses/${p.folder_id}/2.jpg" alt="${p.name}" />
      </div>
      <div class="product-card-info">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-desc">${p.description}</div>
        <div class="product-card-price"><span>৳ ${Number(p.price).toLocaleString()}</span></div>
      </div>
    </a>
  `).join('')
}

function showError(msg) {
  // If it's a limit error, we might want to stay on step-idle or step-analysing 
  // but let's just go back to camera or idle and show the error.
  alert(msg)
  setStep('idle')
  isAnalysing = false
}

// ── UI helpers ─────────────────────────────────────────────────────────────

function setStep(step) {
  // step: 'idle' | 'camera' | 'analysing' | 'results'
  ['step-idle', 'step-camera', 'step-analysing', 'step-results'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.style.display = 'none'
  })
  const target = document.getElementById(`step-${step}`)
  if (target) target.style.display = 'block'
}

function updateStatus(msg, isError = false) {
  const el = document.getElementById('camera-status')
  if (!el) return
  el.textContent = msg
  el.style.color = isError ? '#b91c1c' : 'var(--gray-500)'
}

function updateAnalysisStatus(msg) {
  const el = document.getElementById('analysis-status')
  if (el) el.textContent = msg
}

// Note: setGender is called globally from HTML onclick, attach it to window
window.setGender = function(gender, btn) {
  selectedGender = gender
  document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
}

window.startCamera = startCamera
window.captureAndAnalyse = captureAndAnalyse
window.handleUpload = handleUpload
window.retakeScan = function() {
  stopCamera()
  isAnalysing = false
  localStorage.removeItem('lensly_last_scan_data')
  localStorage.removeItem('lensly_last_scan_image')
  setStep('idle')
}

// ── Restore previous scan if exists ──────────────────────────────────────────
const storedData = localStorage.getItem('lensly_last_scan_data')
const storedImage = localStorage.getItem('lensly_last_scan_image')

if (storedData && storedImage) {
  try {
    const data = JSON.parse(storedData)
    const preview = document.getElementById('result-snapshot')
    if (preview) preview.src = storedImage
    renderResults(data)
    setStep('results')
  } catch(e) {
    console.error('Failed to restore scan data:', e)
  }
}
