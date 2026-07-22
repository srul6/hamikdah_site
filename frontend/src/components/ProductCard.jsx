import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardMedia, CardContent, Typography, Box, Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { getImageUrl } from '../utils/imageUtils';

const SNAKE_COLOR = 'rgb(250, 250, 250)';
const CARD_RADIUS = 15;
const STROKE_WIDTH = 2;

export default function ProductCard({ product, onAddToCart }) {
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const { language, isHebrew } = useLanguage();
  const t = translations[language];
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Get the appropriate name and description based on language
  const productName = isHebrew ? product.name_he : product.name_en;

  // Get default color (first color in the array, or null if no colors)
  const getDefaultColor = () => {
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors[0]; // First color is default
    }
    return null;
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

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

    observer.observe(el);

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);

    return () => {
      observer.disconnect();
      ro.disconnect();
    };
  }, []);

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleLearnMoreClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking Learn More
    navigate(`/product/${product.id}`);
  };

  // Stroke is centered on the path — place path so the stroke sits on the card edge
  const inset = STROKE_WIDTH / 2;
  const rectW = Math.max(0, size.w - STROKE_WIDTH);
  const rectH = Math.max(0, size.h - STROKE_WIDTH);
  const rectRx = Math.max(0, CARD_RADIUS - inset);

  return (
    <Box
      ref={wrapRef}
      onClick={handleCardClick}
      sx={{
        height: { xs: '28vh', sm: '40vh', md: '70vh' },
        width: { xs: '38vh', sm: '40vh', md: '70vh' },
        position: 'relative',
        borderRadius: `${CARD_RADIUS}px`,
        margin: { xs: '0px 0px 0px 0px', md: '20px 0px 20px 0px' },
        cursor: 'pointer',
        opacity: 0,
        transform: 'translateY(50px) scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        // Allow snake stroke to sit on the outer edge without being clipped
        overflow: 'visible',
        '& .product-snake-path': {
          strokeDasharray: 1,
          strokeDashoffset: 1,
          // Hide completely when idle — round stroke caps leave a tiny dot otherwise
          opacity: 0,
          transition: 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.01s linear 1.15s'
        },
        '&:hover .product-snake-path': {
          strokeDashoffset: 0,
          opacity: 1,
          transition: 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0s linear'
        }
      }}
    >
      <Card
        sx={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: `${CARD_RADIUS}px`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: `${STROKE_WIDTH}px solid rgba(199, 61, 34, 1)`,
          boxSizing: 'border-box'
        }}
      >
        {/* Add to Cart Button - Top Left Corner */}
        {onAddToCart && (
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              if (product.quantity > 0) {
                onAddToCart(product, getDefaultColor());
              }
            }}
            disabled={!product || product.quantity <= 0}
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
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                color: '#999',
                cursor: 'not-allowed'
              }
            }}
          >
            {product && product.quantity > 0 ?
              t.addToCart :
              (isHebrew ? 'בקרוב' : 'Coming Soon')
            }
          </Button>
        )}
        <CardMedia
          component="img"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          image={getImageUrl(product.homepageimage)}
          alt={productName}
        />

        <CardContent
          sx={{
            position: 'absolute',
            bottom: { xs: -4, sm: 0, md: 0 },
            left: 0,
            right: 0,
            color: 'white',
            pt: 8,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(245, 240, 227, 0.9)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              borderRadius: '10px',
              margin: '0px',
              width: '100%',
              padding: { xs: '6px 14px', sm: '12px 24px', md: '16px 28px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 1, sm: 3, md: 4 },
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(245, 240, 227, 0.95)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                transform: 'translateY(-2px)',
                '& .product-name': {
                  color: 'rgba(199, 61, 34, 1)',
                  transition: 'color 0.3s ease'
                },
                '& .product-price': {
                  color: 'rgba(199, 61, 34, 1)',
                  transition: 'color 0.3s ease'
                }
              }
            }}
          >
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
                  fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                  color: 'rgba(199, 61, 34, 1)'
                }}
              />
            </Box>

            <Typography
              className="product-price"
              variant="h6"
              sx={{
                color: '#1d1d1f',
                fontWeight: 600,
                textAlign: 'center',
                flexShrink: 0,
                minWidth: 'fit-content',
                fontSize: { xs: '0.9rem', sm: '1.4rem', md: '1.8rem' }
              }}
            >
              ₪ {Number(product.price || 0).toFixed(2)}
            </Typography>

            <Typography
              className="product-name"
              variant="h6"
              sx={{
                fontWeight: 500,
                textAlign: 'right',
                flex: 1,
                lineHeight: 1.2,
                maxWidth: { xs: '45%', sm: '50%', md: '55%' },
                color: '#1d1d1f',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: '0.9rem', sm: '1.4rem', md: '1.8rem' }
              }}
            >
              {productName}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Snake sits on the exact card edge (sibling, not clipped by Card overflow) */}
      {size.w > 0 && size.h > 0 && (
        <Box
          component="svg"
          aria-hidden
          width={size.w}
          height={size.h}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size.w,
            height: size.h,
            zIndex: 6,
            pointerEvents: 'none',
            overflow: 'visible',
            transform: isHebrew ? 'scaleX(-1)' : 'none'
          }}
        >
          <rect
            className="product-snake-path"
            x={inset}
            y={inset}
            width={rectW}
            height={rectH}
            rx={rectRx}
            ry={rectRx}
            pathLength={1}
            fill="none"
            stroke={SNAKE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
        </Box>
      )}
    </Box>
  );
}
