import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography
} from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import NewsletterSignupForm from '../newsletter/NewsletterSignupForm';
import NewsletterBannerImage, {
    useNewsletterBannerImages
} from '../newsletter/NewsletterBannerImage';

/**
 * Email unsubscribe links use the API confirm page. This SPA route remains for
 * footer/manual visits (no token) and redirects token links to the API page.
 */
export default function NewsletterUnsubscribePage() {
    const [searchParams] = useSearchParams();
    const token = (searchParams.get('token') || '').trim();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const bannerImages = useNewsletterBannerImages();

    const [status, setStatus] = useState('ready'); // ready | submitting | done | error
    const [message, setMessage] = useState('');

    // Token links from email are handled by the API HTML page (reliable without SPA deploy).
    useEffect(() => {
        if (!token) return;
        const apiBase = String(API_ENDPOINTS.newsletter || '').replace(/\/$/, '');
        window.location.replace(
            `${apiBase}/unsubscribe?token=${encodeURIComponent(token)}`
        );
    }, [token]);

    if (token) {
        return (
            <Box sx={{ py: 10, textAlign: 'center' }}>
                <CircularProgress sx={{ color: '#d8472a' }} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: { xs: '70vh', md: '75vh' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 4, md: 6 },
                px: 2,
                direction: isHebrew ? 'rtl' : 'ltr',
                boxSizing: 'border-box'
            }}
        >
            <Box
                sx={{
                    width: { xs: 'min(92vw, 360px)', sm: 380 },
                    maxWidth: 380,
                    borderRadius: 3,
                    backgroundColor: '#f5f0e3',
                    overflow: 'hidden',
                    boxShadow: '0 8px 28px rgba(0, 33, 68, 0.12)'
                }}
            >
                <NewsletterBannerImage
                    src={bannerImages.unsubscribe}
                    backgroundColor="#f5f0e3"
                />

                <Typography
                    component="h1"
                    sx={{
                        pt: { xs: 2.5, sm: 3 },
                        pb: 1.5,
                        px: { xs: 2, sm: 2.5 },
                        color: status === 'done' ? '#d8472a' : '#002144',
                        fontWeight: status === 'done' ? 800 : 700,
                        fontSize: { xs: '1.35rem', sm: '1.5rem' },
                        lineHeight: 1.3,
                        textAlign: 'center'
                    }}
                >
                    {status === 'done'
                        ? t.newsletterUnsubscribed
                        : t.newsletterUnsubscribeTitle}
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        pt: 0.5,
                        pb: 2.5,
                        px: { xs: 2, sm: 2.5 }
                    }}
                >
                    {status === 'done' ? (
                        <>
                            {message && message !== t.newsletterUnsubscribed && (
                                <Typography
                                    sx={{
                                        color: '#444',
                                        mb: 2.5,
                                        lineHeight: 1.55,
                                        fontSize: '0.98rem'
                                    }}
                                >
                                    {message}
                                </Typography>
                            )}
                            <Button
                                component={RouterLink}
                                to="/"
                                variant="contained"
                                size="small"
                                sx={{
                                    backgroundColor: '#d8472a',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    px: 2,
                                    '&:hover': { backgroundColor: '#c03d24' }
                                }}
                            >
                                {t.newsletterBackHome}
                            </Button>
                        </>
                    ) : status === 'error' ? (
                        <>
                            <Typography
                                sx={{
                                    color: '#444',
                                    mb: 2.5,
                                    lineHeight: 1.55,
                                    fontSize: '0.98rem'
                                }}
                            >
                                {message}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <Button
                                    onClick={() => setStatus('ready')}
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                        borderColor: '#d8472a',
                                        color: '#d8472a',
                                        textTransform: 'none',
                                        fontWeight: 700
                                    }}
                                >
                                    {t.newsletterTryAgain}
                                </Button>
                                <Button
                                    component={RouterLink}
                                    to="/"
                                    variant="contained"
                                    size="small"
                                    sx={{
                                        backgroundColor: '#d8472a',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        '&:hover': { backgroundColor: '#c03d24' }
                                    }}
                                >
                                    {t.newsletterBackHome}
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <>
                            <Typography
                                sx={{
                                    color: '#444',
                                    mb: 3,
                                    lineHeight: 1.55,
                                    fontSize: '0.98rem',
                                    textAlign: 'center'
                                }}
                            >
                                {t.newsletterUnsubscribeBody}
                            </Typography>
                            <Box sx={{ width: '100%' }}>
                                <NewsletterSignupForm
                                    mode="unsubscribe"
                                    requirePrivacyConsent={false}
                                    stackFields
                                    outlinedField
                                    onSuccess={({ status: s } = {}) => {
                                        if (s === 'unsubscribed') {
                                            setStatus('done');
                                            setMessage(t.newsletterUnsubscribed);
                                        }
                                    }}
                                />
                            </Box>
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
