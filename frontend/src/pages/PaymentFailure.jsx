import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Alert,
    CircularProgress, Divider
} from '@mui/material';
import { Error, Refresh, ShoppingCart } from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { WHATSAPP_URL } from '../config';

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

        if (orderId && amount) {
            setPaymentDetails({
                orderId,
                amount: parseFloat(amount),
                currency,
                reason
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

    if (error) {
        return (
            <Container maxWidth="md" sx={{ pt: 15, pb: 8 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={handleContinueShopping}
                        sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                    >
                        {isHebrew ? t.backToWebsite : t.continueShopping}
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ pt: 15, pb: 8 }}>
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
                    <br />
                    {t.paymentFailedMessage2}
                </Typography>

                {/* Payment Details */}
                {paymentDetails && (
                    <Box sx={{
                        backgroundColor: 'rgba(255, 235, 238, 0.5)',
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

                        <Typography component="div" variant="body1" sx={{ mb: 1, direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.failureReason}:{' '}
                            <Typography component="span" fontWeight="bold" color="error.main">
                                {paymentDetails.reason}
                            </Typography>
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Alert severity="info" sx={{ direction: isHebrew ? 'rtl' : 'ltr', textAlign: isHebrew ? 'right' : 'left' }}>
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
                            '&:hover': { backgroundColor: 'rgba(229, 90, 61, 0.8)' },
                            direction: isHebrew ? 'rtl' : 'ltr',
                            '& .MuiButton-startIcon': { marginInlineEnd: 0.5 }
                        }}
                    >
                        {t.tryAgain}
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
