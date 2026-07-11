import React, { useEffect } from 'react';
import { Container, Typography, Paper, Link } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { legalTitleSx, legalSectionHeadingSx, legalBodySx } from '../styles/legalPageTypography';

export default function SiteTerms() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography color="rgb(229, 90, 61)" variant="h4" component="h1" align="center" sx={legalTitleSx}>
                    {isHebrew ? t.siteTerms : t.siteTermsPageTitle}
                </Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTermsIntro}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={{ ...legalSectionHeadingSx, mt: 1 }}>{t.siteTerms1Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms1Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms2Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms2Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms3Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms3Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms4Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms4Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms5Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms5Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms6Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms6Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms7Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms7Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms8Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms8Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms9Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms9Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms10Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms10Text}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms10Text2}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.siteTerms10Text3}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.siteTerms11Title}</Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.siteTerms11Contact}{' '}
                    <Link href="mailto:hamikdash.today@gmail.com" color="primary" sx={{ fontSize: 'inherit' }}>{t.siteTermsEmail}</Link>
                </Typography>
            </Paper>
        </Container>
    );
}
