import React, { useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function TermsOfService() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                    {t.termsTitle}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.cancellationPolicy}
                </Typography>
                <Typography paragraph>
                    {t.cancellationText}
                </Typography>
                <Typography paragraph sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {t.cancellationNote}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.warrantyTitle}
                </Typography>
                <Typography paragraph>
                    {t.warrantyText}
                </Typography>
                <Typography paragraph sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {t.warrantyNote}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.shippingTitle}
                </Typography>
                <Typography paragraph>
                    {t.shippingText}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.privacyTitle}
                </Typography>
                <Typography paragraph>
                    {t.privacyText}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.contactTitle}
                </Typography>
                <Typography paragraph>
                    {t.contactText}
                </Typography>
                <Typography paragraph>
                    <strong>Email:</strong> {t.termsEmail}<br />
                    <strong>Phone:</strong> {t.termsPhone}<br />
                    <strong>Address:</strong> {t.termsAddress}
                </Typography>
            </Paper>
        </Container>
    );
}
