import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardMedia, Button, Chip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Lightbox from '../Lightbox';
import ColorSwatches from './ColorSwatches';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { getImageUrl } from '../../utils/imageUtils';
import { getProductPath } from '../../utils/productSlug';

/** Flip to true to open product pages in a new tab. */
export const OPEN_FULL_PRODUCT_IN_NEW_TAB = false;

/** Soft divider matching ProductDetail section separators. */
function SectionDivider() {
  return (
    <Box
      sx={{
        width: { xs: '60%', sm: '60%', md: '70%' },
        height: '1px',
        backgroundColor: 'rgba(229, 90, 61, 0.2)',
        mx: 'auto',
        my: { xs: 2.5, md: 2 }
      }}
    />
  );
}

function normalizeList(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.filter((x) => typeof x === 'string' && x.trim()).map((s) => s.trim());
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    if (s.includes(',')) {
      return s.split(',').map((x) => x.trim()).filter(Boolean);
    }
    return [s];
  }
  return [];
}

/**
 * Images for the current color (or product defaults).
 * Single-color products use that color's images without a picker.
 */
export function getBundleProductImages(product, selectedColor) {
  if (!product) return [];
  const homepage = product.homepageImage || product.homepageimage;
  const extras = normalizeList(product.extraImages || product.extraimages);
  const colors = Array.isArray(product.colors) ? product.colors : [];

  const color = selectedColor || (colors.length === 1 ? colors[0] : null);
  if (color) {
    const main = color.mainImage || homepage;
    const colorExtras = normalizeList(color.extraImages || color.extraimages);
    return [main, ...colorExtras].filter(Boolean);
  }

  return [homepage, ...extras].filter(Boolean);
}

/** ProductDetail gallery card sizes, scaled down for the compact bundle column. */
const GALLERY_THUMB = { xs: 168, sm: 190, md: 176 };
const MAIN_MAX = { xs: 340, sm: 360, md: 300 };

