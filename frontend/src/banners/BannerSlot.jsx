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

function sessionKey(placement) {
    return `banner_seen_${placement}`;
}

function readSeenIds(placement) {
    try {
        const raw = sessionStorage.getItem(sessionKey(placement));
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(
            (Array.isArray(arr) ? arr : []).map((id) => String(id))
        );
    } catch (_) {
        return new Set();
    }
}

function writeSeenIds(placement, ids) {
    try {
        sessionStorage.setItem(
            sessionKey(placement),
            JSON.stringify([...ids].map(String))
        );
    } catch (_) {
        /* ignore */
    }
}

/**
 * Active DB banners — same floating Dialog as NewsletterModal.
 * Shows at most once per browser session (sessionStorage); survives payment reloads.
 */
export default function BannerSlot({ placement }) {
    const { isHebrew } = useLanguage();
    const [banners, setBanners] = useState([]);
    /** Banner currently open on this mount (kept until user closes). */
    const [activeId, setActiveId] = useState(null);

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

    // Pick first unseen banner once per mount; record it so reloads skip it.
    useEffect(() => {
        if (activeId != null) return;
        const seen = readSeenIds(placement);
        const next = banners.find((b) => b?.id != null && !seen.has(String(b.id)));
        if (!next) return;

        const id = String(next.id);
        setActiveId(id);
        seen.add(id);
        writeSeenIds(placement, seen);
    }, [banners, placement, activeId]);

    const dismiss = () => {
        if (activeId != null) {
            const seen = readSeenIds(placement);
            seen.add(String(activeId));
            writeSeenIds(placement, seen);
        }
        setActiveId(null);
    };

    const banner =
        activeId != null
            ? banners.find((b) => String(b.id) === String(activeId)) || null
            : null;
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
            onClose={dismiss}
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
                    onClick={dismiss}
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
                        onClick={dismiss}
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
