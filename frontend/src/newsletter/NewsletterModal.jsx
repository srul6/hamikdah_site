import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { useNewsletter } from './NewsletterContext';
import NewsletterSignupForm from './NewsletterSignupForm';
import NewsletterBannerImage, {
    useNewsletterBannerImages
} from './NewsletterBannerImage';

function Ornament() {
    return (
        <AutoAwesomeIcon
            aria-hidden
            sx={{
                color: '#d8472a',
                fontSize: { xs: 14, sm: 16 },
                flexShrink: 0,
                opacity: 0.9,
                mt: '0.15em'
            }}
        />
    );
}

export default function NewsletterModal() {
    const { isModalOpen, modalMode, closeNewsletterModal, markSubscribedThisSession } =
        useNewsletter();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const bannerImages = useNewsletterBannerImages();
    // Keep last mode while Dialog exit-animates (closing sets modalMode to null)
    const [renderMode, setRenderMode] = React.useState(modalMode);
    const [subscribedOk, setSubscribedOk] = React.useState(false);

    React.useEffect(() => {
        if (modalMode) setRenderMode(modalMode);
    }, [modalMode]);

    React.useEffect(() => {
        if (!isModalOpen) setSubscribedOk(false);
    }, [isModalOpen]);

    const activeMode = modalMode || renderMode;
    const isUnsubscribe = activeMode === 'unsubscribe';
    const isGift = activeMode === 'gift';
    const benefits = [t.newsletterBenefit1, t.newsletterBenefit2];

    const title = subscribedOk
        ? t.newsletterSubscribeSuccessTitle
        : isUnsubscribe
          ? t.newsletterUnsubscribeTitle
          : isGift
            ? t.newsletterGiftBannerTitle
            : t.newsletterModalTitle;

    const heroSrc = isUnsubscribe
        ? bannerImages.unsubscribe
        : isGift
          ? bannerImages.gift
          : bannerImages.subscribe;

    return (
        <Dialog
            open={isModalOpen}
            onClose={closeNewsletterModal}
            maxWidth={false}
            fullWidth={false}
            scroll="body"
            dir={isHebrew ? 'rtl' : 'ltr'}
            PaperProps={{
                sx: {
                    width: { xs: 'min(92vw, 360px)', sm: 380 },
                    maxWidth: 380,
                    borderRadius: 3,
                    backgroundColor: '#f5f0e3',
                    p: 0,
                    m: 2,
                    overflow: 'hidden'
                }
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <NewsletterBannerImage
                    key={heroSrc}
                    src={heroSrc}
                    backgroundColor="#f5f0e3"
                />
                <IconButton
                    onClick={closeNewsletterModal}
                    aria-label="close"
                    sx={{
                        position: 'absolute',
                        top: 8,
                        ...(isHebrew ? { left: 8 } : { right: 8 }),
                        color: '#d8472a',
                        zIndex: 2,
                        backgroundColor: 'transparent',
                        '&:hover': {
                            backgroundColor: 'transparent',
                            color: '#c03d24'
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogTitle
                sx={{
                    position: 'relative',
                    pt: { xs: 2.5, sm: 3 },
                    pb: 1.5,
                    px: { xs: 2, sm: 2.5 },
                    color: subscribedOk ? '#d8472a' : '#002144',
                    fontWeight: subscribedOk ? 800 : 700,
                    fontSize: { xs: '1.35rem', sm: '1.5rem' },
                    lineHeight: 1.3,
                    textAlign: 'center'
                }}
            >
                {title}
            </DialogTitle>
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    justifyContent: 'flex-start',
                    pt: 0.5,
                    pb: 2.5,
                    px: { xs: 2, sm: 2.5 },
                    overflow: 'visible'
                }}
            >
                {subscribedOk ? (
                    <Typography
                        sx={{
                            color: '#002144',
                            fontWeight: 500,
                            fontSize: { xs: '0.98rem', sm: '1.05rem' },
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line',
                            textAlign: 'center',
                            py: 1
                        }}
                    >
                        {t.newsletterSubscribeSuccessBody}
                    </Typography>
                ) : (
                    <>
                        {isUnsubscribe ? (
                            <Typography
                                sx={{
                                    color: '#444',
                                    mb: 3,
                                    lineHeight: 1.55,
                                    fontSize: '0.98rem',
                                    textAlign: 'center'
                                }}
                            >
                                {t.newsletterUnsubscribeBody}
                            </Typography>
                        ) : isGift ? (
                            <Typography
                                sx={{
                                    color: '#444',
                                    mb: 3,
                                    lineHeight: 1.55,
                                    fontSize: '0.98rem',
                                    textAlign: 'center'
                                }}
                            >
                                {t.newsletterGiftBannerBody}
                            </Typography>
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.75,
                                    alignItems: 'center',
                                    mb: 2
                                }}
                            >
                                {benefits.map((text) => (
                                    <Box
                                        key={text}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'center',
                                            gap: 1,
                                            width: '100%'
                                        }}
                                    >
                                        <Ornament />
                                        <Typography
                                            sx={{
                                                color: '#002144',
                                                fontSize: { xs: '0.88rem', sm: '0.92rem' },
                                                lineHeight: 1.35,
                                                textAlign: 'center',
                                                maxWidth: 280
                                            }}
                                        >
                                            {text}
                                        </Typography>
                                        <Ornament />
                                    </Box>
                                ))}
                            </Box>
                        )}

                        <Box sx={{ width: '100%' }}>
                            <NewsletterSignupForm
                                key={activeMode || 'subscribe'}
                                mode={isUnsubscribe ? 'unsubscribe' : 'subscribe'}
                                requirePrivacyConsent={!isUnsubscribe}
                                stackFields
                                outlinedField
                                onSubscribed={() => {
                                    setSubscribedOk(true);
                                    markSubscribedThisSession();
                                }}
                                onSuccess={({ status } = {}) => {
                                    if (status === 'unsubscribed') closeNewsletterModal();
                                }}
                            />
                        </Box>

                        {!isUnsubscribe && (
                            <Typography
                                sx={{
                                    mt: 2.5,
                                    fontSize: '0.82rem',
                                    color: '#666',
                                    lineHeight: 1.4,
                                    textAlign: 'center'
                                }}
                            >
                                {t.newsletterNoSpam}
                            </Typography>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
