import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const isTest = searchParams.get('test') === 'true';

    useEffect(() => {
        // Scroll to top when page loads
        window.scrollTo(0, 0);
    }, []);

    const handleContinueShopping = () => {
        navigate('/');
    };

    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
                <CheckCircleIcon
                    sx={{
                        fontSize: 80,
                        color: 'success.main',
                        mb: 3
                    }}
                />

                <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 3
                    }}
                >
                    {isTest ? t.testPaymentSuccess : t.paymentSuccess}
                </Typography>

                {isTest && (
                    <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                        {t.testPaymentNote}
                    </Alert>
                )}

                <Typography
                    variant="h6"
                    sx={{
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 4,
                        color: 'text.secondary'
                    }}
                >
                    {isTest
                        ? t.testPaymentMessage
                        : t.thankYouPurchase
                    }
                </Typography>

                <Box sx={{ mt: 4 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleContinueShopping}
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' },
                            mr: 2
                        }}
                    >
                        {t.continueShopping}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
