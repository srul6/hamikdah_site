import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

function getMaxScroll(container) {
    return Math.max(0, container.scrollWidth - container.clientWidth);
}

/**
 * Detect whether this engine uses negative scrollLeft for direction:rtl
 * (Chrome/WebKit) or positive 0…max (Firefox).
 */
function detectRtlScrollMode(container) {
    const max = getMaxScroll(container);
    if (max <= 0) return 'negative';
    const previous = container.scrollLeft;
    container.scrollLeft = 0;
    container.scrollLeft = -Math.min(max, 50);
    const mode = container.scrollLeft < 0 ? 'negative' : 'positive';
    container.scrollLeft = previous;
    return mode;
}

/** Normalize browser RTL scrollLeft quirks to 0…maxScroll (progress through gallery). */
function getScrollDistance(container, isRtl, rtlMode = 'negative') {
    const max = getMaxScroll(container);
    if (max <= 0) return 0;
    const raw = container.scrollLeft;
    if (!isRtl) {
        return Math.min(max, Math.max(0, raw));
    }
    if (rtlMode === 'negative' || raw < 0) {
        return Math.min(max, Math.abs(raw));
    }
    // Firefox-style RTL: 0 at the visual start (right), increases while scrolling left
    return Math.min(max, Math.max(0, raw));
}

function setScrollDistance(container, isRtl, distance, rtlMode = 'negative') {
    const max = getMaxScroll(container);
    if (max <= 0) return;
    const clamped = Math.min(max, Math.max(0, distance));
    if (!isRtl) {
        container.scrollLeft = clamped;
        return;
    }
    if (rtlMode === 'negative') {
        container.scrollLeft = -clamped;
    } else {
        container.scrollLeft = clamped;
    }
}

const DEFAULT_EDGE_FADE =
    'linear-gradient(to right, transparent 0%, #000 5%, #000 95%, transparent 100%)';

