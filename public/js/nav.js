function initNav() {
  const countEl = document.getElementById('cart-count')
  if (countEl) {
    const total = Cart.total()
    if (total > 0) {
      countEl.textContent = total
      countEl.style.display = 'inline-flex'
    } else {
      countEl.style.display = 'none'
    }
  }

  const user = Auth.getUser()
  const loginLink = document.getElementById('nav-login')
  const logoutBtn = document.getElementById('nav-logout')
  const userName = document.getElementById('nav-username')

  if (user) {
    if (loginLink) loginLink.style.display = 'none'
    if (logoutBtn) logoutBtn.style.display = 'inline'
    if (userName) {
      userName.textContent = `Hi, ${user.name.split(' ')[0]}`
      userName.style.display = 'inline'
    }
  } else {
    if (loginLink) loginLink.style.display = 'inline'
    if (logoutBtn) logoutBtn.style.display = 'none'
    if (userName) userName.style.display = 'none'
  }

  const navbar = document.querySelector('.navbar')
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10)
    }, { passive: true })
  }
}

function startCountdown(endsAt, el) {
  function tick() {
    const diff = new Date(endsAt) - Date.now()
    if (diff <= 0) { el.textContent = '00:00:00'; return }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }
  tick()
  setInterval(tick, 1000)
}

async function initOfferBanner() {
  try {
    const data = await API.getOffers()
    const offers = data.offers || []
    if (!offers.length) return

    // Show the single best (highest percentage) offer — matches Offers.calculate()
    const active = offers.reduce((max, o) =>
      Number(o.percentage) > Number(max.percentage) ? o : max
    )

    const banner = document.getElementById('offer-banner')
    if (!banner) return

    document.getElementById('offer-msg').textContent = active.label
    banner.classList.add('visible')

    const navbar = document.querySelector('.navbar')
    if (navbar) {
      const bannerH = banner.offsetHeight
      navbar.style.top = `${bannerH}px`
    }

    const countdownEl = document.getElementById('offer-countdown')
    if (countdownEl) startCountdown(active.ends_at, countdownEl)
  } catch {}
}

function toggleNavMenu(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('nav-dropdown');
  if (dropdown) dropdown.classList.toggle('open');
}

// Close when clicking outside
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('nav-dropdown');
  const btn = document.getElementById('nav-menu-btn');
  if (dropdown && dropdown.classList.contains('open')) {
    if (!dropdown.contains(e.target) && e.target !== btn) {
      dropdown.classList.remove('open');
    }
  }
});
