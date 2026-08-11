import React, { useEffect, useRef, useMemo } from 'react';
import { Card, Button, Box, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { getProductPath, isMikdashProduct } from '../utils/productSlug';

export default function HeroSection({ products = [] }) {
    const cardRef = useRef(null);
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const mikdashProduct = useMemo(
        () => (Array.isArray(products) ? products.find((p) => isMikdashProduct(p)) : null),
        [products]
    );

    const mikdashPath = mikdashProduct
        ? getProductPath(mikdashProduct, products)
        : '/';

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
                        xs: 'url(/first_web.webp)',
                        md: 'url(/hero_section.webp)'
                    },
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            {/* Miluim Image - Centered on mobile, left with rotation on desktop */}
            <Box
                sx={{
                    position: 'absolute',
                    top: { xs: '9%', md: '8%' },
                    left: { xs: '50%', md: '5%' },
                    transform: {
                        xs: 'translateX(-50%) rotate(0deg)',
                        md: 'translateX(0) rotate(-12deg)'
                    },
                    zIndex: 10,
                    backgroundColor: 'rgba(229, 90, 61, 1)',
                    border: '1px solid rgba(245, 240, 227, 1)',
                    borderRadius: 1,
                    boxShadow: '0 8px 32px rgba(229, 90, 61, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    transformOrigin: 'center center',
                }}
            >
                <Box
                    component="img"
                    src="/miluim.jpeg"
                    alt="Miluim"
                    sx={{
                        width: { xs: '180px', sm: '220px', md: '400px', lg: '400px' },
                        height: 'auto',
                        borderRadius: 0,
                        display: 'block',
                        objectFit: 'contain'
                    }}
                />
            </Box>

            {/* Mobile: delivery note below hero slogan */}
            <Typography
                sx={{
                    display: { xs: 'block', md: 'none' },
                    position: 'absolute',
                    top: '72%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    color: '#fff',
                    fontSize: { xs: '0.9rem', sm: '0.95rem' },
                    fontWeight: 300,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    direction: isHebrew ? 'rtl' : 'ltr',
                    pointerEvents: 'none',
                    textShadow: '0 1px 4px rgba(0,0,0,0.25)'
                }}
            >
                {t.deliveryWithin7Days}
            </Typography>

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
                <Link to={mikdashPath} style={{ textDecoration: 'none' }}>
                    <Button
                        variant="contained"
                        startIcon={isHebrew ? <ArrowBackIcon /> : null}
                        endIcon={!isHebrew ? <ArrowForwardIcon /> : null}
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
                            '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                                '& > *:nth-of-type(1)': {
                                    fontSize: { xs: '1.25rem', md: '1.5rem' }
                                }
                            },
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
