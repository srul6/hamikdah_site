import { useEffect } from 'react';
import { getImageUrl } from '../utils/imageUtils';
import { getProductPath } from '../utils/productSlug';
import { SITE_URL } from '../config';

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
 * Per-product SEO: title, description, canonical, Open Graph, Product JSON-LD.
 * Equal treatment for every product — no hardcoded product special cases.
 */
export default function ProductSeo({ product, allProducts = null }) {
    useEffect(() => {
        if (!product) return undefined;

        const previousTitle = document.title;
        const name = product.name_he || product.name_en || 'מוצר';
        const description =
            product.description_he ||
            product.description_en ||
            `${name} | חנות המקדש`;
        const path = getProductPath(product, allProducts);
        // getProductPath already encodes; build absolute URL carefully
        const pathForUrl = path.startsWith('/') ? path : `/${path}`;
        const canonicalUrl = `${SITE_URL.replace(/\/$/, '')}${pathForUrl}`;
        const imagePath = product.homepageImage || product.homepageimage;
        const imageUrl = imagePath ? getImageUrl(imagePath) : `${SITE_URL}/mikdash.jpg`;
        const absoluteImage = imageUrl.startsWith('http')
            ? imageUrl
            : `${SITE_URL.replace(/\/$/, '')}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

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

        const price = product.price != null ? Number(product.price) : undefined;
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description,
            url: canonicalUrl,
            image: absoluteImage,
            sku: String(product.id),
            brand: {
                '@type': 'Brand',
                name: 'חנות המקדש'
            }
        };

        if (Number.isFinite(price)) {
            jsonLd.offers = {
                '@type': 'Offer',
                url: canonicalUrl,
                priceCurrency: 'ILS',
                price: price,
                availability: (product.quantity > 0)
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock'
            };
        }

        upsertJsonLd('product-json-ld', jsonLd);

        return () => {
            document.title = previousTitle;
            const ld = document.getElementById('product-json-ld');
            if (ld) ld.remove();
        };
    }, [product, allProducts]);

    return null;
}
