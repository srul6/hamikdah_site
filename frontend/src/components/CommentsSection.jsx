import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { fetchComments } from '../api/comments';

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

    return (
        <Box
            ref={sectionRef}
            sx={{
                py: 8,
                backgroundColor: '#f5f0e3',
                opacity: 0,
                transform: 'translateY(50px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <Box sx={{ textAlign: 'center', mb: 0 }}>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 400,
                        color: '#1d1d1f',
                        mb: 0,
                        fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' }, // Increased font sizes

                    }}
                >
                    {t.whatOurCustomersSay}
                </Typography>
            </Box>

            <Box sx={{
                position: 'relative',
                maxWidth: 'calc(100% - 32px)',
                margin: '0 auto',
                pt: 1, // Increased top padding to prevent clipping
                pb: 2
            }}>
                {/* Comments Container */}
                <Box
                    id="comments-container"
                    sx={{
                        display: 'flex',
                        gap: 3,
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        '&::-webkit-scrollbar': {
                            display: 'none'
                        },
                        pt: 2,
                        px: 2
                    }}
                >
                    {loading ? (
                        <Box sx={{
                            width: '100%',
                            textAlign: 'center',
                            py: 8,
                            color: '#666'
                        }}>
                            <Typography variant="h6">
                                {isHebrew ? 'טוען תגובות...' : 'Loading comments...'}
                            </Typography>
                        </Box>
                    ) : comments.length === 0 ? (
                        <Box sx={{
                            width: '100%',
                            textAlign: 'center',
                            py: 8,
                            color: '#666'
                        }}>
                            <Typography variant="h6">
                                {isHebrew ? 'אין תגובות זמינות כרגע' : 'No comments available yet'}
                            </Typography>
                        </Box>
                    ) : comments.map((comment) => (
                        <Card
                            key={comment.id}
                            sx={{
                                minWidth: { xs: 320, sm: 340, md: 340, lg: 340, xl: 340 }, // Increased width
                                maxWidth: { xs: 320, sm: 340, md: 340, lg: 340, xl: 340 }, // Increased width
                                height: 390, // Increased height
                                flexShrink: 0,
                                borderRadius: 3, // Increased from 3 to 4 for more rounded corners
                                border: '2px solid #d8472a', // Black border
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: comment.type === 'text' ? 4 : 0, // Conditional padding - only for text frames
                                textAlign: 'center',
                                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                position: 'relative',
                                '&:hover': {
                                    borderColor: 'white',
                                    transform: 'translateY(-8px) scale(1.02)',
                                    // Removed boxShadow from hover effect
                                }
                            }}
                        >
                            {comment.type === 'text' ? (
                                // Text Comment
                                <>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#1d1d1f',
                                            fontSize: '1.1rem',
                                            lineHeight: 1.6,
                                            mb: 3,
                                            fontWeight: 400,
                                            direction: isHebrew ? 'rtl' : 'ltr'
                                        }}
                                    >
                                        "{isHebrew ? comment.text_he : comment.text_en}"
                                    </Typography>

                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: '#0071e3',
                                            fontWeight: 600,
                                            mb: 1,
                                            direction: isHebrew ? 'rtl' : 'ltr'
                                        }}
                                    >
                                        {isHebrew ? comment.name_he : comment.name_en}
                                    </Typography>
                                </>
                            ) : comment.type === 'video' ? (
                                // Video Comment
                                <>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <video
                                            src={comment.videoUrl}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                            onClick={() => handleVideoClick(comment.id)}
                                            onEnded={() => handleVideoEnded(comment.id)}
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

                                        {/* Play/Pause Overlay Button */}
                                        <IconButton
                                            onClick={() => handleVideoClick(comment.id)}
                                            sx={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'white',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)'
                                                }
                                            }}
                                        >
                                            {playingVideos[comment.id] ? <PauseIcon /> : <PlayArrowIcon />}
                                        </IconButton>
                                    </Box>
                                </>
                            ) : (
                                // Image Comment
                                <>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            position: 'relative',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f5f5f5'
                                        }}
                                    >
                                        <img
                                            src={comment.imageUrl}
                                            alt={isHebrew ? comment.name_he : comment.name_en}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </Box>
                                </>
                            )}
                        </Card>
                    ))}
                </Box>
            </Box>
        </Box>
    );
} 