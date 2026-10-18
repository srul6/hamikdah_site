/**
 * Adapt a bundle API payload for PriceDisplay / savings UI.
 * Always uses API regularPrice (sum of list prices) — never recomputes from finals.
 */

export function getBundlePricingView(bundle) {
    const regularPrice = Number(bundle?.regularPrice) || 0;
    const finalPrice = Number(bundle?.finalPrice ?? bundle?.price) || 0;
    const hasDiscount =
        bundle?.hasDiscount != null
            ? !!bundle.hasDiscount
            : regularPrice > finalPrice && regularPrice > 0;
    const discountAmount =
        Number.isFinite(Number(bundle?.discountAmount))
            ? Number(bundle.discountAmount)
            : Math.max(0, Math.round((regularPrice - finalPrice) * 100) / 100);
    const savingsPercent =
        Number.isFinite(Number(bundle?.savingsPercent))
            ? Number(bundle.savingsPercent)
            : hasDiscount && regularPrice > 0
              ? Math.round((discountAmount / regularPrice) * 100)
              : 0;

    return {
        regularPrice,
        finalPrice,
        hasDiscount,
        discountAmount,
        savingsPercent
    };
}
