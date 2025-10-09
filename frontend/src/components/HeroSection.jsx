import React, { useEffect, useRef } from 'react';
import { Card, CardMedia, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function HeroSection() {
    const cardRef = useRef(null);
    const { isHebrew } = useLanguage();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    return (
        <Card
            ref={cardRef}
            sx={{
                height: { xs: 'calc(87vh - 85px)', sm: '87vh' }, // Reduced by 85px on mobile
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '15px', // More rounded corners
                boxShadow: 'none', // Removed shadow effect
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Enhanced timing
                opacity: 0,
                transform: 'translateY(50px) scale(0.95)', // Enhanced initial state
                margin: '15px 0px 15px 0px',
                backgroundColor: 'transparent', // Transparent background
                '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)', // Enhanced hover effect
                    boxShadow: 'none' // Removed shadow from hover effect
                }
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '15px',
                    backgroundImage: {
                        xs: 'url(/first_web.jpg)',
                        md: 'url(/hero_section.jpg)'
                    },
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* Button Overlay - Positioned in lower quarter */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '10%', // Lower quarter of the hero section
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10
                }}
            >
                <Link to="/product/1" style={{ textDecoration: 'none' }}>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            border: '1px solid rgba(245, 240, 227, 1)',
                            color: 'rgba(245, 240, 227, 1)',
                            px: { xs: 3, md: 4 },
                            py: { xs: 1.5, md: 2 },
                            fontSize: { xs: '1.1rem', md: '1.4rem', lg: '1.5rem' },
                            fontWeight: 600,
                            borderRadius: 3,
                            boxShadow: '0 8px 32px rgba(229, 90, 61, 0.4)',
                            transition: 'all 0.3s ease',
                            minWidth: { xs: '200px', md: '250px' },
                            '&:hover': {
                                backgroundColor: 'rgba(245, 240, 227, 1)',
                                color: 'rgba(229, 90, 61, 1)',
                                transform: 'translateY(-4px)',
                                boxShadow: '0 12px 40px rgba(229, 90, 61, 0.5)',
                            }
                        }}
                    >
                        {isHebrew ? 'ערכת המקדש' : 'The Second Mikdash'}
                    </Button>
                </Link>
            </Box>
        </Card>
    );
} 