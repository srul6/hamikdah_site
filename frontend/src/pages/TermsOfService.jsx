import React, { useEffect } from 'react';
import { Container, Typography, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { legalTitleSx, legalSectionHeadingSx, legalBodySx, legalBodySecondarySx } from '../styles/legalPageTypography';

export default function TermsOfService() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography color="rgb(229, 90, 61)" variant="h3" component="h1" align="center" sx={legalTitleSx}>
                    {t.termsTitle}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={{ ...legalSectionHeadingSx, mt: 1 }}>
                    {t.cancellationPolicy}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.cancellationText}
                </Typography>
                <Typography paragraph sx={legalBodySecondarySx}>
                    {t.cancellationNote}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.warrantyTitle}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.warrantyText}
                </Typography>
                <Typography paragraph sx={legalBodySecondarySx}>
                    {t.warrantyNote}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.shippingTitle}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.shippingText}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.privacyTitle}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.privacyText}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.contactTitle}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.contactText}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    <strong>{isHebrew ? 'אימייל:' : 'Email:'}</strong> {t.termsEmail}<br />
                    <strong>{isHebrew ? 'טלפון:' : 'Phone:'}</strong> {t.termsPhone}<br />
                    <strong>{isHebrew ? 'כתובת:' : 'Address:'}</strong> {t.termsAddress}
                </Typography>
            </Paper>
        </Container>
    );
}
