import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Link,
    Slide,
    Switch,
    Typography,
    Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { useConsent } from './ConsentContext';

const ACCENT = 'rgba(229, 90, 61, 1)';
const CREAM = 'rgb(245, 240, 227)';
const INK = '#1a1a1a';

const privacyLinkSx = {
    color: ACCENT,
    fontWeight: 600,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    '&:hover': { color: 'rgba(200, 70, 40, 1)' }
};

function PrivacyPolicyLink({ t, onClick }) {
    return (
        <Link
            component={RouterLink}
            to="/privacy"
            underline="always"
            onClick={onClick}
            sx={privacyLinkSx}
        >
            {t.privacyPolicy}
        </Link>
    );
}
const ANALYTICS_SERVICES = [
    {
        name: 'Google Analytics 4',
        href: 'https://policies.google.com/privacy'
    },
    {
        name: 'Microsoft Clarity',
        href: 'https://www.microsoft.com/privacy/privacystatement'
    }
];

const ADVERTISING_SERVICES = [
    {
        name: 'Google Ads',
        href: 'https://policies.google.com/technologies/ads'
    },
    {
        name: 'Meta Pixel',
        href: 'https://www.facebook.com/privacy/policy/'
    }
];

function ServiceLinks({ prefix, services, isHebrew }) {
    return (
        <Typography
            component="div"
            sx={{
                fontSize: '0.8125rem',
                color: 'rgba(0,0,0,0.55)',
                width: '100%',
                display: 'block',
                direction: isHebrew ? 'rtl' : 'ltr',
                textAlign: isHebrew ? 'right' : 'left'
            }}
        >
            {prefix}{' '}
            {services.map((service, index) => (
                <React.Fragment key={service.href}>
                    {index > 0
                        ? (isHebrew
                            ? ' ו־'
                            : (index === services.length - 1 ? ' and ' : ', '))
                        : null}
                    <Link
                        href={service.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{
                            color: ACCENT,
                            fontWeight: 600,
                            '&:hover': { color: 'rgba(200, 70, 40, 1)' }
                        }}
                    >
                        {service.name}
                    </Link>
                </React.Fragment>
            ))}
            .
        </Typography>
    );
}

function Banner({ open, onAcceptAll, onCustomize, t, isHebrew }) {
    return (
        <Slide direction="up" in={open} mountOnEnter unmountOnExit>
            <Box
                role="dialog"
                aria-modal="false"
                aria-labelledby="cookie-banner-title"
                aria-describedby="cookie-banner-desc"
                sx={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1400,
                    px: { xs: 1.5, sm: 2 },
                    pb: { xs: 1.5, sm: 2 },
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: { xs: 'center', md: 'flex-start' }
                }}
            >
                <Box
                    sx={{
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: { xs: '100%', md: 520 },
                        mx: { xs: 'auto', md: 0 },
                        backgroundColor: CREAM,
                        color: INK,
                        borderRadius: '12px',
                        boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        p: { xs: 2, sm: 2.5 },
                        display: 'flex',
                        flexDirection: 'column',
                        gap: { xs: 2.5, sm: 3 },
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: isHebrew ? 'right' : 'left'
                    }}
                >
                    <Typography
                        id="cookie-banner-title"
                        component="h2"
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.05rem', sm: '1.15rem' },
                            color: INK
                        }}
                    >
                        {t.cookieBannerTitle}
                    </Typography>
                    <Typography
                        id="cookie-banner-desc"
                        sx={{
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            lineHeight: 1.55,
                            color: 'rgba(0,0,0,0.72)'
                        }}
                    >
                        {t.cookieBannerText}{' '}
                        {t.cookiePrivacyLinkPrefix}
                        <PrivacyPolicyLink t={t} />
                        {t.cookiePrivacyLinkSuffix}
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.25,
                            width: '100%'
                        }}
                    >
                        <Button
                            variant="outlined"
                            onClick={onCustomize}
                            fullWidth
                            sx={{
                                flex: 1,
                                borderColor: ACCENT,
                                color: ACCENT,
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 2.5,
                                '&:hover': {
                                    borderColor: ACCENT,
                                    backgroundColor: 'rgba(229, 90, 61, 0.08)'
                                }
                            }}
                        >
                            {t.cookieCustomize}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={onAcceptAll}
                            fullWidth
                            sx={{
                                flex: 1,
                                backgroundColor: ACCENT,
                                color: CREAM,
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 2.5,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: 'rgba(200, 70, 40, 1)',
                                    boxShadow: 'none'
                                }
                            }}
                        >
                            {t.cookieAcceptAll}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Slide>
    );
}

