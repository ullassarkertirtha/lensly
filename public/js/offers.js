const Offers = {
    // Mirrors controllers/offerController.js's applyBestOffer() on the backend.
    // This is for display purposes only — the server always recalculates the
    calculate(price, offers) {
        if (!Array.isArray(offers) || offers.length === 0) {
            return { finalPrice: price, discountLabel: null, isFreeShipping: false }
        }

        let bestPercentage = null
        let isFreeShipping = false

        for (const o of offers) {
            if (o.offer_type === 'free_shipping') isFreeShipping = true
            if (!bestPercentage || Number(o.percentage) > Number(bestPercentage.percentage)) bestPercentage = o
        }

        let finalPrice = price
        let discountLabel = null

        if (bestPercentage && Number(bestPercentage.percentage) > 0) {
            finalPrice = Math.round(price * (1 - Number(bestPercentage.percentage) / 100))
            discountLabel = bestPercentage.label
        } else if (isFreeShipping) {
            const fsOffer = offers.find(o => o.offer_type === 'free_shipping')
            discountLabel = fsOffer ? fsOffer.label : 'Free Shipping'
        }

        return { finalPrice, discountLabel, isFreeShipping }
    },
}