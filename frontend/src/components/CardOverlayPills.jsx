import React from 'react';
import { Box, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PriceDisplay from './PriceDisplay';

const RECT_BG = 'rgba(245, 240, 227, 0.9)';
const RECT_BG_HOVER = 'rgba(245, 240, 227, 0.95)';
const ACCENT = 'rgba(199, 61, 34, 1)';

const rectBaseSx = {
  backgroundColor: RECT_BG,
  backdropFilter: 'blur(25px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  borderRadius: '10px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: RECT_BG_HOVER,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)',
    '& .product-name, & .product-price': {
      color: ACCENT,
      transition: 'color 0.3s ease'
    }
  }
};

/**
 * Bottom overlay for ProductCard / BundleCard:
 * separate name (right) and price+arrow (left) pills with aligned bottoms.
 */
export default function CardOverlayPills({ name, pricing, onPriceClick, isHebrew = true }) {
  return (
    <Box
      sx={{
        // Physical LTR layout: price left, name right (matches existing cards)
        direction: 'ltr',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: { xs: 1, sm: 1.5, md: 2 },
        width: '100%',
        margin: 0
      }}
    >
      {/* Price + arrow — left */}
      <Box
        onClick={onPriceClick}
        sx={{
          ...rectBaseSx,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 0.5, sm: 1, md: 1.25 },
          flexShrink: 0,
          cursor: 'pointer',
          padding: { xs: '6px 10px', sm: '10px 16px', md: '12px 20px' },
          '&:hover .card-pill-arrow': {
            transform: 'scale(1.1)'
          }
        }}
      >
        <Box
          className="card-pill-arrow"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.3s ease'
          }}
        >
          <ArrowBackIcon
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
              color: ACCENT
            }}
          />
        </Box>
        <Typography
          className="product-price"
          variant="h6"
          component="div"
          sx={{
            color: '#1d1d1f',
            fontWeight: 600,
            textAlign: 'center',
            flexShrink: 0,
            minWidth: 'fit-content',
            fontSize: { xs: '0.9rem', sm: '1.4rem', md: '1.8rem' },
            lineHeight: 1.2,
            m: 0
          }}
        >
          <PriceDisplay
            pricing={pricing}
            format={(n) => `₪ ${n.toFixed(2)}`}
            sx={{ justifyContent: 'center' }}
          />
        </Typography>
      </Box>

      {/* Name — right; width capped, height grows to fit the full name */}
      <Box
        sx={{
          ...rectBaseSx,
          width: 'fit-content',
          maxWidth: { xs: '55%', sm: '52%', md: '50%' },
          height: 'auto',
          marginLeft: 'auto',
          padding: { xs: '6px 12px', sm: '10px 18px', md: '12px 22px' },
          cursor: 'default',
          pointerEvents: 'none',
          overflow: 'visible'
        }}
      >
        <Typography
          className="product-name"
          variant="h6"
          component="div"
          sx={{
            fontWeight: 500,
            textAlign: 'right',
            direction: isHebrew ? 'rtl' : 'ltr',
            color: '#1d1d1f',
            lineHeight: 1.25,
            fontSize: { xs: '0.9rem', sm: '1.4rem', md: '1.8rem' },
            m: 0,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            overflow: 'visible',
            textOverflow: 'clip',
            hyphens: 'manual'
          }}
        >
          {name}
        </Typography>
      </Box>
    </Box>
  );
}
