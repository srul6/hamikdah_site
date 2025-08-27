import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Container, Typography, Box, Button, Paper
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const transactionId = searchParams.get('TransactionId');
    const approvalNumber = searchParams.get('ApprovalNumber');

    const handleContinueShopping = () => {
        navigate('/');
    };

    return (
        <Box sx={{
            backgroundColor: 'rgba(245, 240, 227, 0.9)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pt: 8
        }}>
            <Container maxWidth="md">
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '2px solid #4caf50',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <CheckCircleIcon
                        sx={{
                            fontSize: 80,
                            color: '#4caf50',
                            mb: 3
                        }}
                    />

                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 600,
                            color: '#1d1d1f',
                            mb: 3,
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {t.paymentSuccess}
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            color: '#666',
                            mb: 4,
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {t.thankYouPurchase}
                    </Typography>

                    {transactionId && (
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#666',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {t.transactionId} {transactionId}
                            </Typography>
                            {approvalNumber && (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#666',
                                        direction: isHebrew ? 'rtl' : 'ltr'
                                    }}
                                >
                                    {t.approvalNumber} {approvalNumber}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleContinueShopping}
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            color: '#ffffff',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            borderRadius: 1.5,
                            direction: isHebrew ? 'rtl' : 'ltr',
                            '&:hover': {
                                backgroundColor: 'rgba(199, 61, 34, 1)'
                            }
                        }}
                    >
                        {t.continueShopping}
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}
