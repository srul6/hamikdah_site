import React, { forwardRef, useEffect, useRef, useState } from 'react';
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

/**
 * Horizontal “Kids Playing” gallery with a progress bar that fills as the user scrolls.
 * Hebrew → RTL (fill from the right); English → LTR (fill from the left).
 */
const ChildrenPlayingSection = forwardRef(function ChildrenPlayingSection(
    {
        media = [],
        isHebrew = true,
        titleHe = 'ילדים משחקים',
        titleEn = 'Kids Playing',
        backgroundColor = 'rgb(5, 38, 51)'
    },
    ref
) {
    const scrollContainerRef = useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);

    const items = Array.isArray(media) ? media.filter(Boolean) : [];
    const title = isHebrew ? titleHe : titleEn;

    useEffect(() => {
        const handleScroll = () => {
            const container = scrollContainerRef.current;
            if (!container) return;

            let scrollLeft = container.scrollLeft;
            const maxScroll = container.scrollWidth - container.clientWidth;

            // RTL: scrollLeft is often negative (or decreases); normalize to 0…maxScroll
            if (isHebrew) {
                scrollLeft = Math.abs(scrollLeft);
            }

            const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
            setScrollProgress(progress);

            const childNodes = container.childNodes[0]?.childNodes || [];
            let totalWidth = 0;
            for (let i = 0; i < childNodes.length; i++) {
                totalWidth += (childNodes[i].offsetWidth || 0) + 16;
                if (totalWidth >= scrollLeft + container.clientWidth / 2) {
                    setCurrentIndex(i);
                    break;
                }
            }
        };

        const container = scrollContainerRef.current;
        if (!container) return undefined;

        container.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => container.removeEventListener('scroll', handleScroll);
    }, [items.length, isHebrew]);

    if (items.length === 0) {
        return null;
    }

    const scrollToNext = () => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const mediaNodes = container.querySelectorAll('[data-children-media]');
        if (!mediaNodes.length) return;
        const nextIndex = (currentIndex + 1) % mediaNodes.length;
        mediaNodes[nextIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    };

    return (
        <Box
            ref={ref}
            sx={{
                backgroundColor,
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                py: 6
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
                        color: '#f5f0e3',
                        fontWeight: 400,
                        fontSize: { xs: '2rem', sm: '2.2rem', md: '2.4rem', lg: '2.6rem' },
                        lineHeight: 1.6,
                        maxWidth: '80%',
                        textAlign: isHebrew ? 'right' : 'left',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        px: { xs: 4, md: '9%' }
                    }}
                >
                    {title}
                </Typography>
            </Box>

            <Box
                ref={scrollContainerRef}
                data-children-playing-scroll
                sx={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    width: '100%',
                    direction: isHebrew ? 'rtl' : 'ltr'
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

            {/* Progress “snake” — fills with scroll; direction follows language */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Box
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(scrollProgress * 100)}
                    aria-label={title}
                    onClick={scrollToNext}
                    sx={{
                        position: 'relative',
                        width: '200px',
                        height: '8px',
                        backgroundColor: 'rgba(245, 240, 227, 0.3)',
                        borderRadius: '4px',
                        cursor: 'pointer'
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
                            backgroundColor: '#f5f0e3',
                            borderRadius: '4px',
                            transition: 'width 0.1s ease-out'
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
});

export default ChildrenPlayingSection;
