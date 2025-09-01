import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Alert,
    CircularProgress, Divider
} from '@mui/material';
import { Error, Refresh, ShoppingCart } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function PaymentFailure() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [error, setError] = useState(null);

    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        // Extract payment details from URL parameters
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const currency = searchParams.get('currency') || 'ILS';
        const reason = searchParams.get('reason') || 'Payment failed';
        const customerEmail = searchParams.get('customerEmail');

        if (orderId && amount) {
            setPaymentDetails({
                orderId,
                amount: parseFloat(amount),
                currency,
                reason,
                customerEmail
            });
        } else {
            setError('Payment details not found');
        }

        setIsLoading(false);
    }, [searchParams]);

    const handleTryAgain = () => {
        // Navigate back to cart to retry payment
        navigate('/cart');
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleContactSupport = () => {
        // Open email client with support email
        const subject = encodeURIComponent(`Payment Failed - Order ${paymentDetails?.orderId}`);
        const body = encodeURIComponent(`
Payment failed for order ${paymentDetails?.orderId}

Amount: ₪${paymentDetails?.amount}
Reason: ${paymentDetails?.reason}

Please help me resolve this issue.
        `);
        window.open(`mailto:support@yourbusiness.com?subject=${subject}&body=${body}`);
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

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={handleContinueShopping}
                        sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                    >
                        {t.continueShopping}
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                {/* Error Icon */}
                <Error 
                    sx={{ 
                        fontSize: 80, 
                        color: 'error.main',
                        mb: 3
                    }} 
                />

                {/* Error Message */}
                <Typography 
                    variant="h3" 
                    gutterBottom 
                    sx={{ 
                        color: 'error.main',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 2
                    }}
                >
                    {t.paymentFailed}
                </Typography>

                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: 'text.secondary',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 4
                    }}
                >
                    {t.paymentFailedMessage}
                </Typography>

                {/* Payment Details */}
                {paymentDetails && (
                    <Box sx={{ 
                        backgroundColor: 'rgba(255, 235, 238, 0.5)', 
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

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.failureReason}:
                            </Typography>
                            <Typography fontWeight="bold" color="error.main">
                                {paymentDetails.reason}
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Alert severity="info" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.paymentFailureNote}
                        </Alert>
                    </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 4 }}>
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={handleTryAgain}
                        sx={{ 
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' },
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {t.tryAgain}
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

                {/* Support Information */}
                <Box sx={{ 
                    backgroundColor: 'rgba(245, 240, 227, 0.5)', 
                    borderRadius: 2, 
                    p: 3,
                    textAlign: isHebrew ? 'right' : 'left'
                }}>
                    <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.needHelp}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.contactSupportMessage}
                    </Typography>

                    <Button
                        variant="text"
                        onClick={handleContactSupport}
                        sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                    >
                        {t.contactSupport}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
