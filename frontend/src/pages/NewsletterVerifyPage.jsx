import React, { useEffect } from 'react';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

/**
 * Legacy SPA route. Email links now hit the API directly; this page forwards
 * old /newsletter/verify?token=… links to the backend HTML confirm page.
 */
export default function NewsletterVerifyPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        if (!token) return;
        const apiUrl = `${API_ENDPOINTS.newsletter}/verify?token=${encodeURIComponent(token)}&format=html`;
        window.location.replace(apiUrl);
    }, [token]);

    if (!token) {
        return (
            <Container maxWidth="sm" sx={{ py: { xs: 10, md: 14 }, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#002144', mb: 2 }}>
                        {t.newsletterVerifyFailed}
                    </Typography>
                    <Typography sx={{ color: '#666' }}>{t.newsletterVerifyInvalid}</Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 10, md: 14 }, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#d8472a' }} />
        </Container>
    );
}
