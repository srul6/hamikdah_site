/**
 * Home-page sections that can be used as promo-slide link targets.
 * Keys are stable identifiers stored in the DB; elementId is the DOM id on Home.
 */
export const HOME_SECTIONS = [
  {
    key: 'products',
    label_he: 'מוצרים ראשיים',
    label_en: 'Featured products',
    elementId: 'home-products'
  },
  {
    key: 'video',
    label_he: 'סרטון',
    label_en: 'Video',
    elementId: 'home-video'
  },
  {
    key: 'catalog',
    label_he: 'מוצרים נוספים ובאנדלים',
    label_en: 'More products & bundles',
    elementId: 'home-catalog'
  },
  {
    key: 'homepage-text',
    label_he: 'טקסט בדף הבית',
    label_en: 'Homepage text',
    elementId: 'home-homepage-text'
  },
  {
    key: 'testimonials',
    label_he: 'המלצות לקוחות',
    label_en: 'Testimonials',
    elementId: 'home-testimonials'
  },
  {
    key: 'faq',
    label_he: 'שאלות ותשובות',
    label_en: 'FAQ',
    elementId: 'home-faq'
  },
  {
    key: 'newsletter',
    label_he: 'ניוזלטר',
    label_en: 'Newsletter',
    elementId: 'home-newsletter'
  }
];

export function getHomeSectionByKey(key) {
  if (key == null) return null;
  const k = String(key).trim();
  return HOME_SECTIONS.find((s) => s.key === k) || null;
}

export function getHomeSectionElementId(key) {
  const section = getHomeSectionByKey(key);
  return section ? section.elementId : null;
}
