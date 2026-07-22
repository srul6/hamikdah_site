import React, { useEffect } from 'react';
import { Container, Typography, Paper, Link } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { legalTitleSx, legalSectionHeadingSx, legalBodySx, legalListSx } from '../styles/legalPageTypography';

export default function PrivacyPolicy() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography color="rgb(229, 90, 61)" variant="h4" component="h1" align="center" sx={legalTitleSx}>
                    {t.privacyPolicy}
                </Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacyIntro}</Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={{ ...legalSectionHeadingSx, mt: 1 }}>{t.privacy1Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy1Intro}</Typography>
                <Typography component="ul" sx={legalListSx}>
                    {t.privacy1List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy1Outro}</Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy2Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy2Intro}</Typography>
                <Typography component="ul" sx={legalListSx}>
                    {t.privacy2List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy3Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy3Text}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy3Text2}</Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy4Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy4Intro}</Typography>
                <Typography component="ul" sx={legalListSx}>
                    {t.privacy4List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy5Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy5Intro}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy5Text}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy5ListIntro}</Typography>
                <Typography component="ul" sx={legalListSx}>
                    {t.privacy5List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy5Outro}</Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy6Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy6Intro}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy6ListIntro}</Typography>
                <Typography component="ul" sx={legalListSx}>
                    {t.privacy6List.map((item, i) => <li key={i}>{item}</li>)}
                </Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy6Outro}</Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy7Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy7Text}</Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy8Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy8Text}</Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy9Title}</Typography>
                <Typography paragraph sx={legalBodySx}>
                    {t.privacy9Contact}{' '}
                    <Link href="mailto:hamikdash.today@gmail.com" color="primary" sx={{ fontSize: 'inherit' }}>{t.siteTermsEmail}</Link>
                </Typography>

                <Typography color="rgb(229, 90, 61)" variant="h5" sx={legalSectionHeadingSx}>{t.privacy10Title}</Typography>
                <Typography paragraph sx={legalBodySx}>{t.privacy10Text}</Typography>
            </Paper>
        </Container>
    );
}
