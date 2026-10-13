import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
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

export const MAX_BANNER_TEXT_LINES = 3;

/**
 * Banner text lines are stored newline-separated in body_text.
 * Older banners with more lines than the max get the remainder merged into the last line.
 */
export function bannerTextLines(body) {
    const lines = String(body || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length <= MAX_BANNER_TEXT_LINES) return lines;
    return [
        ...lines.slice(0, MAX_BANNER_TEXT_LINES - 1),
        lines.slice(MAX_BANNER_TEXT_LINES - 1).join(' ')
    ];
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
    const textLines = bannerTextLines(banner.bodyText || banner.body_text || '');
    const buttonText = String(banner.buttonText || banner.button_text || '').trim();
    const buttonLink = String(banner.buttonLink || banner.button_link || '').trim();
    const isInternal = buttonLink.startsWith('/');

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
                    m: 5,
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
                        pb: { xs: 2, sm: 2.25 },
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
                    pb: { xs: 2.5, sm: 3 },
                    px: { xs: 2, sm: 3 },
                    overflow: 'visible'
                }}
            >
                {textLines.length > 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: { xs: 2, sm: 2 },
                            width: '100%',
                            maxWidth: 300,
                            mx: 'auto'
                        }}
                    >
                        {textLines.map((line, i) => (
                            <Box
                                key={i}
                                component="p"
                                sx={{
                                    m: 0,
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#d8472a',
                                    color: '#f5f0e3',
                                    fontWeight: 400,
                                    fontSize: { xs: '0.95rem', sm: '1rem' },
                                    lineHeight: 1.2,
                                    px: { xs: 1.5, sm: 2 },
                                    py: { xs: 1.5, sm: 1.5 },
                                    borderRadius: '0px',
                                    textAlign: 'center',
                                    overflowWrap: 'anywhere',
                                    boxShadow: '0 2px 6px rgba(216, 71, 42, 0.18)'
                                }}
                            >
                                {line}
                            </Box>
                        ))}
                    </Box>
                ) : null}

                {buttonText ? (
                    <Typography
                        {...(buttonLink
                            ? {
                                component: isInternal ? RouterLink : 'a',
                                to: isInternal ? buttonLink : undefined,
                                href: !isInternal ? buttonLink : undefined,
                                target: !isInternal ? '_blank' : undefined,
                                rel: !isInternal ? 'noopener noreferrer' : undefined,
                                onClick: dismiss
                            }
                            : {})}
                        sx={{
                            display: 'block',
                            mt: textLines.length > 0 ? { xs: 2.25, sm: 2.5 } : 0,
                            color: '#6b5f4f',
                            fontSize: { xs: '0.78rem', sm: '0.82rem' },
                            fontWeight: 500,
                            lineHeight: 1.4,
                            textAlign: 'center',
                            textDecoration: 'none',
                            ...(buttonLink && {
                                cursor: 'pointer',
                                '&:hover': { color: '#d8472a', textDecoration: 'underline' }
                            })
                        }}
                    >
                        {buttonText}
                    </Typography>
                ) : null}
            </DialogContent>
            <Box aria-hidden sx={{ height: { xs: 6, sm: 8 }, backgroundColor: '#d8472a', flexShrink: 0 }} />
        </Dialog>
    );
}
