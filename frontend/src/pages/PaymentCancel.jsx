import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Alert,
    CircularProgress, Divider
} from '@mui/material';
import { Cancel, ShoppingCart, ArrowBack } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

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
        const customerEmail = searchParams.get('customerEmail');

        if (orderId && amount) {
            setPaymentDetails({
                orderId,
                amount: parseFloat(amount),
                currency,
                customerEmail
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
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                    {t.processing}
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
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
                        textAlign: isHebrew ? 'right' : 'left'
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.orderSummary}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.orderId}:
                            </Typography>
                            <Typography fontWeight="bold">
                                {paymentDetails.orderId}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.total}:
                            </Typography>
                            <Typography fontWeight="bold">
                                ₪{paymentDetails.amount.toFixed(2)}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Alert severity="info" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
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
                            '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' },
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {t.backToCart}
                    </Button>
                    
                    <Button
                        variant="outlined"
                        startIcon={<ShoppingCart />}
                        onClick={handleContinueShopping}
                        sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                    >
                        {t.continueShopping}
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
            </Paper>
        </Container>
    );
}
