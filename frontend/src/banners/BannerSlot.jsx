import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Button,
    IconButton,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Link as RouterLink } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../utils/imageUtils';
import NewsletterBannerImage from '../newsletter/NewsletterBannerImage';

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

/**
 * Active DB banners — same floating Dialog as NewsletterModal
 * (cream card over the page; does not push layout).
 * Dismiss is in-memory only so a refresh shows the banner again.
 */
export default function BannerSlot({ placement }) {
    const { isHebrew } = useLanguage();
    const [banners, setBanners] = useState([]);
    const [dismissed, setDismissed] = useState(() => new Set());

    useEffect(() => {
        // Drop legacy session dismiss so previously closed banners show again
        try {
            sessionStorage.removeItem(`banner_dismissed_${placement}`);
        } catch (_) {
            /* ignore */
        }
    }, [placement]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(
                    `${API_ENDPOINTS.banners}?placement=${encodeURIComponent(placement)}`
                );
                const data = await res.json().catch(() => ({}));
                if (!cancelled && data.success && Array.isArray(data.banners)) {
                    setBanners(data.banners);
                }
            } catch (_) {
                /* empty */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [placement]);

    const dismiss = (id) => {
        setDismissed((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const visible = banners.filter((b) => !dismissed.has(b.id));
    const banner = visible[0] || null;
    const open = Boolean(banner);

    if (!banner) return null;

    const images = (Array.isArray(banner.images) ? banner.images : [])
        .map((src) => getImageUrl(String(src || '').trim()))
        .filter(Boolean);
    const heroSrc = images[0] || '';
    const title = banner.title || '';
    const body = banner.bodyText || banner.body_text || '';
    const buttonText = banner.buttonText || banner.button_text || '';
    const buttonLink = banner.buttonLink || banner.button_link || '';
    const showButton = String(buttonText).trim() && String(buttonLink).trim();
    const isInternal = String(buttonLink).startsWith('/');

    return (
        <Dialog
            open={open}
            onClose={() => dismiss(banner.id)}
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
                {heroSrc ? (
                    <NewsletterBannerImage
                        key={heroSrc}
                        src={heroSrc}
                        alt={title || ''}
                        backgroundColor="#f5f0e3"
                    />
                ) : (
                    <Box sx={{ height: { xs: 8, sm: 12 } }} />
                )}
                <IconButton
                    onClick={() => dismiss(banner.id)}
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

            {title ? (
                <DialogTitle
                    sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        gap: 1,
                        pt: { xs: 2.5, sm: 3 },
                        pb: 1.5,
                        px: { xs: 2, sm: 2.5 },
                        color: '#002144',
                        fontWeight: 700,
                        fontSize: { xs: '1.35rem', sm: '1.5rem' },
                        lineHeight: 1.3,
                        textAlign: 'center'
                    }}
                >
                    <Ornament />
                    <Box component="span" sx={{ maxWidth: 280 }}>
                        {title}
                    </Box>
                    <Ornament />
                </DialogTitle>
            ) : null}

            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    justifyContent: 'flex-start',
                    pt: title ? 0.5 : { xs: 2.5, sm: 3 },
                    pb: 2.5,
                    px: { xs: 2, sm: 2.5 },
                    overflow: 'visible'
                }}
            >
                {body ? (
                    <Typography
                        sx={{
                            color: '#444',
                            lineHeight: 1.55,
                            fontSize: '0.98rem',
                            textAlign: 'center',
                            maxWidth: 280,
                            mb: showButton ? 2 : 0
                        }}
                    >
                        {body}
                    </Typography>
                ) : null}

                {showButton ? (
                    <Button
                        component={isInternal ? RouterLink : 'a'}
                        to={isInternal ? buttonLink : undefined}
                        href={!isInternal ? buttonLink : undefined}
                        target={!isInternal ? '_blank' : undefined}
                        rel={!isInternal ? 'noopener noreferrer' : undefined}
                        onClick={() => dismiss(banner.id)}
                        variant="contained"
                        fullWidth
                        sx={{
                            backgroundColor: '#d8472a',
                            color: '#f5f0e3',
                            fontWeight: 700,
                            py: 1.1,
                            borderRadius: 2,
                            textTransform: 'none',
                            '&:hover': { backgroundColor: '#c03d24' }
                        }}
                    >
                        {buttonText}
                    </Button>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
