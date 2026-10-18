import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider, useCart } from './contexts/CartContext';
import { FormDataProvider } from './contexts/FormDataContext';
import Home from './pages/Home';
import ProductPageRouter from './pages/ProductPageRouter';
import BundlePage from './pages/BundlePage';
import CartPage from './pages/CartPage';
import AdminPanel from './pages/AdminPanel';
import AboutUs from './pages/AboutUs';
import TermsOfService from './pages/TermsOfService';
import SiteTerms from './pages/SiteTerms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Returns from './pages/Returns';
import GreenInvoicePayment from './pages/GreenInvoicePayment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentCancel from './pages/PaymentCancel';
import NewsletterVerifyPage from './pages/NewsletterVerifyPage';
import NewsletterUnsubscribePage from './pages/NewsletterUnsubscribePage';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import ClarityAnalytics from './analytics/ClarityAnalytics';
import MetaPixelAnalytics from './analytics/MetaPixelAnalytics';
import GA4Analytics from './analytics/GA4Analytics';
import { ConsentProvider } from './consent/ConsentContext';
import CookieConsentUI from './consent/CookieConsentUI';
import { NewsletterProvider } from './newsletter/NewsletterContext';
import NewsletterModal from './newsletter/NewsletterModal';
import { GiftProvider, useGifts } from './gifts/GiftContext';
import { BundlesProvider } from './contexts/BundlesContext';
import { trackAddToCart } from './analytics/metaTracking';
import { trackGa4AddToCart } from './analytics/ga4Tracking';

function AppContent() {
    const {
        cart,
        addToCart: addToCartContext,
        addBundleToCart: addBundleToCartContext,
        removeFromCart: removeFromCartContext,
        updateQuantity: updateQuantityContext
    } = useCart();
    const { notifyGiftUnlocked } = useGifts();

    const handleAddToCart = (product, selectedColor = null) => {
        addToCartContext(product, 1, selectedColor);
        try {
            notifyGiftUnlocked(product, selectedColor);
        } catch (_) {
            /* gifts optional */
        }
        try {
            trackAddToCart(product, 1);
        } catch (_) {
            // Tracking must never break shopping
        }
        try {
            trackGa4AddToCart(product, 1);
        } catch (_) {
            // Tracking must never break shopping
        }
    };

    const handleAddBundle = (bundle, selection = {}) => {
        addBundleToCartContext(bundle, selection, 1);
        try {
            trackAddToCart({
                id: `bundle-${bundle.id}`,
                name_he: bundle.name_he,
                name_en: bundle.name_en,
                price: Number(bundle.finalPrice ?? bundle.price) || 0
            }, 1);
        } catch (_) {
            /* tracking optional */
        }
        try {
            trackGa4AddToCart({
                id: `bundle-${bundle.id}`,
                name_he: bundle.name_he,
                name_en: bundle.name_en,
                price: Number(bundle.finalPrice ?? bundle.price) || 0
            }, 1);
        } catch (_) {
            /* tracking optional */
        }
    };

    const handleRemoveFromCart = (uniqueId) => {
        // Prefer uniqueId so distinct bundle color combos are removed independently
        removeFromCartContext(uniqueId);
    };

    const handleUpdateQuantity = (uniqueId, newQuantity) => {
        updateQuantityContext(uniqueId, newQuantity);
    };

    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'rgba(245, 240, 227, 0.9)' }}>
            <Navbar
                cartCount={cartCount}
                cart={cart}
                onRemoveFromCart={handleRemoveFromCart}
                onUpdateQuantity={handleUpdateQuantity}
            />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Routes>
                    <Route path="/" element={<Home onAddToCart={handleAddToCart} onAddBundle={handleAddBundle} />} />
                    <Route path="/product/:productSlug" element={<ProductPageRouter onAddToCart={handleAddToCart} />} />
                    <Route path="/bundle/:slug" element={<BundlePage onAddBundle={handleAddBundle} />} />
                    <Route path="/cart" element={<CartPage cart={cart} onRemove={handleRemoveFromCart} onUpdateQuantity={handleUpdateQuantity} />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/site-terms" element={<SiteTerms />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/payment" element={<GreenInvoicePayment />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/failure" element={<PaymentFailure />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                    <Route path="/newsletter/verify" element={<NewsletterVerifyPage />} />
                    <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />
                </Routes>
            </Box>
            <Footer />
            <WhatsAppFloatingButton />
            <NewsletterModal />
        </Box>
    );
}

export default function App() {
    return (
        <LanguageProvider>
            <ConsentProvider>
                <BundlesProvider>
                    <CartProvider>
                        <FormDataProvider>
                            <NewsletterProvider>
                                <Router>
                                    <GiftProvider>
                                        <ClarityAnalytics />
                                        <MetaPixelAnalytics />
                                        <GA4Analytics />
                                        <AppContent />
                                        <CookieConsentUI />
                                    </GiftProvider>
                                </Router>
                            </NewsletterProvider>
                        </FormDataProvider>
                    </CartProvider>
                </BundlesProvider>
            </ConsentProvider>
        </LanguageProvider>
    );
}
