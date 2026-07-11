/**
 * Localized cart line label (product name + optional color variant).
 */
export function getCartItemDisplayName(item, isHebrew) {
    if (!item) return '';

    const selectedColor = item.selectedColor;
    const base = isHebrew
        ? (item.name_he || item.name_en || item.name || '')
        : (item.name_en || item.name_he || item.name || '');

    if (!selectedColor) {
        return base;
    }

    const colorName = isHebrew
        ? (selectedColor.name_he || selectedColor.name || selectedColor.name_en || '')
        : (selectedColor.name_en || selectedColor.name || selectedColor.name_he || '');

    return colorName ? `${base} - ${colorName}` : base;
}