export default function BundleProductSection({
  product,
  index,
  selectedColor,
  onColorSelect,
  allProducts = null,
  sectionId
}) {
  const { language, isHebrew } = useLanguage();
  const t = translations[language];
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const productName = product
    ? (isHebrew ? product.name_he : product.name_en)
    : '';
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const hasColorPicker = colors.length > 1;
  const outOfStock = !(Number(product?.quantity) > 0);

  const images = useMemo(
    () => getBundleProductImages(product, selectedColor),
    [product, selectedColor]
  );
  const mainImage = images[0] || null;
  const galleryImages = images.length > 1 ? images.slice(1) : [];
  const lightboxImages = images.map((img) => getImageUrl(img));

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const productPath = getProductPath(product, allProducts);
  const linkProps = OPEN_FULL_PRODUCT_IN_NEW_TAB
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  const sectionPad = {
    xs: 0,
    md: 2.5
  };

  return (
    <Box
      id={sectionId}
      component="section"
      sx={{
        scrollMarginTop: { xs: '100px', md: '120px' },
        direction: isHebrew ? 'rtl' : 'ltr',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}
    >
      {/* Product title — centered */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          mb: { xs: 2, md: 2 },
          mt: { xs: 0.5, md: 0.75 },
          justifyContent: 'center',
          textAlign: 'center',
          px: sectionPad
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: 'rgba(229, 90, 61, 1)',
            fontWeight: 600,
            fontSize: { xs: '1.35rem', sm: '1.5rem', md: '1.35rem' },
            lineHeight: 1.25,
            textAlign: 'center',
            width: '100%'
          }}
        >
          {`${t.bundleSectionLabel} ${index + 1} - ${productName}`}
        </Typography>
        {outOfStock && (
          <Chip
            size="small"
            label={t.bundleSoldOut}
            sx={{
              backgroundColor: '#ccc',
              color: '#666',
              fontWeight: 500
            }}
          />
        )}
      </Box>

      {/* 1. Gallery — ProductDetail styling, scaled for bundle columns */}
      <Box
        component="section"
        aria-label={t.gallery}
        sx={{ width: '100%', px: sectionPad, py: { md: 1 } }}
      >
        {mainImage && (
          <Box
            onClick={() => openLightbox(0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(0);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={productName}
            sx={{
              width: '100%',
              maxWidth: MAIN_MAX,
              height: MAIN_MAX,
              mx: 'auto',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2,
              cursor: 'pointer'
            }}
          >
            <Box
              component="img"
              src={getImageUrl(mainImage)}
              alt={productName}
              loading="lazy"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                borderRadius: 2,
                display: 'block'
              }}
            />
          </Box>
        )}

        {galleryImages.length > 0 && (
          <Box sx={{ mt: 2, pb: { xs: 1, md: 0 } }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                mb: 1.5,
                textAlign: 'center',
                fontSize: { xs: '1.15rem', sm: '1.25rem', md: '1.2rem' }
              }}
            >
              {t.gallery}
            </Typography>
            {/* Constrain to main-image width so edges align (esp. mobile RTL right edge) */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxWidth: MAIN_MAX,
                mx: 'auto'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1.5, md: 1.5 },
                  overflowX: 'auto',
                  padding: 0,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  direction: isHebrew ? 'rtl' : 'ltr',
                  '&::-webkit-scrollbar': { display: 'none' }
                }}
              >
                {galleryImages.map((img, idx) => (
                  <Card
                    key={`${img}-${idx}`}
                    onClick={() => openLightbox(idx + 1)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openLightbox(idx + 1);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${productName} ${idx + 2}`}
                    sx={{
                      minWidth: GALLERY_THUMB,
                      width: GALLERY_THUMB,
                      height: GALLERY_THUMB,
                      flexShrink: 0,
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      '& img': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                      },
                      '&:hover': { transform: 'scale(1.02)' }
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={getImageUrl(img)}
                      alt={`${productName} gallery ${idx + 1}`}
                      loading="lazy"
                      sx={{
                        width: '100% !important',
                        height: '100% !important',
                        objectFit: 'cover !important',
                        objectPosition: 'center !important',
                        maxWidth: '100% !important',
                        maxHeight: '100% !important',
                        minWidth: '100% !important',
                        minHeight: '100% !important',
                        display: 'block !important',
                        flexShrink: '0 !important',
                        aspectRatio: '1 / 1',
                        borderRadius: '8px',
                        position: 'absolute !important',
                        top: '0 !important',
                        left: '0 !important',
                        right: '0 !important',
                        bottom: '0 !important'
                      }}
                    />
                  </Card>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* 2. Colors — compact to match scaled gallery */}
      {hasColorPicker && (
        <>
          <SectionDivider />
          <Box
            component="section"
            aria-label={t.colors}
            sx={{ width: '100%', px: sectionPad, py: { md: 1 } }}
          >
            <ColorSwatches
              colors={colors}
              selectedColor={selectedColor}
              onSelect={onColorSelect}
              compact
              centered
            />
          </Box>
        </>
      )}

      {/* 3. Original product page link — underline, no border */}
      <SectionDivider />
      <Box
        component="section"
        aria-label={t.viewFullProductPage}
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          px: sectionPad,
          py: { xs: 0.5, md: 1.5 }
        }}
      >
        <Button
          component={RouterLink}
          to={productPath}
          {...linkProps}
          variant="text"
          disableRipple
          sx={{
            color: 'rgba(229, 90, 61, 1)',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.95rem', md: '0.9rem' },
            px: 0.5,
            py: 0.5,
            minWidth: 0,
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            border: 'none',
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'transparent',
              textDecoration: 'underline',
              color: 'rgba(199, 61, 34, 1)'
            }
          }}
        >
          {t.viewFullProductPage}
        </Button>
      </Box>

      {lightboxOpen && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={(direction) => {
            if (direction === 'prev' && lightboxIndex > 0) {
              setLightboxIndex(lightboxIndex - 1);
            } else if (
              direction === 'next' &&
              lightboxIndex < lightboxImages.length - 1
            ) {
              setLightboxIndex(lightboxIndex + 1);
            }
          }}
        />
      )}
    </Box>
  );
}
