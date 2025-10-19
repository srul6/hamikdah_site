import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { FormDataProvider } from './contexts/FormDataContext';
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

// Inner component that uses cart context
function AppContent() {
    const { cart, addToCart: addToCartContext, removeFromCart: removeFromCartContext, updateQuantity: updateQuantityContext } = useCart();

    // Wrapper function to maintain compatibility with existing addToCart signature
    const handleAddToCart = (product, selectedColor = null) => {
        // Create uniqueId for compatibility
        const colorId = selectedColor ? selectedColor.name || selectedColor.name_en : null;
        const uniqueId = colorId ? `${product.id}-${colorId}` : product.id;

        // Add displayName for compatibility
        const displayName = selectedColor ?
            `${product.name_he || product.name_en} - ${selectedColor.name_he || selectedColor.name}` :
            (product.name_he || product.name_en);

        // Use context's addToCart with color
        addToCartContext({
            ...product,
            uniqueId,
            displayName
        }, 1, selectedColor);
    };

    // Wrapper for removeFromCart to use uniqueId
    const handleRemoveFromCart = (uniqueId) => {
        // Find the item by uniqueId
        const item = cart.find(item => item.uniqueId === uniqueId);
        if (item) {
            removeFromCartContext(item.id, item.selectedColor);
        }
    };

    // Wrapper for updateQuantity to use uniqueId
    const handleUpdateQuantity = (uniqueId, newQuantity) => {
        // Find the item by uniqueId
        const item = cart.find(item => item.uniqueId === uniqueId);
        if (item) {
            updateQuantityContext(item.id, newQuantity, item.selectedColor);
        }
    };

    // Calculate cart count for navbar
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'rgba(245, 240, 227, 0.9)' }}>
            <Navbar
                cartCount={cartCount}
                cart={cart}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
            />
            <Routes>
                <Route path="/" element={<Home onAddToCart={handleAddToCart} />} />
                <Route path="/product/:id" element={<ProductPageRouter onAddToCart={handleAddToCart} />} />
                <Route path="/cart" element={<CartPage cart={cart} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} />} />
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
    );
}

// Main App component with all providers
export default function App() {
    return (
        <LanguageProvider>
            <CartProvider>
                <FormDataProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </FormDataProvider>
            </CartProvider>
        </LanguageProvider>
    );
}