/**
 * Horizontal gallery with:
 * - Native touch swipe + trackpad horizontal pan (respects direction: rtl/ltr)
 * - Vertical mouse wheel mapped to horizontal scroll
 * - Progress “snake” scrubbing
 * - No mouse click-drag scrolling
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
    const rtlModeRef = useRef('negative');
    const scrubRef = useRef({ active: false, pointerId: null });
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isScrubbing, setIsScrubbing] = useState(false);

    const syncProgressFromScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const maxScroll = getMaxScroll(container);
        const distance = getScrollDistance(container, isHebrew, rtlModeRef.current);
        const progress = maxScroll > 0 ? Math.min(1, Math.max(0, distance / maxScroll)) : 0;
        setScrollProgress(progress);
    }, [isHebrew]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return undefined;

        // Ensure RTL/LTR is applied before measuring scroll mode
        container.style.direction = isHebrew ? 'rtl' : 'ltr';
        if (isHebrew) {
            rtlModeRef.current = detectRtlScrollMode(container);
            // Start at the beginning of the RTL gallery (right side)
            setScrollDistance(container, true, 0, rtlModeRef.current);
        } else {
            setScrollDistance(container, false, 0, 'negative');
        }

        const onScroll = () => syncProgressFromScroll();
        container.addEventListener('scroll', onScroll, { passive: true });

        const ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => {
                if (isHebrew) {
                    rtlModeRef.current = detectRtlScrollMode(container);
                }
                syncProgressFromScroll();
            })
            : null;
        if (ro) ro.observe(container);

        const media = container.querySelectorAll('img, iframe, video');
        const onMediaLoad = () => syncProgressFromScroll();
        media.forEach((el) => {
            el.addEventListener('load', onMediaLoad);
        });

        /**
         * Trackpad two-finger horizontal: let the browser scroll natively (correct RTL/LTR).
         * Vertical wheel / mostly-vertical trackpad: map onto horizontal gallery scroll,
         * unless the gesture is over a nested vertically-scrollable region (e.g. long review).
         */
        const findVerticalScrollParent = (start) => {
            let node = start;
            while (node && node !== container) {
                if (node instanceof HTMLElement) {
                    const style = window.getComputedStyle(node);
                    const overflowY = style.overflowY;
                    const canScrollY =
                        (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
                        && node.scrollHeight > node.clientHeight + 1;
                    if (canScrollY) return node;
                }
                node = node.parentElement;
            }
            return null;
        };

        const onWheel = (e) => {
            const max = getMaxScroll(container);
            if (max <= 0) return;

            const absX = Math.abs(e.deltaX);
            const absY = Math.abs(e.deltaY);

            // Native horizontal / diagonal-horizontal trackpad pan
            if (absX > absY) {
                // Do not preventDefault — native overflow + direction handles RTL/LTR
                // Snake updates via the scroll listener
                return;
            }

            if (absY === 0) return;

            // Prefer nested vertical scroll (long review text) over gallery scrubbing
            const nestedY = findVerticalScrollParent(e.target);
            if (nestedY) {
                const atTop = nestedY.scrollTop <= 0;
                const atBottom =
                    nestedY.scrollTop + nestedY.clientHeight >= nestedY.scrollHeight - 1;
                const scrollingUp = e.deltaY < 0;
                const scrollingDown = e.deltaY > 0;
                if ((scrollingUp && !atTop) || (scrollingDown && !atBottom)) {
                    return;
                }
                // At nested edge: do not steal for gallery — allow page scroll
                return;
            }

            const current = getScrollDistance(container, isHebrew, rtlModeRef.current);
            // Wheel down advances through the gallery in both languages
            const delta = e.deltaY;
            const next = current + delta;

            if ((delta > 0 && current >= max - 0.5) || (delta < 0 && current <= 0.5)) {
                return;
            }

            e.preventDefault();
            setScrollDistance(container, isHebrew, next, rtlModeRef.current);
            syncProgressFromScroll();
        };
        container.addEventListener('wheel', onWheel, { passive: false });

        /**
         * Nested review text: vertical touch scrolls the text; horizontal touch
         * scrolls the gallery. touch-action:none on [data-nested-y-scroll] so we
         * can own both axes without the browser locking to pan-y only.
         */
        const nestTouch = {
            active: false,
            axis: null,
            startX: 0,
            startY: 0,
            startDistance: 0,
            startScrollTop: 0,
            nested: null
        };

        const onNestTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            const nested = e.target.closest?.('[data-nested-y-scroll]');
            if (!nested || !container.contains(nested)) {
                nestTouch.active = false;
                return;
            }
            const t = e.touches[0];
            nestTouch.active = true;
            nestTouch.axis = null;
            nestTouch.startX = t.clientX;
            nestTouch.startY = t.clientY;
            nestTouch.startDistance = getScrollDistance(container, isHebrew, rtlModeRef.current);
            nestTouch.startScrollTop = nested.scrollTop;
            nestTouch.nested = nested;
        };

        const onNestTouchMove = (e) => {
            if (!nestTouch.active || !nestTouch.nested || e.touches.length !== 1) return;
            const t = e.touches[0];
            const dx = t.clientX - nestTouch.startX;
            const dy = t.clientY - nestTouch.startY;

            if (!nestTouch.axis) {
                if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
                nestTouch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
            }

            if (nestTouch.axis === 'x') {
                e.preventDefault();
                // Finger right → decrease gallery progress (same as native LTR/RTL distance model)
                setScrollDistance(
                    container,
                    isHebrew,
                    nestTouch.startDistance - dx,
                    rtlModeRef.current
                );
                syncProgressFromScroll();
                return;
            }

            // Vertical: scroll the review text
            e.preventDefault();
            const nested = nestTouch.nested;
            const maxTop = Math.max(0, nested.scrollHeight - nested.clientHeight);
            nested.scrollTop = Math.min(maxTop, Math.max(0, nestTouch.startScrollTop - dy));
        };

        const onNestTouchEnd = () => {
            nestTouch.active = false;
            nestTouch.axis = null;
            nestTouch.nested = null;
        };

        container.addEventListener('touchstart', onNestTouchStart, { passive: true });
        container.addEventListener('touchmove', onNestTouchMove, { passive: false });
        container.addEventListener('touchend', onNestTouchEnd, { passive: true });
        container.addEventListener('touchcancel', onNestTouchEnd, { passive: true });

        // Block image drag only (do not preventDefault on pointerdown — that can
        // interfere with trackpad / gesture handling in some browsers)
        const onDragStart = (e) => e.preventDefault();
        container.addEventListener('dragstart', onDragStart);

        syncProgressFromScroll();
        return () => {
            container.removeEventListener('scroll', onScroll);
            container.removeEventListener('wheel', onWheel);
            container.removeEventListener('touchstart', onNestTouchStart);
            container.removeEventListener('touchmove', onNestTouchMove);
            container.removeEventListener('touchend', onNestTouchEnd);
            container.removeEventListener('touchcancel', onNestTouchEnd);
            container.removeEventListener('dragstart', onDragStart);
            if (ro) ro.disconnect();
            media.forEach((el) => {
                el.removeEventListener('load', onMediaLoad);
            });
        };
    }, [children, isHebrew, syncProgressFromScroll]);

    const scrubToClientX = useCallback((clientX) => {
        const bar = progressBarRef.current;
        const container = scrollContainerRef.current;
        if (!bar || !container) return;

        const rect = bar.getBoundingClientRect();
        if (rect.width <= 0) return;

        let ratio = (clientX - rect.left) / rect.width;
        // Hebrew: bar fills from the right → right edge is start (0), left is end (1)
        if (isHebrew) {
            ratio = 1 - ratio;
        }
        ratio = Math.min(1, Math.max(0, ratio));
        setScrollDistance(
            container,
            isHebrew,
            ratio * getMaxScroll(container),
            rtlModeRef.current
        );
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
                data-children-playing-scroll
                sx={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    width: '100%',
                    direction: isHebrew ? 'rtl' : 'ltr',
                    // Edge fade on desktop/tablet only — none on mobile
                    WebkitMaskImage: {
                        xs: 'none',
                        md: edgeFadeMask || 'none'
                    },
                    maskImage: {
                        xs: 'none',
                        md: edgeFadeMask || 'none'
                    },
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                    cursor: 'default',
                    // Allow nested vertical scroll (review text) while keeping horizontal gallery pan
                    touchAction: 'pan-x pan-y pinch-zoom',
                    overscrollBehaviorX: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    userSelect: 'none',
                    '& img': {
                        WebkitUserDrag: 'none',
                        userSelect: 'none',
                        pointerEvents: 'none'
                    },
                    ...scrollContainerSx
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 3,
                        py: 1,
                        alignItems: 'center',
                        // With direction:rtl, row starts on the right (Hebrew RTL gallery)
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
                        const current = getScrollDistance(container, isHebrew, rtlModeRef.current);
                        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                            e.preventDefault();
                            // Hebrew RTL: ArrowLeft advances (toward the left / end)
                            const forward = isHebrew
                                ? e.key === 'ArrowLeft'
                                : e.key === 'ArrowRight';
                            setScrollDistance(
                                container,
                                isHebrew,
                                forward ? current + step : current - step,
                                rtlModeRef.current
                            );
                            syncProgressFromScroll();
                        } else if (e.key === 'Home') {
                            e.preventDefault();
                            setScrollDistance(container, isHebrew, 0, rtlModeRef.current);
                            syncProgressFromScroll();
                        } else if (e.key === 'End') {
                            e.preventDefault();
                            setScrollDistance(container, isHebrew, max, rtlModeRef.current);
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
