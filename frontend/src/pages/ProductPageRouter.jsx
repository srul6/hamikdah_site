import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProductById } from '../api/products';
import ProductDetail from './ProductDetail';
import MikdashProductPage from './MikdashProductPage';
import { Container, Typography, CircularProgress } from '@mui/material';

export default function ProductPageRouter({ onAddToCart }) {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                const productData = await fetchProductById(id);
                setProduct(productData);
            } catch (err) {
                console.error('Error loading product:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadProduct();
        }
    }, [id]);

    // Check if this is THE Mikdash product (exact match only)
    const isMikdashProduct = product && (
        (product.name_he && product.name_he.trim() === 'המקדש') ||
        (product.name_en && product.name_en.trim().toLowerCase() === 'the temple')
    );

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

    // Route to appropriate component based on product type
    if (isMikdashProduct) {
        return <MikdashProductPage onAddToCart={onAddToCart} />;
    } else {
        return <ProductDetail onAddToCart={onAddToCart} />;
    }
}
