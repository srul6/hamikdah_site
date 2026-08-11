import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { getImageUrl } from '../utils/imageUtils';

function isUploadedVideo(url) {
    if (!url || typeof url !== 'string') return false;
    return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);
}

function isYouTubeEmbed(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('youtube.com/embed') || url.includes('youtu.be/');
}

function getMaxScroll(container) {
    return Math.max(0, container.scrollWidth - container.clientWidth);
}

/** Normalize browser RTL scrollLeft quirks to 0…maxScroll. */
function getScrollDistance(container, isRtl) {
    const max = getMaxScroll(container);
    if (max <= 0) return 0;
    const raw = container.scrollLeft;
    if (!isRtl) {
        return Math.min(max, Math.max(0, raw));
    }
    // Chrome/WebKit: negative; Firefox: 0→max from the RTL start
    if (raw < 0) {
        return Math.min(max, Math.abs(raw));
    }
    return Math.min(max, Math.max(0, raw));
}

function setScrollDistance(container, isRtl, distance) {
    const max = getMaxScroll(container);
    if (max <= 0) return;
    const clamped = Math.min(max, Math.max(0, distance));
    if (!isRtl) {
        container.scrollLeft = clamped;
        return;
    }
    // Prefer negative scrollLeft (Chrome); fall back if the engine ignores it
    container.scrollLeft = -clamped;
    if (Math.abs(container.scrollLeft) < 1 && clamped > 1) {
        container.scrollLeft = clamped;
    }
}

/**
 * Horizontal “Kids Playing” gallery with a progress bar that fills as the user scrolls.
 * Scrolling is controlled only via the progress “snake” (not by dragging the images).
 * Hebrew → RTL (fill from the right); English → LTR (fill from the left).
 *
 * theme="dark"  — Temple-style navy background (default)
 * theme="light" — regular product beige page background
 */
