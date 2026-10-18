import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { API_ENDPOINTS } from '../config';
import { getImageUrl } from '../utils/imageUtils';
import {
  NEWSLETTER_BANNER_IMAGE_FALLBACKS,
  NEWSLETTER_BANNER_RESOLVERS
} from '../config/productAssetConfig';

/**
 * Full-bleed hero image — scales to full banner width (no side gaps),
 * height follows natural aspect ratio so the image is not cropped.
 */
export default function NewsletterBannerImage({
  src,
  alt = '',
  backgroundColor = 'transparent'
}) {
  if (!src) return null;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        flexShrink: 0,
        overflow: 'hidden',
        lineHeight: 0,
        m: 0,
        p: 0,
        backgroundColor
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          objectPosition: 'center',
          display: 'block',
          m: 0,
          p: 0,
          verticalAlign: 'top'
        }}
      />
    </Box>
  );
}

function primaryImageOf(product) {
  if (!product) return '';
  return getImageUrl(product.homepageImage || product.homepageimage || '');
}

function homepageUrlOf(product) {
  return String(product?.homepageImage || product?.homepageimage || '').toLowerCase();
}

function getSpecialPage(product) {
  const raw = product?.specialPage ?? product?.special_page;
  if (raw == null || raw === '') return null;
  return String(raw).trim() || null;
}

/**
 * Resolve a product for a newsletter surface without using display names.
 */
export function resolveNewsletterBannerProduct(products, resolver) {
  const list = Array.isArray(products) ? products : [];
  if (!resolver) return null;

  if (resolver.specialPage) {
    const byPage = list.find((p) => getSpecialPage(p) === resolver.specialPage);
    if (byPage) return byPage;
  }

  const fragments = Array.isArray(resolver.homepageIncludes)
    ? resolver.homepageIncludes
    : [];
  for (const fragment of fragments) {
    const needle = String(fragment).toLowerCase();
    const found = list.find((p) => homepageUrlOf(p).includes(needle));
    if (found) return found;
  }

  return null;
}

export { NEWSLETTER_BANNER_IMAGE_FALLBACKS };

/**
 * Resolve primary homepage images for each newsletter banner surface.
 * Prefers live product data via specialPage / image URL; falls back to CDN constants.
 */
export function useNewsletterBannerImages() {
  const [images, setImages] = useState(NEWSLETTER_BANNER_IMAGE_FALLBACKS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.products);
        if (!res.ok) return;
        const products = await res.json();
        if (!Array.isArray(products) || cancelled) return;

        const next = { ...NEWSLETTER_BANNER_IMAGE_FALLBACKS };
        for (const [key, resolver] of Object.entries(NEWSLETTER_BANNER_RESOLVERS)) {
          const product = resolveNewsletterBannerProduct(products, resolver);
          const url = primaryImageOf(product);
          if (url) next[key] = url;
        }
        setImages(next);
      } catch (_) {
        // keep fallbacks
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return images;
}

/** @deprecated use useNewsletterBannerImages — kept for static imports */
export const NEWSLETTER_BANNER_IMAGES = NEWSLETTER_BANNER_IMAGE_FALLBACKS;
