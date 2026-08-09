import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { fetchProductById, fetchProducts } from '../api/products';
import ProductDetail from './ProductDetail';
import MikdashProductPage from './MikdashProductPage';
import ProductSeo from '../components/ProductSeo';
import { Container, CircularProgress, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { subscribe } from '../consent/consentManager';
import { trackViewContent, resetViewContentDedupe } from '../analytics/metaTracking';
import { trackGa4ViewItem, resetGa4ViewItemDedupe } from '../analytics/ga4Tracking';
import {
    findProductBySlug,
    getProductPath,
    isMikdashProduct,
    isNumericProductParam
} from '../utils/productSlug';

/**
 * Central gatekeeper for product pages.
 * Resolves Hebrew SEO slug (or legacy numeric ID) → product → UI.
 */
export default function ProductPageRouter({ onAddToCart }) {
    const { productSlug } = useParams();
    const [allProducts, setAllProducts] = useState([]);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [redirectTo, setRedirectTo] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const resolve = async () => {
            setLoading(true);
            setNotFound(false);
            setRedirectTo(null);
            setProduct(null);
            resetViewContentDedupe();
            resetGa4ViewItemDedupe();

            try {
                const products = await fetchProducts();
                if (cancelled) return;
                const list = Array.isArray(products) ? products : [];
                setAllProducts(list);

                if (!productSlug) {
                    setNotFound(true);
                    return;
                }

                // Legacy numeric URLs → canonical Hebrew slug (client-side; Express also 301s in prod)
                if (isNumericProductParam(productSlug)) {
                    let byId = list.find((p) => String(p.id) === String(productSlug));
                    if (!byId) {
                        try {
                            byId = await fetchProductById(productSlug);
                        } catch {
                            byId = null;
                        }
                    }
                    if (cancelled) return;
                    if (!byId) {
                        setNotFound(true);
                        return;
                    }
                    setRedirectTo(getProductPath(byId, list.length ? list : [byId]));
                    return;
                }

                const matched = findProductBySlug(list, productSlug);
                if (cancelled) return;

                if (!matched) {
                    setNotFound(true);
                    return;
                }

                setProduct(matched);
            } catch (err) {
                console.error('Error resolving product slug:', err);
                if (!cancelled) setNotFound(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        resolve();
        return () => {
            cancelled = true;
        };
    }, [productSlug]);

    // ViewContent after product resolves; retry when advertising consent is granted later
    useEffect(() => {
        if (loading || !product || product.id == null) {
            return undefined;
        }

        const tryTrack = () => {
            try {
                trackViewContent(product);
            } catch (_) {
                // Tracking must never break product pages
            }
            try {
                trackGa4ViewItem(product);
            } catch (_) {
                // Tracking must never break product pages
            }
        };

        tryTrack();
        return subscribe(tryTrack);
    }, [loading, product]);

    if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
    }

    if (loading) {
        return (
            <Container sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh',
                pt: 14
            }}>
                <CircularProgress size={60} sx={{ color: 'rgba(199, 61, 34, 1)' }} />
            </Container>
        );
    }

    if (notFound || !product) {
        return (
            <Container sx={{ pt: 16, pb: 8, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    המוצר לא נמצא
                </Typography>
                <Button component={RouterLink} to="/" variant="contained">
                    חזרה לדף הבית
                </Button>
            </Container>
        );
    }

    const showMikdash = isMikdashProduct(product);

    return (
        <>
            <ProductSeo product={product} allProducts={allProducts} />
            {showMikdash ? (
                <MikdashProductPage product={product} onAddToCart={onAddToCart} />
            ) : (
                <ProductDetail
                    product={product}
                    allProducts={allProducts}
                    onAddToCart={onAddToCart}
                />
            )}
        </>
    );
}
