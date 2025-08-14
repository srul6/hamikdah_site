import React, { useEffect, useRef } from 'react';
import { Card, CardMedia } from '@mui/material';

export default function VideoCard() {
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
        height: 'calc(80vh - 130px)', // Same height as product cards
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '15px', // More rounded corners
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Enhanced timing
        opacity: 0,
        transform: 'translateY(50px) scale(0.95)', // Enhanced initial state
        margin: '20px 0px 50px 0px',
        backgroundColor: 'transparent', // Transparent background
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)', // Enhanced hover effect
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)', // Enhanced shadow
        }
      }}
    >
      <CardMedia
        component="video"
        sx={{
          width: '100%', // Full width - no padding needed
          height: '100%', // Full height - no padding needed
          objectFit: 'cover',
          borderRadius: '15px', // More rounded corners
          display: 'block'
        }}
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </CardMedia>
    </Card>
  );
} 