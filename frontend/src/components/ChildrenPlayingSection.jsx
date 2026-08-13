import React, { forwardRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { getImageUrl } from '../utils/imageUtils';
import SnakeScrollGallery from './SnakeScrollGallery';

function isUploadedVideo(url) {
    if (!url || typeof url !== 'string') return false;
    return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);
}

function isYouTubeEmbed(url) {
    if (!url || typeof url !== 'string') return false;
    return url.includes('youtube.com/embed') || url.includes('youtu.be/');
}

/**
 * Renders an uploaded gallery video at its natural orientation/aspect ratio
 * (portrait stays portrait, landscape stays landscape), fitted to row height.
 */
function OrientationAwareVideo({ src, title }) {
    const [aspectRatio, setAspectRatio] = useState(null);

    return (
        <Box
            sx={{
                height: '100%',
                width: 'auto',
                // Once metadata loads, lock the correct portrait/landscape box
                aspectRatio: aspectRatio ? String(aspectRatio) : 'auto',
                maxWidth: aspectRatio && aspectRatio < 1
                    ? { xs: '70vw', sm: '50vw', md: '360px' }
                    : 'none',
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <video
                src={src}
                controls
                playsInline
                preload="metadata"
                title={title}
                onLoadedMetadata={(e) => {
                    const { videoWidth, videoHeight } = e.currentTarget;
                    if (videoWidth > 0 && videoHeight > 0) {
                        setAspectRatio(videoWidth / videoHeight);
                    }
                }}
                style={{
                    height: '100%',
                    width: aspectRatio ? '100%' : 'auto',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    display: 'block',
                    backgroundColor: '#000'
                }}
            />
        </Box>
    );
}

/**
 * Horizontal “Kids Playing” gallery.
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

    if (items.length === 0) {
        return null;
    }

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

            <SnakeScrollGallery
                isHebrew={isHebrew}
                aria-label={title}
                trackColor={progressTrackColor}
                fillColor={progressFillColor}
                rowSx={{
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
                                <OrientationAwareVideo
                                    src={mediaUrl}
                                    title={`${title} ${index + 1}`}
                                />
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
            </SnakeScrollGallery>
        </Box>
    );
});

export default ChildrenPlayingSection;
