import React, { useEffect } from 'react';
import { Container, Typography, Box, Paper, Link } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function SiteTerms() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography color="rgb(229, 90, 61)" variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                    {t.siteTermsPageTitle}
                </Typography>
                <Typography paragraph>{t.siteTermsIntro}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms1Title}</Typography>
                <Typography paragraph>{t.siteTerms1Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms2Title}</Typography>
                <Typography paragraph>{t.siteTerms2Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms3Title}</Typography>
                <Typography paragraph>{t.siteTerms3Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms4Title}</Typography>
                <Typography paragraph>{t.siteTerms4Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms5Title}</Typography>
                <Typography paragraph>{t.siteTerms5Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms6Title}</Typography>
                <Typography paragraph>{t.siteTerms6Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms7Title}</Typography>
                <Typography paragraph>{t.siteTerms7Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms8Title}</Typography>
                <Typography paragraph>{t.siteTerms8Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms9Title}</Typography>
                <Typography paragraph>{t.siteTerms9Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms10Title}</Typography>
                <Typography paragraph>{t.siteTerms10Text}</Typography>
                <Typography paragraph>{t.siteTerms10Text2}</Typography>
                <Typography paragraph>{t.siteTerms10Text3}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.siteTerms11Title}</Typography>
                <Typography paragraph>
                    {t.siteTerms11Contact}{' '}
                    <Link href="mailto:hamikdash.today@gmail.com" color="primary">{t.siteTermsEmail}</Link>
                </Typography>
            </Paper>
        </Container>
    );
}
