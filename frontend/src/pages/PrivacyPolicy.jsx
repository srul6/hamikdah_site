import React, { useEffect } from 'react';
import { Container, Typography, Box, Paper, Link } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function PrivacyPolicy() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography color="rgb(229, 90, 61)" variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                    {t.privacyPageTitle}
                </Typography>
                <Typography paragraph>{t.privacyIntro}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy1Title}</Typography>
                <Typography paragraph>{t.privacy1Intro}</Typography>
                <Typography component="ul" sx={{ pl: 4 }}>
                    {t.privacy1List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>
                <Typography paragraph>{t.privacy1Outro}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy2Title}</Typography>
                <Typography paragraph>{t.privacy2Intro}</Typography>
                <Typography component="ul" sx={{ pl: 4 }}>
                    {t.privacy2List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy3Title}</Typography>
                <Typography paragraph>{t.privacy3Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy4Title}</Typography>
                <Typography paragraph>{t.privacy4Intro}</Typography>
                <Typography component="ul" sx={{ pl: 4 }}>
                    {t.privacy4List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy5Title}</Typography>
                <Typography paragraph>{t.privacy5Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy6Title}</Typography>
                <Typography paragraph>{t.privacy6Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy7Title}</Typography>
                <Typography paragraph>{t.privacy7Text}</Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy8Title}</Typography>
                <Typography paragraph>
                    {t.privacy8Contact}{' '}
                    <Link href="mailto:hamikdash.today@gmail.com" color="primary">{t.siteTermsEmail}</Link>
                </Typography>
                <Typography color="rgb(229, 90, 61)" variant="h5" gutterBottom sx={{ mt: 3 }}>{t.privacy9Title}</Typography>
                <Typography paragraph>{t.privacy9Text}</Typography>
            </Paper>
        </Container>
    );
}
