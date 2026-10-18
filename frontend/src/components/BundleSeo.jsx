import { useEffect } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { getBundlePath } from '../utils/bundleSlug';
import { SITE_URL } from '../config';
import { getBundlePricingView } from '../utils/bundlePricingView';

function upsertMeta(attr, key, content) {
    if (typeof document === 'undefined' || content == null || content === '') return null;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
    return el;
}

function upsertLink(rel, href) {
    if (typeof document === 'undefined' || !href) return null;
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
    }
    el.setAttribute('href', href);
    return el;
}

function upsertJsonLd(id, data) {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = id;
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return el;
}

/**
 * Per-bundle SEO — mirrors ProductSeo title suffix / OG / JSON-LD pattern.
 */
export default function BundleSeo({ bundle }) {
    useEffect(() => {
        if (!bundle) return undefined;

        const previousTitle = document.title;
        const name = bundle.name_he || bundle.name_en || 'באנדל';
        const componentNames = (bundle.items || [])
            .map((item) => item?.product?.name_he || item?.product?.name_en)
            .filter(Boolean)
            .join(' + ');
        const description = componentNames
            ? `${name}: ${componentNames} | חנות המקדש`
            : `${name} | חנות המקדש`;

        const path = getBundlePath(bundle);
        const pathForUrl = path.startsWith('/') ? path : `/${path}`;
        const canonicalUrl = `${SITE_URL.replace(/\/$/, '')}${pathForUrl}`;

        const firstProduct = bundle.items?.[0]?.product;
        const imagePath =
            bundle.image ||
            firstProduct?.homepageImage ||
            firstProduct?.homepageimage;
        const imageUrl = imagePath
            ? getImageUrl(imagePath)
            : `${SITE_URL}/mikdash.jpg`;
        const absoluteImage = String(imageUrl || '').startsWith('http')
            ? imageUrl
            : `${SITE_URL.replace(/\/$/, '')}${String(imageUrl || '').startsWith('/') ? '' : '/'}${imageUrl || ''}`;

        document.title = `${name} | חנות המקדש`;

        upsertMeta('name', 'description', description);
        upsertLink('canonical', canonicalUrl);

        upsertMeta('property', 'og:type', 'product');
        upsertMeta('property', 'og:url', canonicalUrl);
        upsertMeta('property', 'og:title', name);
        upsertMeta('property', 'og:description', description);
        upsertMeta('property', 'og:image', absoluteImage);
        upsertMeta('property', 'og:locale', 'he_IL');
        upsertMeta('property', 'og:site_name', 'חנות המקדש');

        upsertMeta('name', 'twitter:card', 'summary_large_image');
        upsertMeta('name', 'twitter:title', name);
        upsertMeta('name', 'twitter:description', description);
        upsertMeta('name', 'twitter:image', absoluteImage);

        const pricing = getBundlePricingView(bundle);
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description,
            url: canonicalUrl,
            image: absoluteImage,
            sku: `bundle-${bundle.id}`,
            brand: {
                '@type': 'Brand',
                name: 'חנות המקדש'
            },
            offers: {
                '@type': 'Offer',
                url: canonicalUrl,
                priceCurrency: 'ILS',
                price: pricing.finalPrice,
                availability: bundle.available !== false
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock'
            }
        };

        upsertJsonLd('bundle-json-ld', jsonLd);

        return () => {
            document.title = previousTitle;
            const ld = document.getElementById('bundle-json-ld');
            if (ld) ld.remove();
        };
    }, [bundle]);

    return null;
}
