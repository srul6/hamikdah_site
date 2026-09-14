import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { API_ENDPOINTS } from '../config';
import { getImageUrl } from '../utils/imageUtils';

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

function nameMatch(product, heName, enName) {
    const he = String(product?.name_he || '').trim();
    const en = String(product?.name_en || '').trim().toLowerCase();
    return he === heName || en === enName.toLowerCase();
}

function primaryImageOf(product) {
    if (!product) return '';
    return getImageUrl(product.homepageImage || product.homepageimage || '');
}

function isShabbatCandlesticks(product) {
    return nameMatch(product, 'פמוט לשבת', 'shabbat candle');
}

/** Fallback primary CDN URLs (homepage images) — never Shabbat candlesticks. */
export const NEWSLETTER_BANNER_IMAGE_FALLBACKS = {
    subscribe: 'https://cdn.bmikdash.com/3mikdash_4.jpeg', // בית המקדש השלישי
    gift: 'https://cdn.bmikdash.com/uploads/gilmanor/8b073295-a115-46bd-82fa-0a2383b8ee6d.png', // מיני מקדש
    unsubscribe: 'https://cdn.bmikdash.com/moshe-bateva.png' // משה בתיבה
};

const PRODUCT_PICKERS = {
    subscribe: (p) => nameMatch(p, 'בית המקדש השלישי', 'The Third Temple'),
    gift: (p) => nameMatch(p, 'מיני מקדש', 'Mini Temple'),
    unsubscribe: (p) => nameMatch(p, 'משה בתיבה', 'Moshe in the basket')
};

/**
 * Resolve primary homepage images for each newsletter banner surface.
 * Prefers live product data; falls back to known primary CDN URLs.
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
                for (const [key, match] of Object.entries(PRODUCT_PICKERS)) {
                    const product = products.find(
                        (p) => match(p) && !isShabbatCandlesticks(p)
                    );
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
