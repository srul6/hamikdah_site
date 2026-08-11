import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { fetchComments } from '../api/comments';
import SnakeScrollGallery from './SnakeScrollGallery';

export default function CommentsSection() {
    const sectionRef = useRef(null);
    const [playingVideos, setPlayingVideos] = useState({});
    const videoRefs = useRef({});
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    // Fetch comments from API
    useEffect(() => {
        async function loadComments() {
            try {
                setLoading(true);
                const data = await fetchComments();
                // Convert snake_case to camelCase for compatibility
                const formattedComments = data.map(comment => ({
                    ...comment,
                    videoUrl: comment.video_url || comment.videoUrl,
                    imageUrl: comment.image_url || comment.imageUrl
                }));
                setComments(formattedComments);
            } catch (error) {
                console.error('Error loading comments:', error);
                // Keep comments as empty array on error
                setComments([]);
            } finally {
                setLoading(false);
            }
        }
        loadComments();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const handleVideoClick = (commentId) => {
        const videoElement = videoRefs.current[commentId];
        if (videoElement) {
            if (playingVideos[commentId]) {
                videoElement.pause();
            } else {
                videoElement.play();
            }
        }

        setPlayingVideos(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const handleVideoEnded = (commentId) => {
        setPlayingVideos(prev => ({
            ...prev,
            [commentId]: false
        }));
    };

    const statusMessage = loading
        ? (isHebrew ? 'טוען תגובות...' : 'Loading comments...')
        : (isHebrew ? 'אין תגובות זמינות כרגע' : 'No comments available yet');

    const showGallery = !loading && comments.length > 0;

    return (
        <Box
            ref={sectionRef}
            sx={{
                py: { xs: 9, md: 11 },
                backgroundColor: '#ebe4d4',
                opacity: 0,
                transform: 'translateY(50px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <Box sx={{ textAlign: 'center', mb: 0, px: { xs: 2, md: 4 } }}>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 400,
                        color: '#1d1d1f',
                        mb: 1,
                        fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                    }}
                >
                    {t.whatOurCustomersSay}
                </Typography>
                <Typography
                    sx={{
                        color: '#86868b',
                        fontWeight: 400,
                        fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
                        lineHeight: 1.4,
                        maxWidth: 640,
                        mx: 'auto',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 1
                    }}
                >
                    {t.whatOurCustomersSaySubtitle}
                </Typography>
            </Box>

            <Box sx={{
                position: 'relative',
                maxWidth: 'calc(100% - 32px)',
                margin: '0 auto',
                pt: 1,
                pb: 2
            }}>
                {!showGallery ? (
                    <Box sx={{
                        width: '100%',
                        textAlign: 'center',
                        py: 8,
                        color: '#666'
                    }}>
                        <Typography variant="h6">
                            {statusMessage}
                        </Typography>
                    </Box>
                ) : (
                    <SnakeScrollGallery
                        isHebrew={isHebrew}
                        aria-label={t.whatOurCustomersSay}
                        trackColor="rgba(216, 71, 42, 0.25)"
                        fillColor="#d8472a"
                        mapVerticalWheel={false}
                        scrollContainerSx={{
                            // Leave room for card hover lift
                            overflowY: 'visible',
                            pt: 2,
                            px: 2
                        }}
                        rowSx={{
                            alignItems: 'stretch',
                            py: 1
                        }}
                        snakeOuterSx={{
                            mt: 3
                        }}
                    >
                        {comments.map((comment) => {
                            const customerName = isHebrew ? comment.name_he : comment.name_en;
                            const showName = Boolean(customerName);

                            return (
                                <Card
                                    key={comment.id}
                                    sx={{
                                        minWidth: { xs: '100%', sm: 260, md: 260, lg: 300, xl: 360 },
                                        maxWidth: { xs: '100%', sm: 260, md: 260, lg: 300, xl: 360 },
                                        height: { xs: 390, sm: 390, md: 390, lg: 420, xl: 490 },
                                        flexShrink: 0,
                                        borderRadius: 3,
                                        border: '2px solid #d8472a',
                                        backgroundColor: 'transparent',
                                        backgroundImage: 'none',
                                        boxShadow: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        p: comment.type === 'text' ? 3 : 0,
                                        pb: (comment.type === 'text' || comment.type === 'image') && showName ? 7 : 0,
                                        textAlign: 'center',
                                        overflow: 'hidden',
                                        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        '&.MuiPaper-root': {
                                            backgroundColor: 'transparent',
                                            backgroundImage: 'none',
                                        },
                                        '&:hover': {
                                            borderColor: 'white',
                                            transform: 'translateY(-8px) scale(1.02)',
                                        }
                                    }}
                                >
                                    {comment.type === 'text' ? (
                                        <Box
                                            data-nested-y-scroll
                                            sx={{
                                                flex: 1,
                                                overflowY: 'auto',
                                                overflowX: 'hidden',
                                                width: '100%',
                                                px: 1,
                                                minHeight: 0,
                                                // SnakeScrollGallery owns touch axes for this node
                                                touchAction: 'none',
                                                overscrollBehavior: 'contain',
                                                WebkitOverflowScrolling: 'touch',
                                                '&::-webkit-scrollbar': {
                                                    width: '6px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: 'transparent',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: '#d8472a',
                                                    borderRadius: '3px',
                                                    '&:hover': {
                                                        background: '#b8381f',
                                                    },
                                                },
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: '#d8472a transparent',
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    color: '#1d1d1f',
                                                    fontSize: '1.1rem',
                                                    lineHeight: 1.6,
                                                    fontWeight: 400,
                                                    direction: isHebrew ? 'rtl' : 'ltr',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                "{isHebrew ? comment.text_he : comment.text_en}"
                                            </Typography>
                                        </Box>
                                    ) : comment.type === 'video' ? (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                backgroundColor: '#1a1a1a'
                                            }}
                                        >
                                            <video
                                                src={
                                                    comment.videoUrl
                                                        ? `${comment.videoUrl}${comment.videoUrl.includes('#') ? '' : '#t=0.1'}`
                                                        : undefined
                                                }
                                                preload="metadata"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    display: 'block',
                                                    backgroundColor: '#1a1a1a'
                                                }}
                                                onClick={() => handleVideoClick(comment.id)}
                                                onEnded={() => handleVideoEnded(comment.id)}
                                                onLoadedMetadata={(e) => {
                                                    const video = e.currentTarget;
                                                    if (!playingVideos[comment.id] && video.currentTime < 0.05) {
                                                        try {
                                                            video.currentTime = 0.1;
                                                        } catch (_) {
                                                            // Ignore seek errors (some mobile browsers)
                                                        }
                                                    }
                                                }}
                                                muted={!playingVideos[comment.id]}
                                                playsInline
                                                controls={false}
                                                ref={(el) => {
                                                    if (el) {
                                                        videoRefs.current[comment.id] = el;
                                                        if (playingVideos[comment.id]) {
                                                            el.play();
                                                        } else {
                                                            el.pause();
                                                        }
                                                    }
                                                }}
                                            />

                                            <IconButton
                                                onClick={() => handleVideoClick(comment.id)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                    color: 'white',
                                                    zIndex: 1,
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.8)'
                                                    }
                                                }}
                                            >
                                                {playingVideos[comment.id] ? <PauseIcon /> : <PlayArrowIcon />}
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                flex: 1,
                                                width: '100%',
                                                minHeight: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                pb: 7,
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={comment.imageUrl}
                                                alt={customerName}
                                                sx={{
                                                    width: '100%',
                                                    height: 'auto',
                                                    display: 'block',
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {showName && (
                                        comment.type === 'video' ? (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 24,
                                                    zIndex: 2,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    px: 3,
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        color: '#d8472a',
                                                        fontWeight: 600,
                                                        m: 0,
                                                        py: 0.25,
                                                        backgroundColor: '#ebe4d4',
                                                        borderRadius: 0,
                                                        direction: isHebrew ? 'rtl' : 'ltr',
                                                        display: 'inline-block',
                                                        width: '100%',
                                                        maxWidth: '100%'
                                                    }}
                                                >
                                                    {customerName}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 24,
                                                    zIndex: 2,
                                                    color: '#d8472a',
                                                    fontWeight: 600,
                                                    m: 0,
                                                    px: 3,
                                                    direction: isHebrew ? 'rtl' : 'ltr',
                                                }}
                                            >
                                                {customerName}
                                            </Typography>
                                        )
                                    )}
                                </Card>
                            );
                        })}
                    </SnakeScrollGallery>
                )}
            </Box>
        </Box>
    );
}
