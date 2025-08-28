import React, { useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function Returns() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                    {t.returnsTitle}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.returnPeriod}
                </Typography>
                <Typography paragraph>
                    {t.returnPeriodText}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.eligibleItems}
                </Typography>
                <Typography paragraph>
                    • {t.notOpened}<br />
                    • {t.wrapperNotOpened}<br />
                    • {t.notDamaged}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.nonEligibleItems}
                </Typography>
                <Typography paragraph>
                    • {t.openedOrDamaged}<br />
                    • {t.over14Days}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.returnProcess}
                </Typography>
                <Typography paragraph>
                    {t.contactWithin14Days}<br />
                    {t.contactDetails}<br /><br />
                    {t.packageSecurely}<br />
                    {t.packageNote}<br /><br />
                    {t.shipToAddress}<br />
                    {t.address}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.refundTiming}
                </Typography>
                <Typography paragraph>
                    {t.refundTimingText}<br />
                    • {t.refund5to7Days}<br />
                    • {t.shippingNotIncluded}<br />
                    • {t.refundSameMethod}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.damagedItems}
                </Typography>
                <Typography paragraph>
                    {t.damagedItemsText}
                </Typography>
                <Typography paragraph sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                    {t.damagedItemsNote}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.shippingCosts}
                </Typography>
                <Typography paragraph>
                    {t.shippingCostsText}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    {t.contactUs}
                </Typography>
                <Typography paragraph>
                    {t.contactUsText}
                </Typography>
                <Typography paragraph>
                    <strong>Email:</strong> {t.returnsEmail}<br />
                    <strong>Phone:</strong> {t.returnsPhone}<br />
                    <strong>Address:</strong> {t.returnsAddress}
                </Typography>
            </Paper>
        </Container>
    );
}
