import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Alert,
    CircularProgress, Divider
} from '@mui/material';
import { CheckCircle, Receipt, Email } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function PaymentSuccess() {
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
        const documentId = searchParams.get('documentId');
        const customerEmail = searchParams.get('customerEmail');

        if (orderId && amount) {
            setPaymentDetails({
                orderId,
                amount: parseFloat(amount),
                currency,
                documentId,
                customerEmail
            });
        } else {
            setError('Payment details not found');
        }

        setIsLoading(false);
    }, [searchParams]);

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewInvoice = () => {
        if (paymentDetails?.documentId) {
            // Open invoice in new tab (GreenInvoice will provide the URL)
            window.open(`https://www.greeninvoice.co.il/documents/${paymentDetails.documentId}`, '_blank');
        }
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
        <Container maxWidth="md" sx={{ pt: 15, pb: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                {/* Success Icon */}
                <CheckCircle
                    sx={{
                        fontSize: 80,
                        color: 'success.main',
                        mb: 3
                    }}
                />

                {/* Success Message */}
                <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                        color: 'success.main',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 2
                    }}
                >
                    {t.paymentSuccess}
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        color: 'text.secondary',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 4
                    }}
                >
                    {t.thankYouPurchase}
                </Typography>

                {/* Payment Details */}
                {paymentDetails && (
                    <Box sx={{
                        backgroundColor: 'rgba(245, 240, 227, 0.5)',
                        borderRadius: 2,
                        p: 3,
                        mb: 4,
                        textAlign: isHebrew ? 'right' : 'left'
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.orderSummary}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexDirection: isHebrew ? 'row-reverse' : 'row' }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.orderId}:
                            </Typography>
                            <Typography fontWeight="bold">
                                {paymentDetails.orderId}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexDirection: isHebrew ? 'row-reverse' : 'row' }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.total}:
                            </Typography>
                            <Typography fontWeight="bold">
                                ₪{paymentDetails.amount.toFixed(2)}
                            </Typography>
                        </Box>

                        {paymentDetails.documentId && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexDirection: isHebrew ? 'row-reverse' : 'row' }}>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                    {t.invoiceNumber}:
                                </Typography>
                                <Typography fontWeight="bold">
                                    {paymentDetails.documentId}
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {!isHebrew && <Email color="action" />}
                            <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.invoiceEmailSent} {paymentDetails.customerEmail}
                            </Typography>
                            {isHebrew && <Email color="action" />}
                        </Box>
                    </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {paymentDetails?.documentId && (
                        <Button
                            variant="outlined"
                            startIcon={<Receipt />}
                            onClick={handleViewInvoice}
                            sx={{
                                direction: isHebrew ? 'rtl' : 'ltr',
                                '& .MuiButton-startIcon': {
                                    marginLeft: isHebrew ? '6px' : '-6px',
                                    marginRight: isHebrew ? '-6px' : '6px'
                                }
                            }}
                        >
                            {t.viewInvoice}
                        </Button>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleContinueShopping}
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' },
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {t.continueShopping}
                    </Button>
                </Box>

                {/* Additional Information */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.paymentSuccessNote}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
