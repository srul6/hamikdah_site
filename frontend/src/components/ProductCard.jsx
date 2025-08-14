import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardMedia, CardContent, Typography, Box, Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ProductCard({ product, onAddToCart }) {
  const cardRef = useRef(null);
  const navigate = useNavigate();

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

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleLearnMoreClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking Learn More
    navigate(`/product/${product.id}`);
  };

  return (
    <Card
      ref={cardRef}
      onClick={handleCardClick}
      sx={{
        height: { xs: '28vh', sm: '40vh', md: '70vh' }, // Further reduced mobile height
        width: { xs: '36vh', sm: '40vh', md: '70vh' },
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // Enhanced timing
        opacity: 0,
        transform: 'translateY(50px) scale(0.95)', // Enhanced initial state
        cursor: 'pointer',
        margin: { xs: '0px 0px 0px 0px', md: '20px 0px 20px 0px' }, // Smaller margin on mobile
        border: '2px solid #d8472a', // Transparent border by default
        '&:hover': {
          border: '2px solid transparent', // Show border on hover
          transition: 'border 0.3s ease' // Smooth border transition
        }
      }}
    >
      {/* Add to Cart Button - Top Left Corner */}
      {onAddToCart && (
        <Button
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          sx={{
            position: 'absolute',
            top: { xs: 14, sm: 18, md: 18 },
            left: { xs: 14, sm: 18, md: 18 },
            zIndex: 10,
            backgroundColor: 'rgba(199, 61, 34, 1)',
            color: 'rgb(245, 240, 227)',
            px: 1.5,
            py: 0.60,
            fontSize: { xs: '0.8rem', md: '1.5rem' },
            fontWeight: 300,
            borderRadius: 1.5,
            minWidth: 'auto',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: 'rgb(245, 240, 227)',
              color: 'rgba(199, 61, 34, 1)',
              boxShadow: 'none',
              transition: 'background-color 0.3s ease'
            }
          }}
        >
          הוסף לסל
        </Button>
      )
      }
      <CardMedia
        component="img"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Removed borderRadius to prevent gaps
        }}
        image={product.homepageImage}
        alt={product.name}
      />

      <CardContent
        sx={{
          position: 'absolute',
          bottom: { xs: -4, sm: 0, md: 0 },
          left: 0,
          right: 0,
          color: 'white',
          pt: 8,
          // Removed backdropFilter blur
        }}
      >
        {/* Navbar-style container for product info */}
        <Box
          sx={{
            backgroundColor: 'rgba(245, 240, 227, 0.9)', // Changed to match site background #f5f0e3
            backdropFilter: 'blur(25px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            borderRadius: '10px',
            margin: '0px',
            width: '100%', // Changed from calc(100% - 32px) to 100%
            padding: { xs: '6px 14px', sm: '12px 24px', md: '16px 28px' }, // Reduced mobile padding
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1, sm: 3, md: 4 }, // Reduced mobile gap
            transition: 'all 0.3s ease',
            cursor: 'pointer', // Added cursor pointer for better UX
            '&:hover': {
              backgroundColor: 'rgba(245, 240, 227, 0.95)', // Changed to match site background
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-2px)', // Slight lift effect
              '& .product-name': {
                color: 'rgba(199, 61, 34, 1)', // Change name color on hover
                transition: 'color 0.3s ease'
              },
              '& .product-price': {
                color: 'rgba(199, 61, 34, 1)', // Change price color on hover
                transition: 'color 0.3s ease'
              }
            }
          }}
        >
          {/* Left: Arrow Button */}
          <Box
            onClick={handleLearnMoreClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              flexShrink: 0,
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
          >
            <ArrowBackIcon
              sx={{
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' }, // Responsive font size
                color: 'rgba(199, 61, 34, 1)'
              }}
            />
          </Box>

          {/* Center: Price */}
          <Typography
            className="product-price"
            variant="h6"
            sx={{
              color: '#1d1d1f',
              fontWeight: 600,
              textAlign: 'center',
              flexShrink: 0,
              minWidth: 'fit-content',
              fontSize: { xs: '0.9rem', sm: '1.4rem', md: '1.8rem' } // Reduced mobile font size
            }}
          >
            ₪{(product.price || 0).toFixed(2)}
          </Typography>

          {/* Right: Product Name */}
          <Typography
            className="product-name"
            variant="h6"
            sx={{
              fontWeight: 500,
              textAlign: 'right',
              flex: 1,
              lineHeight: 1.2,
              maxWidth: { xs: '45%', sm: '50%', md: '55%' }, // Responsive max width
              color: '#1d1d1f',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: { xs: '0.9rem', sm: '1.4rem', md: '1.8rem' } // Reduced mobile font size
            }}
          >
            {product.name}
          </Typography>
        </Box>
      </CardContent>
    </Card >
  );
}