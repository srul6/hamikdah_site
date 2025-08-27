import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import AdminPanel from './pages/AdminPanel';
import TermsOfService from './pages/TermsOfService';
import Returns from './pages/Returns';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentError from './pages/PaymentError';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

export default function App() {
    const [cart, setCart] = useState([]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(prevCart =>
            prevCart.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    return (
        <LanguageProvider>
            <Router>
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'rgba(245, 240, 227, 0.9)' }}>
                    <Navbar cartCount={cart.length} />
                    <Routes>
                        <Route path="/" element={<Home onAddToCart={addToCart} />} />
                        <Route path="/product/:id" element={<ProductDetail onAddToCart={addToCart} />} />
                        <Route path="/cart" element={<CartPage cart={cart} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/returns" element={<Returns />} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/error" element={<PaymentError />} />
                    </Routes>
                    <Footer />
                </Box>
            </Router>
        </LanguageProvider>
    );
}