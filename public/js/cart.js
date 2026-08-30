const Cart = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('ll_cart') || '[]')
    } catch { return [] }
  },
  save(cart) {
    localStorage.setItem('ll_cart', JSON.stringify(cart))
  },
  // A cart "line" is a unique combination of frame + lens config — the same
  // frame with two different prescriptions must stay as two separate lines.
  add(item, qty = 1) {
    const cart = this.get()
    const idx = cart.findIndex(i =>
      i.folder_id === item.folder_id &&
      i.lens_type === item.lens_type &&
      i.lens_power === item.lens_power
    )
    if (idx > -1) {
      cart[idx].qty += qty
    } else {
      cart.push({ ...item, qty })
    }
    this.save(cart)
  },
  clear() {
    this.save([])
  },
  total() {
    return this.get().reduce((s, i) => s + i.qty, 0)
  },
  // How many of this exact frame (any lens config) are already in the cart —
  // used for stock checks, since stock is per-frame, not per-lens-config.
  quantityOfFrame(folder_id) {
    return this.get()
      .filter(i => i.folder_id === folder_id)
      .reduce((s, i) => s + i.qty, 0)
  },
}
