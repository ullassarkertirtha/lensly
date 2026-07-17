const Cart = {
    getItems() {
        try {
            const items = JSON.parse(localStorage.getItem('ll_cart'));
            return Array.isArray(items) ? items.filter(Boolean) : [];
        } catch {
            return [];
        }
    },
    save(items) {
        localStorage.setItem('ll_cart', JSON.stringify(items));
        if (typeof initNav === 'function') initNav();
    },
    total() {
        return this.getItems().reduce((sum, item) => sum + (item.qty || 1), 0);
    },
    quantityOfFrame(folderId) {
        const item = this.getItems().find(i => i.folder_id === folderId);
        return item ? (item.qty || 1) : 0;
    },
    add(product) {
        const items = this.getItems();
        const existing = items.find(i => i.folder_id === product.folder_id);
        if (existing) {
            existing.qty = (existing.qty || 1) + (product.qty || 1);
        } else {
            items.push({ ...product, qty: product.qty || 1 });
        }
        this.save(items);
    },
    update(folderId, qty) {
        let items = this.getItems();
        const item = items.find(i => i.folder_id === folderId);
        if (item) {
            if (qty <= 0) {
                this.remove(folderId);
                return;
            }
            item.qty = qty;
            this.save(items);
        }
    },
    remove(folderId) {
        const items = this.getItems().filter(i => i.folder_id !== folderId);
        this.save(items);
    },
    clear() {
        localStorage.removeItem('ll_cart');
        if (typeof initNav === 'function') initNav();
    }
};
