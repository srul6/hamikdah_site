import React, { useEffect, useRef } from 'react';
import { Card, CardMedia } from '@mui/material';

export default function HeroSection() {
    const cardRef = useRef(null);

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
            <CardMedia
                component="img"
                sx={{
                    width: '100%', // Full width - no padding needed
                    height: '100%', // Full height - no padding needed
                    objectFit: 'cover',
                    borderRadius: '15px', // More rounded corners
                    display: 'block'
                }}
                image="/first_web.jpg" // You can change this to your image path
                alt="Hero Section"
            />
        </Card>
    );
} 