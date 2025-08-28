import React from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Divider
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function TermsOfService() {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    return (
        <Box sx={{ py: 4, minHeight: '100vh', backgroundColor: 'rgb(245, 240, 227)', mt: 8 }}>
            <Container maxWidth="md">
                <Paper elevation={0} sx={{
                    p: 4,
                    backgroundColor: 'white',
                    direction: isHebrew ? 'rtl' : 'ltr',
                    textAlign: isHebrew ? 'right' : 'left'
                }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{
                        color: 'rgba(229, 90, 61, 1)',
                        fontWeight: 600,
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: 'center',
                        mb: 4
                    }}>
                        {t.termsTitle || 'Terms of Service'}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        1. {t.cancellationPolicy}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.cancellationText}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.cancellationNote}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        2. {t.warrantyTitle}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.warrantyText}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.warrantyNote}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        3. {t.shippingTitle}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.shippingText}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        4. {t.privacyTitle}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.privacyText}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        5. {t.contactTitle}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.contactText}<br />
                        Email: {t.termsEmail}<br />
                        {isHebrew ? 'טלפון' : 'Phone'}: {t.termsPhone}<br />
                        {isHebrew ? 'כתובת' : 'Address'}: {t.termsAddress}
                    </Typography>
                    <Typography variant="body1" paragraph >

                    </Typography>

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                        These terms are subject to change. Please review them periodically for updates.
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