const ChildrenPlayingSection = forwardRef(function ChildrenPlayingSection(
    {
        media = [],
        isHebrew = true,
        titleHe = 'ילדים משחקים',
        titleEn = 'Kids Playing',
        theme = 'dark',
        backgroundColor
    },
    ref
) {
    const scrollContainerRef = useRef(null);
    const progressBarRef = useRef(null);
    const scrubRef = useRef({
        active: false,
        pointerId: null
    });
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);

    const items = Array.isArray(media) ? media.filter(Boolean) : [];
    const title = isHebrew ? titleHe : titleEn;
    const isLight = theme === 'light';

    const resolvedBackground = backgroundColor
        ?? (isLight ? 'rgba(245, 240, 227, 1)' : 'rgb(5, 38, 51)');
    const titleColor = isLight ? 'rgba(229, 90, 61, 1)' : '#f5f0e3';
    const progressTrackColor = isLight
        ? 'rgba(229, 90, 61, 0.25)'
        : 'rgba(245, 240, 227, 0.3)';
    const progressFillColor = isLight ? 'rgba(229, 90, 61, 1)' : '#f5f0e3';
    // Fade content itself (no overlay bands) — avoids hard edge lines on mobile
    const edgeFadeMask =
        'linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)';

    const syncProgressFromScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const maxScroll = getMaxScroll(container);
        const distance = getScrollDistance(container, isHebrew);
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, distance / maxScroll)) : 0;
        setScrollProgress(progress);
    }, [isHebrew]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return undefined;

        // Keep progress in sync if layout changes (images load / resize)
        const ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => syncProgressFromScroll())
            : null;
        if (ro) {
            ro.observe(container);
        }
        syncProgressFromScroll();
        return () => {
            if (ro) ro.disconnect();
        };
    }, [items.length, syncProgressFromScroll]);

    const scrubToClientX = useCallback((clientX) => {
        const bar = progressBarRef.current;
        const container = scrollContainerRef.current;
        if (!bar || !container) return;

        const rect = bar.getBoundingClientRect();
        if (rect.width <= 0) return;

        let ratio = (clientX - rect.left) / rect.width;
        if (isHebrew) {
            ratio = 1 - ratio;
        }
        ratio = Math.min(1, Math.max(0, ratio));
        setScrollDistance(container, isHebrew, ratio * getMaxScroll(container));
        syncProgressFromScroll();
    }, [isHebrew, syncProgressFromScroll]);

    if (items.length === 0) {
        return null;
    }

    const handleProgressPointerDown = (e) => {
        if (e.button != null && e.button !== 0) return;
        scrubRef.current = { active: true, pointerId: e.pointerId };
        setIsScrubbing(true);
        scrubToClientX(e.clientX);
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {
            // Ignore
        }
        e.preventDefault();
    };

    const handleProgressPointerMove = (e) => {
        if (!scrubRef.current.active || scrubRef.current.pointerId !== e.pointerId) return;
        scrubToClientX(e.clientX);
    };

    const handleProgressPointerUp = (e) => {
        if (!scrubRef.current.active || scrubRef.current.pointerId !== e.pointerId) return;
        scrubRef.current.active = false;
        setIsScrubbing(false);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {
            // Ignore
        }
    };

    return (
        <Box
            ref={ref}
            sx={{
                backgroundColor: resolvedBackground,
                minHeight: isLight ? 'auto' : '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                py: isLight ? { xs: 4, md: 5 } : 6
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: isHebrew ? 'flex-end' : 'flex-start',
                    width: '100%',
                    mb: 3
                }}
            >
                <Typography
                    variant="h2"
                    component="h2"
                    sx={{
                        color: titleColor,
                        fontWeight: isLight ? 600 : 400,
                        fontSize: isLight
                            ? { xs: '1.5rem', sm: '1.7rem', md: '1.8rem' }
                            : { xs: '2rem', sm: '2.2rem', md: '2.4rem', lg: '2.6rem' },
                        lineHeight: 1.6,
                        maxWidth: isLight ? { xs: '80%', lg: '70%' } : '80%',
                        mx: isLight ? 'auto' : undefined,
                        width: isLight ? '100%' : undefined,
                        textAlign: isHebrew ? 'right' : 'left',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        px: isLight ? 0 : { xs: 4, md: '9%' }
                    }}
                >
                    {title}
                </Typography>
            </Box>

            <Box
                ref={scrollContainerRef}
                data-children-playing-scroll
                sx={{
                    // Gallery is display-only; horizontal position is driven by the snake
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    width: '100%',
                    direction: isHebrew ? 'rtl' : 'ltr',
                    WebkitMaskImage: edgeFadeMask,
                    maskImage: edgeFadeMask,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    cursor: 'default',
                    touchAction: 'pan-y',
                    overscrollBehaviorX: 'none'
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 3,
                        py: 1,
                        alignItems: 'center',
                        height: { xs: '320px', sm: '450px', md: '500px' }
                    }}
                >
                    <Box sx={{ flexShrink: 0, width: { xs: '0px', md: '100px' }, height: '1px' }} />

                    {items.map((mediaUrl, index) => {
                        const youtube = isYouTubeEmbed(mediaUrl);
                        const video = isUploadedVideo(mediaUrl);

                        return (
                            <Box
                                key={`cp-${index}-${mediaUrl}`}
                                data-children-media
                                sx={{
                                    flexShrink: 0,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {youtube ? (
                                    <Box
                                        sx={{
                                            height: '100%',
                                            width: 'auto',
                                            aspectRatio: '16/9',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        <iframe
                                            src={mediaUrl}
                                            title={`${title} ${index + 1}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                border: 'none',
                                                borderRadius: '8px'
                                            }}
                                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </Box>
                                ) : video ? (
                                    <Box
                                        sx={{
                                            height: '100%',
                                            width: 'auto',
                                            aspectRatio: '16/9',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            position: 'relative'
                                        }}
                                    >
                                        <video
                                            src={mediaUrl}
                                            controls
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                            preload="metadata"
                                        />
                                    </Box>
                                ) : (
                                    <img
                                        src={getImageUrl(mediaUrl)}
                                        alt={`${title} ${index + 1}`}
                                        draggable={false}
                                        style={{
                                            height: '100%',
                                            width: 'auto',
                                            objectFit: 'contain',
                                            borderRadius: '8px',
                                            display: 'block'
                                        }}
                                    />
                                )}
                            </Box>
                        );
                    })}

                    <Box sx={{ flexShrink: 0, width: { xs: '0px', md: '100px' }, height: '1px' }} />
                </Box>
            </Box>

            {/* Progress “snake” — the only control for scrolling the gallery */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Box
                    ref={progressBarRef}
                    role="slider"
                    tabIndex={0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(scrollProgress * 100)}
                    aria-label={title}
                    onPointerDown={handleProgressPointerDown}
                    onPointerMove={handleProgressPointerMove}
                    onPointerUp={handleProgressPointerUp}
                    onPointerCancel={handleProgressPointerUp}
                    onKeyDown={(e) => {
                        const container = scrollContainerRef.current;
                        if (!container) return;
                        const max = getMaxScroll(container);
                        if (max <= 0) return;
                        const step = max * 0.08;
                        const current = getScrollDistance(container, isHebrew);
                        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                            e.preventDefault();
                            const forward = isHebrew
                                ? e.key === 'ArrowLeft'
                                : e.key === 'ArrowRight';
                            setScrollDistance(
                                container,
                                isHebrew,
                                forward ? current + step : current - step
                            );
                            syncProgressFromScroll();
                        } else if (e.key === 'Home') {
                            e.preventDefault();
                            setScrollDistance(container, isHebrew, 0);
                            syncProgressFromScroll();
                        } else if (e.key === 'End') {
                            e.preventDefault();
                            setScrollDistance(container, isHebrew, max);
                            syncProgressFromScroll();
                        }
                    }}
                    sx={{
                        position: 'relative',
                        width: { xs: '220px', sm: '260px' },
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: isScrubbing ? 'grabbing' : 'grab',
                        touchAction: 'none',
                        userSelect: 'none',
                        outline: 'none',
                        '&:focus-visible .snake-track': {
                            boxShadow: isLight
                                ? '0 0 0 2px rgba(229, 90, 61, 0.45)'
                                : '0 0 0 2px rgba(245, 240, 227, 0.45)'
                        }
                    }}
                >
                    <Box
                        className="snake-track"
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: '8px',
                            backgroundColor: progressTrackColor,
                            borderRadius: '4px'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: isHebrew ? 'auto' : 0,
                                right: isHebrew ? 0 : 'auto',
                                height: '100%',
                                width: `calc(${scrollProgress * 100}%)`,
                                backgroundColor: progressFillColor,
                                borderRadius: '4px',
                                transition: isScrubbing ? 'none' : 'width 0.1s ease-out'
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
});

export default ChildrenPlayingSection;