function EssentialCategory({ t, isHebrew }) {
    return (
        <Box
            sx={{
                py: 3,
                direction: isHebrew ? 'rtl' : 'ltr',
            }}
        >
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: INK, mb: 0.5 }}>
                {t.cookieEssentialTitle}
                <Typography
                    component="span"
                    sx={{
                        ml: isHebrew ? 0 : 1,
                        mr: isHebrew ? 1 : 0,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: ACCENT
                    }}
                >
                    ({t.cookieEssentialAlwaysOn})
                </Typography>
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.7)', mb: 0.75 }}>
                {t.cookieEssentialDesc}
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.55)' }}>
                {t.cookieEssentialExamples}
            </Typography>
        </Box>
    );
}

/**
 * Hebrew: toggle left, text right-aligned on the right.
 * English: text left, toggle right.
 */
function CategoryRow({
    title,
    description,
    services,
    servicesPrefix,
    checked,
    onChange,
    isHebrew
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 4,
                flexDirection: isHebrew ? 'row' : 'row-reverse'
            }}
        >
            <Switch
                checked={checked}
                onChange={onChange}
                color="warning"
                disableRipple
                inputProps={{ 'aria-label': title }}
                sx={{
                    flexShrink: 0,
                    // Mirror the control in Hebrew so the thumb travels right → left when enabled
                    transform: isHebrew ? 'scaleX(-1)' : 'none',
                    '& .MuiSwitch-switchBase': {
                        '&:hover': {
                            backgroundColor: 'transparent'
                        },
                        '&.Mui-checked:hover': {
                            backgroundColor: 'transparent'
                        }
                    }
                }}
            />
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    direction: isHebrew ? 'rtl' : 'ltr',
                }}
            >
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: INK, mb: 0.5 }}>
                    {title}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.7)', mb: 0.75 }}>
                    {description}
                </Typography>
                {services?.length ? (
                    <ServiceLinks
                        prefix={servicesPrefix}
                        services={services}
                        isHebrew={isHebrew}
                    />
                ) : null}
            </Box>
        </Box>
    );
}

