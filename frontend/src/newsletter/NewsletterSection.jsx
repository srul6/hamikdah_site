import React, { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { useNewsletter } from './NewsletterContext';
import NewsletterSignupForm from './NewsletterSignupForm';

function Ornament() {
    return (
        <AutoAwesomeIcon
            aria-hidden
            sx={{
                color: '#d8472a',
                fontSize: { xs: 14, sm: 16 },
                flexShrink: 0,
                opacity: 0.9,
                mt: '0.2em'
            }}
        />
    );
}

/** Homepage newsletter section — place after FAQ */
export default function NewsletterSection() {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const { markSubscribedThisSession } = useNewsletter();
    const [subscribedOk, setSubscribedOk] = useState(false);

    const benefits = [t.newsletterBenefit1, t.newsletterBenefit2];

    if (subscribedOk) {
        return (
            <Box
                component="section"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    pt: { xs: 6, md: 10 },
                    pb: { xs: 6, md: 10 },
                    mb: 0,
                    px: { xs: 2, sm: 3 },
                    backgroundColor: '#ebe4d4',
                    direction: isHebrew ? 'rtl' : 'ltr'
                }}
            >
                <Container
                    maxWidth="md"
                    sx={{
                        textAlign: { xs: 'right', sm: 'center' }
                    }}
                >
                    <Typography
                        sx={{
                            color: '#d8472a',
                            fontWeight: 800,
                            fontSize: { xs: '2rem', sm: '2.4rem', md: '2.8rem' },
                            mb: 2,
                            lineHeight: 1.2
                        }}
                    >
                        {t.newsletterSubscribeSuccessTitle}
                    </Typography>
                    <Typography
                        sx={{
                            color: '#002144',
                            fontWeight: 500,
                            fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line',
                            maxWidth: 640,
                            mx: { xs: 0, sm: 'auto' }
                        }}
                    >
                        {t.newsletterSubscribeSuccessBody}
                    </Typography>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            component="section"
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                pt: { xs: 6, md: 10 },
                pb: { xs: 6, md: 10 },
                mb: 0,
                px: { xs: 2, sm: 3 },
                backgroundColor: '#ebe4d4',
                direction: isHebrew ? 'rtl' : 'ltr'
            }}
        >
            <Container
                maxWidth="lg"
                sx={{
                    textAlign: { xs: 'right', sm: 'center' }
                }}
            >
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 700,
                        color: '#002144',
                        fontSize: { xs: '2rem', sm: '2.4rem', md: '2.8rem' },
                        mb: { xs: 2.5, md: 3 },
                        lineHeight: 1.2,
                        textAlign: { xs: 'right', sm: 'center' }
                    }}
                >
                    {t.newsletterSectionTitle}
                </Typography>

                <Box
                    sx={{
                        m: 0,
                        mb: { xs: 2.5, md: 3 },
                        maxWidth: 720,
                        mx: { xs: 0, sm: 'auto' },
                        ml: { xs: 'auto', sm: 'auto' },
                        mr: { xs: 0, sm: 'auto' },
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                        alignItems: {
                            xs: isHebrew ? 'flex-start' : 'flex-end',
                            sm: 'center'
                        }
                    }}
                >
                    {benefits.map((text) => {
                        return (
                        <Box
                            key={text}
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: {
                                    xs: isHebrew ? 'flex-start' : 'flex-end',
                                    sm: 'center'
                                },
                                gap: { xs: 1, sm: 1.5 },
                                px: { xs: 0, sm: 1 },
                                width: '100%'
                            }}
                        >
                            <Ornament />
                            <Typography
                                sx={{
                                    color: '#002144',
                                    fontSize: { xs: '0.98rem', sm: '1.08rem' },
                                    lineHeight: 1.3,
                                    textAlign: { xs: 'right', sm: 'center' },
                                    maxWidth: { xs: '100%', sm: 560 }
                                }}
                            >
                                {text}
                            </Typography>
                            <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                <Ornament />
                            </Box>
                        </Box>
                        );
                    })}
                </Box>

                <Typography
                    sx={{
                        color: '#555',
                        fontSize: { xs: '0.92rem', sm: '1rem' },
                        lineHeight: 1.3,
                        textAlign: { xs: 'right', sm: 'center' },
                        maxWidth: { xs: '100%', md: 780 },
                        mx: { xs: 0, sm: 'auto' },
                        ml: { xs: 'auto', sm: 'auto' },
                        mr: { xs: 0, sm: 'auto' },
                        mb: 2.5,
                        whiteSpace: { md: 'nowrap' }
                    }}
                >
                    {t.newsletterNoSpam}
                </Typography>

                <Box
                    sx={{
                        maxWidth: 520,
                        mx: { xs: 0, sm: 'auto' },
                        ml: { xs: 'auto', sm: 'auto' },
                        mr: { xs: 0, sm: 'auto' },
                        width: '100%'
                    }}
                >
                    <NewsletterSignupForm
                        requirePrivacyConsent
                        onSubscribed={() => {
                            setSubscribedOk(true);
                            markSubscribedThisSession();
                        }}
                    />
                </Box>
            </Container>
        </Box>
    );
}
