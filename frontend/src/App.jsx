import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './pages/Home';
import ProductPageRouter from './pages/ProductPageRouter';
import CartPage from './pages/CartPage';
import AdminPanel from './pages/AdminPanel';
import AboutUs from './pages/AboutUs';
import TermsOfService from './pages/TermsOfService';
import Returns from './pages/Returns';
import GreenInvoicePayment from './pages/GreenInvoicePayment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentCancel from './pages/PaymentCancel';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function App() {
    const [cart, setCart] = useState([]);

    const addToCart = (product, selectedColor = null) => {
        setCart(prevCart => {
            // Create unique identifier based on product ID and color
            const colorId = selectedColor ? selectedColor.name || selectedColor.name_en : null;
            const uniqueId = colorId ? `${product.id}-${colorId}` : product.id;

            const existingItem = prevCart.find(item =>
                item.uniqueId === uniqueId ||
                (item.id === product.id && item.selectedColor?.name === selectedColor?.name)
            );

            if (existingItem) {
                return prevCart.map(item =>
                    (item.uniqueId === uniqueId ||
                        (item.id === product.id && item.selectedColor?.name === selectedColor?.name))
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prevCart, {
                ...product,
                quantity: 1,
                selectedColor: selectedColor,
                uniqueId: uniqueId,
                displayName: selectedColor ?
                    `${product.name_he || product.name_en} - ${selectedColor.name_he || selectedColor.name}` :
                    (product.name_he || product.name_en)
            }];
        });
    };

    const removeFromCart = (uniqueId) => {
        setCart(prevCart => prevCart.filter(item => item.uniqueId !== uniqueId));
    };

    const updateQuantity = (uniqueId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.uniqueId === uniqueId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    return (
        <LanguageProvider>
            <Router>
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'rgba(245, 240, 227, 0.9)' }}>
                    <Navbar
                        cartCount={cart.length}
                        cart={cart}
                        onRemoveFromCart={removeFromCart}
                        onUpdateQuantity={updateQuantity}
                    />
                    <Routes>
                        <Route path="/" element={<Home onAddToCart={addToCart} />} />
                        <Route path="/product/:id" element={<ProductPageRouter onAddToCart={addToCart} />} />
                        <Route path="/cart" element={<CartPage cart={cart} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/returns" element={<Returns />} />
                        <Route path="/payment" element={<GreenInvoicePayment />} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/failure" element={<PaymentFailure />} />
                        <Route path="/payment/cancel" element={<PaymentCancel />} />

                    </Routes>
                    <Footer />
                </Box>
            </Router>
        </LanguageProvider>
    );
}