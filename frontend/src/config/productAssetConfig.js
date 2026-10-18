/**
 * Product-asset behavior that must NOT key off product display names.
 *
 * Hover image selection: prefer alternate images whose URL contains these
 * markers (first match wins). Markers identify assets, not product names —
 * renaming a product does not change which hover photo is chosen.
 *
 * Newsletter banners: resolve live homepage images by specialPage and/or
 * distinctive homepage-image URL fragments (CDN filenames), with static fallbacks.
 */

/** Ordered markers searched in a product's alternate images for card hover. */
export const CARD_HOVER_IMAGE_MARKERS = [
  // Mikdash kit album / vessels / box
  'inter_album.png',
  '4_kelim.png',
  'box.png',
  // Third temple lifestyle shots
  '3mikdash_5.jpeg',
  '3mikdash_2.jpeg',
  '3mikdash_3.jpeg',
  // Tzedaka box browns
  'zdaka-brown.png',
  'zdaka_brown_2.jpeg',
  'zdaka_brown',
  // Shabbat candlestick lifestyle UUIDs / photos
  'eaa63086-00ae-4537-b634-5f3cc12a7deb.jpg',
  '6b8064ca-8e05-48b9-82f7-04640fc9c331.jpg',
  '9d52459b-560d-44da-a6dd-d1e14fc1f9b7.jpg'
];

/** Static CDN fallbacks for newsletter banner surfaces. */
export const NEWSLETTER_BANNER_IMAGE_FALLBACKS = {
  subscribe: 'https://cdn.bmikdash.com/3mikdash_4.jpeg',
  gift: 'https://cdn.bmikdash.com/uploads/gilmanor/8b073295-a115-46bd-82fa-0a2383b8ee6d.png',
  unsubscribe: 'https://cdn.bmikdash.com/moshe-bateva.png'
};

/**
 * How to pick a live product homepage image for each newsletter surface.
 * Uses specialPage and/or homepage URL fragments — never product names.
 */
export const NEWSLETTER_BANNER_RESOLVERS = {
  subscribe: {
    specialPage: 'third_temple',
    homepageIncludes: ['3mikdash_4.jpeg', '3mikdash_']
  },
  gift: {
    homepageIncludes: ['8b073295-a115-46bd-82fa-0a2383b8ee6d']
  },
  unsubscribe: {
    homepageIncludes: ['moshe-bateva']
  }
};
