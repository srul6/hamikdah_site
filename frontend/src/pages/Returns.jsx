import React, { useEffect } from 'react';
import { Container, Typography, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { legalTitleSx, legalSectionHeadingSx, legalBodySx, legalBodySecondarySx } from '../styles/legalPageTypography';

export default function Returns() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography color="rgb(229, 90, 61)" variant="h3" component="h1" align="center" sx={legalTitleSx}>
                    {t.returnsTitle}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={{ ...legalSectionHeadingSx, mt: 1 }}>
                    {t.returnPeriod}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.returnPeriodText}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.eligibleItems}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    • {t.notOpened}<br />
                    • {t.wrapperNotOpened}<br />
                    • {t.notDamaged}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.nonEligibleItems}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    • {t.openedOrDamaged}<br />
                    • {t.over14Days}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.returnProcess}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.contactWithin14Days}<br />
                    {t.contactDetails}<br /><br />
                    {t.packageSecurely}<br />
                    {t.packageNote}<br /><br />
                    {t.shipToAddress}<br />
                    {t.address}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.refundTiming}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.refundTimingText}<br />
                    • {t.refund5to7Days}<br />
                    • {t.shippingNotIncluded}<br />
                    • {t.refundSameMethod}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.damagedItems}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.damagedItemsText}
                </Typography>
                <Typography paragraph sx={legalBodySecondarySx}>
                    {t.damagedItemsNote}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.shippingCosts}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.shippingCostsText}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>
                    {t.contactUs}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.contactUsText}
                </Typography>
                <Typography paragraph sx={legalBodySx}>
                    <strong>{isHebrew ? 'אימייל:' : 'Email:'}</strong> {t.returnsEmail}<br />
                    <strong>{isHebrew ? 'טלפון:' : 'Phone:'}</strong> {t.returnsPhone}<br />
                    <strong>{isHebrew ? 'כתובת:' : 'Address:'}</strong> {t.returnsAddress}
                </Typography>
            </Paper>
        </Container>
    );
}
