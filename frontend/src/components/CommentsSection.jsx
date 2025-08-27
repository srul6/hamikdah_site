import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

// Comments data - easily editable
// Add 'type' field: 'text' for written comments, 'video' for video comments
// For videos, add 'videoUrl' field with the video file path
const comments = [
    {
        id: 1,
        name_he: "דוד כהן",
        name_en: "David Cohen",
        text_he: "המוצרים איכותיים מאוד ומגיעים בזמן. ממליץ בחום!",
        text_en: "The products are very high quality and arrive on time. Highly recommend!",
        type: "text",
        rating: 5
    },
    {
        id: 2,
        name_he: "משה גולדברג",
        name_en: "Moshe Goldberg",
        videoUrl: "/comment1.mp4", // Example video path
        type: "video",
        rating: 5
    },
    {
        id: 3,
        name_he: "שרה לוי",
        name_en: "Sarah Levy",
        text_he: "שירות לקוחות מעולה ומוצרים יפים. אהבתי במיוחד את הנרות.",
        text_en: "Excellent customer service and beautiful products. I especially loved the candles.",
        type: "text",
        rating: 5
    },
    {
        id: 4,
        name_he: "רחל אברהם",
        name_en: "Rachel Abraham",
        text_he: "הדגמים של בית הכנסת והמקדש מדהימים. מושלם לבית.",
        text_en: "The synagogue and temple models are amazing. Perfect for the home.",
        type: "text",
        rating: 5
    },
    {
        id: 5,
        name_he: "יוסף שפירא",
        name_en: "Yosef Shapiro",
        videoUrl: "/testimonial-video-2.mp4", // Example video path
        type: "video",
        rating: 5
    },
    {
        id: 6,
        name_he: "מיכל רוזן",
        name_en: "Michal Rosen",
        text_he: "המוצרים מעוצבים יפה ומתאימים לכל בית יהודי.",
        text_en: "The products are beautifully designed and suitable for every Jewish home.",
        type: "text",
        rating: 5
    }
];

export default function CommentsSection() {
    const sectionRef = useRef(null);
    const [playingVideos, setPlayingVideos] = useState({});
    const videoRefs = useRef({});
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

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
                    {comments.map((comment) => (
                        <Card
                            key={comment.id}
                            sx={{
                                minWidth: 280, // Less wide
                                maxWidth: 280, // Less wide
                                height: 350, // More tall
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
                            ) : (
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
                            )}
                        </Card>
                    ))}
                </Box>
            </Box>
        </Box>
    );
} 