function PreferencesModal({
    open,
    onClose,
    onAcceptAll,
    onRejectAll,
    onSave,
    t,
    isHebrew,
    initialAnalytics,
    initialAdvertising
}) {
    const [analytics, setAnalytics] = useState(initialAnalytics);
    const [advertising, setAdvertising] = useState(initialAdvertising);

    useEffect(() => {
        if (open) {
            setAnalytics(initialAnalytics);
            setAdvertising(initialAdvertising);
        }
    }, [open, initialAnalytics, initialAdvertising]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            aria-labelledby="cookie-prefs-title"
            PaperProps={{
                sx: {
                    backgroundColor: CREAM,
                    borderRadius: '12px'
                }
            }}
        >
            <DialogTitle
                id="cookie-prefs-title"
                sx={{
                    fontWeight: 700,
                    color: INK,
                    textAlign: isHebrew ? 'right' : 'left',
                    pr: isHebrew ? 2 : 6,
                    pl: isHebrew ? 6 : 2
                }}
            >
                {t.cookiePreferencesTitle}
                <IconButton
                    aria-label={t.cookieClose}
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: isHebrew ? 'auto' : 8,
                        left: isHebrew ? 8 : 'auto',
                        top: 8,
                        color: 'rgba(0,0,0,0.55)'
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                        mt: { xs: 1, sm: 3 },
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: '0.9375rem',
                            color: 'rgba(0,0,0,0.7)',
                            direction: isHebrew ? 'rtl' : 'ltr',
                            textAlign: isHebrew ? 'right' : 'left'
                        }}
                    >
                        {t.cookiePreferencesIntro}{' '}
                        {t.cookiePrivacyLinkPrefix}
                        <PrivacyPolicyLink t={t} onClick={onClose} />
                        {t.cookiePrivacyLinkSuffix}
                    </Typography>

                    <Box>
                        <EssentialCategory t={t} isHebrew={isHebrew} />
                        <Divider sx={{ my: 0.5 }} />
                        <CategoryRow
                            title={t.cookieAnalyticsTitle}
                            description={t.cookieAnalyticsDesc}
                            servicesPrefix={t.cookieServicesIncludes}
                            services={ANALYTICS_SERVICES}
                            checked={analytics}
                            onChange={(e) => setAnalytics(e.target.checked)}
                            isHebrew={isHebrew}
                        />
                        <Divider sx={{ my: 0.5 }} />
                        <CategoryRow
                            title={t.cookieAdvertisingTitle}
                            description={t.cookieAdvertisingDesc}
                            servicesPrefix={t.cookieServicesIncludes}
                            services={ADVERTISING_SERVICES}
                            checked={advertising}
                            onChange={(e) => setAdvertising(e.target.checked)}
                            isHebrew={isHebrew}
                        />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions
                sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'stretch',
                    gap: 1,
                    px: 2.5,
                    py: 2,
                    justifyContent: 'stretch'
                }}
            >
                <Button
                    onClick={onRejectAll}
                    sx={{
                        textTransform: 'none',
                        color: 'rgba(0,0,0,0.65)',
                        fontWeight: 600,
                        order: { xs: 3, sm: 1 },
                        backgroundColor: 'transparent',
                        '&:hover': {
                            backgroundColor: 'transparent',
                            color: INK
                        },
                        '&:active': {
                            backgroundColor: 'transparent'
                        }
                    }}
                >
                    {t.cookieRejectAll}
                </Button>
                <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' }, order: 2 }} />
                <Button
                    variant="outlined"
                    onClick={() => onSave({ analytics, advertising })}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: ACCENT,
                        color: ACCENT,
                        order: { xs: 2, sm: 3 },
                        '&:hover': {
                            borderColor: ACCENT,
                            backgroundColor: 'rgba(229, 90, 61, 0.08)'
                        }
                    }}
                >
                    {t.cookieSavePreferences}
                </Button>
                <Button
                    variant="contained"
                    onClick={onAcceptAll}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        backgroundColor: ACCENT,
                        color: CREAM,
                        boxShadow: 'none',
                        order: { xs: 1, sm: 4 },
                        '&:hover': {
                            backgroundColor: 'rgba(200, 70, 40, 1)',
                            boxShadow: 'none'
                        }
                    }}
                >
                    {t.cookieAcceptAll}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Banner + preferences modal. Mounted once by ConsentProvider.
 */
export default function CookieConsentUI() {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const {
        consent,
        preferencesOpen,
        openPreferences,
        closePreferences,
        acceptAll,
        rejectAll,
        savePreferences
    } = useConsent();

    const showBanner = !consent.decided && !preferencesOpen;

    return (
        <>
            <Banner
                open={showBanner}
                onAcceptAll={acceptAll}
                onCustomize={openPreferences}
                t={t}
                isHebrew={isHebrew}
            />
            <PreferencesModal
                open={preferencesOpen}
                onClose={closePreferences}
                onAcceptAll={acceptAll}
                onRejectAll={rejectAll}
                onSave={savePreferences}
                t={t}
                isHebrew={isHebrew}
                initialAnalytics={Boolean(consent.analytics)}
                initialAdvertising={Boolean(consent.advertising)}
            />
        </>
    );
}
