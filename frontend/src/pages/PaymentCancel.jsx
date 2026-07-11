import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Alert,
    CircularProgress, Divider
} from '@mui/material';
import { Cancel, ShoppingCart, ArrowBack } from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { WHATSAPP_URL } from '../config';

export default function PaymentCancel() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState(null);

    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        // Extract payment details from URL parameters
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const currency = searchParams.get('currency') || 'ILS';
        if (orderId && amount) {
            setPaymentDetails({
                orderId,
                amount: parseFloat(amount),
                currency
            });
        }

        setIsLoading(false);
    }, [searchParams]);

    const handleBackToCart = () => {
        // Navigate back to cart to retry payment
        navigate('/cart');
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ pt: 15, pb: 8, textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                    {t.processing}
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ pt: 15, pb: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                {/* Cancel Icon */}
                <Cancel 
                    sx={{ 
                        fontSize: 80, 
                        color: 'warning.main',
                        mb: 3
                    }} 
                />

                {/* Cancel Message */}
                <Typography 
                    variant="h3" 
                    gutterBottom 
                    sx={{ 
                        color: 'warning.main',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 2
                    }}
                >
                    {t.paymentCancelled}
                </Typography>

                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: 'text.secondary',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 4
                    }}
                >
                    {t.paymentCancelledMessage}
                </Typography>

                {/* Payment Details */}
                {paymentDetails && (
                    <Box sx={{
                        backgroundColor: 'rgba(255, 244, 229, 0.5)',
                        borderRadius: 2,
                        p: 3,
                        mb: 4,
                        width: '100%',
                        textAlign: isHebrew ? 'right' : 'left',
                        direction: isHebrew ? 'rtl' : 'ltr'
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.orderSummary}
                        </Typography>

                        <Typography component="div" variant="body1" sx={{ mb: 1, direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.orderId}:{' '}
                            <Typography component="span" fontWeight="bold">
                                {paymentDetails.orderId}
                            </Typography>
                        </Typography>

                        <Typography component="div" variant="body1" sx={{ mb: 1, direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.total}:{' '}
                            <Typography component="span" fontWeight="bold">
                                ₪{paymentDetails.amount.toFixed(2)}
                            </Typography>
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Alert severity="info" sx={{ direction: isHebrew ? 'rtl' : 'ltr', textAlign: isHebrew ? 'right' : 'left' }}>
                            {t.paymentCancelledNote}
                        </Alert>
                    </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
                    <Button
                        variant="contained"
                        startIcon={<ArrowBack />}
                        onClick={handleBackToCart}
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            '&:hover': { backgroundColor: 'rgba(229, 90, 61, 0.8)' },
                            direction: isHebrew ? 'rtl' : 'ltr',
                            '& .MuiButton-startIcon': { marginInlineEnd: 0.5 }
                        }}
                    >
                        {t.backToCart}
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<ShoppingCart />}
                        onClick={handleContinueShopping}
                        sx={{
                            direction: isHebrew ? 'rtl' : 'ltr',
                            '& .MuiButton-startIcon': { marginInlineEnd: 0.5 },
                            '&:hover': { backgroundColor: 'white' }
                        }}
                    >
                        {isHebrew ? t.backToWebsite : t.continueShopping}
                    </Button>
                </Box>

                {/* Additional Information */}
                <Box sx={{ 
                    backgroundColor: 'rgba(245, 240, 227, 0.5)', 
                    borderRadius: 2, 
                    p: 3,
                    textAlign: isHebrew ? 'right' : 'left'
                }}>
                    <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.whyCancel}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.cancelReasons}
                    </Typography>

                    <Box sx={{ textAlign: isHebrew ? 'right' : 'left' }}>
                        <Typography variant="body2" component="ul" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            <li>{t.cancelReason1}</li>
                            <li>{t.cancelReason2}</li>
                            <li>{t.cancelReason3}</li>
                        </Typography>
                    </Box>
                </Box>

                {/* Support Information — same pattern as payment failure */}
                <Box sx={{
                    backgroundColor: 'rgba(245, 240, 227, 0.5)',
                    borderRadius: 2,
                    p: 3,
                    mt: 3,
                    textAlign: isHebrew ? 'right' : 'left'
                }}>
                    <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.needHelp}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.contactSupportMessage}
                    </Typography>

                    <Button
                        component="a"
                        href={WHATSAPP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="text"
                        startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                        sx={{
                            direction: isHebrew ? 'rtl' : 'ltr',
                            '& .MuiButton-startIcon': { marginInlineEnd: 1 }
                        }}
                    >
                        {t.contactSupport}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
