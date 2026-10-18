import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, Box, Button
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { getBundlePath } from '../utils/bundleSlug';
import { getBundlePricingView } from '../utils/bundlePricingView';
import { defaultBundleSelectionMap } from '../utils/bundleCart';
import CardOverlayPills from './CardOverlayPills';
import BundleImage from './BundleImage';

const SNAKE_COLOR = 'rgb(250, 250, 250)';
const CARD_RADIUS = 15;
const STROKE_WIDTH = 2;
const BORDER_COLOR = 'rgba(199, 61, 34, 1)';

export default function BundleCard({ bundle, onAddBundle }) {
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const { language, isHebrew } = useLanguage();
  const t = translations[language];
  const [size, setSize] = useState({ w: 0, h: 0 });

  const bundleName = isHebrew ? bundle.name_he : bundle.name_en;
  const available = bundle.available !== false;
  const pricing = getBundlePricingView(bundle);

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
    navigate(getBundlePath(bundle));
  };

  const handleLearnMoreClick = (e) => {
    e.stopPropagation();
    navigate(getBundlePath(bundle));
  };

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
        overflow: 'visible',
        '& .product-snake-path': {
          strokeDasharray: 1,
          strokeDashoffset: 1,
          opacity: 0,
          transition: 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.01s linear 1.15s'
        },
        '&:hover .product-snake-path': {
          strokeDashoffset: 0,
          opacity: 1,
          transition: 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0s linear'
        },
        '@media (hover: hover) and (pointer: fine)': {
          '&:hover .bundle-card-image-primary': {
            transform: 'scale(1.06)'
          }
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
          border: `${STROKE_WIDTH}px solid ${BORDER_COLOR}`,
          boxSizing: 'border-box'
        }}
      >
        {available && onAddBundle ? (
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onAddBundle(bundle, defaultBundleSelectionMap(bundle));
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
            {t.addToCart}
          </Button>
        ) : !available ? (
          <Button
            variant="contained"
            disabled
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
              pointerEvents: 'none',
              '&:disabled': {
                backgroundColor: '#ccc',
                color: '#999',
                cursor: 'not-allowed'
              }
            }}
          >
            {t.bundleSoldOut}
          </Button>
        ) : null}

        <Box
          className="bundle-card-image-primary"
          sx={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            transform: 'scale(1)',
            transformOrigin: 'center center',
            transition: 'transform 0.45s ease'
          }}
        >
          <BundleImage bundle={bundle} alt={bundleName} />
        </Box>

        <CardContent
          sx={{
            position: 'absolute',
            bottom: { xs: -4, sm: 0, md: 0 },
            left: 0,
            right: 0,
            zIndex: 2,
            color: 'white',
            pt: 6
          }}
        >
          <CardOverlayPills
            name={bundleName}
            pricing={pricing}
            onPriceClick={handleLearnMoreClick}
            isHebrew={isHebrew}
          />
        </CardContent>
      </Card>

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
