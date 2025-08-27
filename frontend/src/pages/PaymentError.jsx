import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Container, Typography, Box, Button, Paper
} from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function PaymentError() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const errorCode = searchParams.get('ResponseCode');
    const errorMessage = searchParams.get('ResponseText');

    const handleTryAgain = () => {
        navigate('/cart');
    };

    const handleGoHome = () => {
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
                        border: '2px solid #f44336',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <ErrorIcon
                        sx={{
                            fontSize: 80,
                            color: '#f44336',
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
                        {t.paymentError}
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            color: '#666',
                            mb: 4,
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {t.paymentFailedMessage}
                    </Typography>

                    {errorCode && (
                        <Box sx={{ mb: 3 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#666',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {t.errorCode} {errorCode}
                            </Typography>
                            {errorMessage && (
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#666',
                                        direction: isHebrew ? 'rtl' : 'ltr'
                                    }}
                                >
                                    {t.errorMessage} {errorMessage}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleTryAgain}
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
                            {t.tryAgain}
                        </Button>

                        <Button
                            variant="outlined"
                            size="large"
                            onClick={handleGoHome}
                            sx={{
                                borderColor: 'rgba(229, 90, 61, 1)',
                                color: 'rgba(229, 90, 61, 1)',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 500,
                                borderRadius: 1.5,
                                direction: isHebrew ? 'rtl' : 'ltr',
                                '&:hover': {
                                    borderColor: 'rgba(199, 61, 34, 1)',
                                    backgroundColor: 'rgba(229, 90, 61, 0.1)'
                                }
                            }}
                        >
                            {t.goHome}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
