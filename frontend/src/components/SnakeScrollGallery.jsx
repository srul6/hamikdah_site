import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

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
    container.scrollLeft = -clamped;
    if (Math.abs(container.scrollLeft) < 1 && clamped > 1) {
        container.scrollLeft = clamped;
    }
}

const DEFAULT_EDGE_FADE =
    'linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)';

/**
 * Horizontal gallery whose scroll position is controlled only by the progress “snake”.
 * Content itself is not directly scrollable (no drag / swipe / wheel on the strip).
 */
export default function SnakeScrollGallery({
    isHebrew = true,
    children,
    trackColor = 'rgba(245, 240, 227, 0.3)',
    fillColor = '#f5f0e3',
    edgeFadeMask = DEFAULT_EDGE_FADE,
    rowSx = {},
    scrollContainerSx = {},
    snakeOuterSx = {},
    'aria-label': ariaLabel = 'Gallery progress'
}) {
    const scrollContainerRef = useRef(null);
    const progressBarRef = useRef(null);
    const scrubRef = useRef({ active: false, pointerId: null });
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);

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

        const ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => syncProgressFromScroll())
            : null;
        if (ro) ro.observe(container);

        // Images/iframes loading can change scrollWidth
        const media = container.querySelectorAll('img, iframe, video');
        const onMediaLoad = () => syncProgressFromScroll();
        media.forEach((el) => {
            el.addEventListener('load', onMediaLoad);
        });

        syncProgressFromScroll();
        return () => {
            if (ro) ro.disconnect();
            media.forEach((el) => {
                el.removeEventListener('load', onMediaLoad);
            });
        };
    }, [children, syncProgressFromScroll]);

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
        <Box sx={{ width: '100%' }}>
            <Box
                ref={scrollContainerRef}
                data-snake-scroll-container
                sx={{
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    width: '100%',
                    direction: isHebrew ? 'rtl' : 'ltr',
                    WebkitMaskImage: edgeFadeMask || 'none',
                    maskImage: edgeFadeMask || 'none',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    cursor: 'default',
                    touchAction: 'pan-y',
                    overscrollBehaviorX: 'none',
                    ...scrollContainerSx
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        gap: 3,
                        py: 1,
                        alignItems: 'center',
                        ...rowSx
                    }}
                >
                    {children}
                </Box>
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 4,
                    ...snakeOuterSx
                }}
            >
                <Box
                    ref={progressBarRef}
                    role="slider"
                    tabIndex={0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(scrollProgress * 100)}
                    aria-label={ariaLabel}
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
                            boxShadow: '0 0 0 2px rgba(245, 240, 227, 0.45)'
                        }
                    }}
                >
                    <Box
                        className="snake-track"
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: '8px',
                            backgroundColor: trackColor,
                            borderRadius: '4px',
                            overflow: 'hidden'
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
                                backgroundColor: fillColor,
                                borderRadius: '4px',
                                transition: isScrubbing ? 'none' : 'width 0.1s ease-out'
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
