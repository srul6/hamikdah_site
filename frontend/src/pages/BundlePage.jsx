import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Button,
  Chip
} from '@mui/material';
import { fetchBundleBySlug } from '../api/bundles';
import { fetchProducts } from '../api/products';
import { decodeBundleSlugParam } from '../utils/bundleSlug';
import { getBundlePricingView } from '../utils/bundlePricingView';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import PriceDisplay from '../components/PriceDisplay';
import BundleSeo from '../components/BundleSeo';
import BundleProductSection from '../components/bundle/BundleProductSection';
import { trackViewContent, resetViewContentDedupe } from '../analytics/metaTracking';
import { trackGa4ViewItem, resetGa4ViewItemDedupe } from '../analytics/ga4Tracking';
import { subscribe } from '../consent/consentManager';

const CTA_ORANGE = 'rgba(229, 90, 61, 1)';
const CTA_BEIGE = 'rgba(245, 240, 227, 1)';

function buildInitialSelection(items) {
  const map = {};
  for (const item of items || []) {
    const product = item?.product;
    if (!product?.id) continue;
    const colors = Array.isArray(product.colors) ? product.colors : [];
    map[product.id] = colors.length > 0 ? colors[0] : null;
  }
  return map;
}

/**
 * Full bundle page at /bundle/:slug.
 * Optional onAddBundle(bundle, selection).
 */
export default function BundlePage({ onAddBundle }) {
  const { slug: rawSlug } = useParams();
  const { language, isHebrew } = useLanguage();
  const t = translations[language];

  const [bundle, setBundle] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [selection, setSelection] = useState({});
  const [activeProductId, setActiveProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Sticky CTA — same pattern as ProductDetail: fixed while scrolling, docks at page end
  const [isSticky, setIsSticky] = useState(true);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const buttonTargetRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [rawSlug]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setLoadError(false);
      setBundle(null);
      setSelection({});
      setActiveProductId(null);
      setIsSticky(true);
      setHasReachedTarget(false);
      resetViewContentDedupe();
      resetGa4ViewItemDedupe();

      const slug = decodeBundleSlugParam(rawSlug);
      if (!slug) {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      try {
        const [data, products] = await Promise.all([
          fetchBundleBySlug(slug),
          fetchProducts()
        ]);
        if (cancelled) return;

        if (!data) {
          setNotFound(true);
        } else {
          setBundle(data);
          setSelection(buildInitialSelection(data.items));
          const first = [...(data.items || [])].sort(
            (a, b) => Number(a.position) - Number(b.position)
          )[0]?.product?.id;
          if (first != null) setActiveProductId(first);
        }
        setAllProducts(Array.isArray(products) ? products : []);
      } catch (err) {
        console.error('Error loading bundle page:', err);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [rawSlug]);

  useEffect(() => {
    if (loading || !bundle || bundle.id == null) return undefined;

    const analyticsProduct = {
      id: `bundle-${bundle.id}`,
      name_he: bundle.name_he,
      name_en: bundle.name_en,
      price: Number(bundle.finalPrice ?? bundle.price) || 0
    };

    const tryTrack = () => {
      try {
        trackViewContent(analyticsProduct);
      } catch (_) {
        /* never break page */
      }
      try {
        trackGa4ViewItem(analyticsProduct);
      } catch (_) {
        /* never break page */
      }
    };

    tryTrack();
    return subscribe(tryTrack);
  }, [loading, bundle]);

  // Dock sticky CTA when the end-of-page target enters the viewport (avoids overlapping footer)
  useEffect(() => {
    if (loading || !bundle) return undefined;

    const handleScroll = () => {
      if (!buttonTargetRef.current) return;
      const rect = buttonTargetRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top <= windowHeight - 100) {
        if (isSticky) {
          setIsSticky(false);
          setHasReachedTarget(true);
        }
      } else if (!isSticky && hasReachedTarget) {
        setIsSticky(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [loading, bundle, isSticky, hasReachedTarget]);

  const orderedItems = useMemo(() => {
    return [...(bundle?.items || [])].sort(
      (a, b) => Number(a.position) - Number(b.position)
    );
  }, [bundle]);

  const productCount = orderedItems.length;
  const pricing = getBundlePricingView(bundle);
  const available = bundle?.available !== false;
  const bundleName = bundle
    ? (isHebrew ? bundle.name_he : bundle.name_en)
    : '';

  const desktopCols = Math.min(Math.max(productCount, 1), 3);
  const gridColumns = useMemo(() => {
    if (productCount <= 0) return '1fr';
    if (productCount === 1) return '1fr';
    if (productCount === 2) return '1fr 1fr';
    return 'repeat(3, minmax(0, 1fr))';
  }, [productCount]);

  const scrollToSection = (productId) => {
    setActiveProductId(productId);
    const el = document.getElementById(`bundle-product-${productId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleColorSelect = (productId, color) => {
    setSelection((prev) => ({ ...prev, [productId]: color }));
  };

  const handleAddClick = () => {
    if (!available || !onAddBundle || !bundle) return;
    onAddBundle(bundle, selection);
  };

  const ctaButtonSx = {
    backgroundColor: CTA_ORANGE,
    color: CTA_BEIGE,
    px: { xs: 3, md: 5 },
    py: { xs: 1.5, md: 2 },
    fontSize: { xs: '1rem', md: '1.25rem' },
    fontWeight: 600,
    borderRadius: 3,
    boxShadow: '0 8px 32px rgba(229, 90, 61, 0.4)',
    transition: 'all 0.3s ease',
    minWidth: { xs: '280px', md: '340px' },
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    direction: isHebrew ? 'rtl' : 'ltr',
    '&:hover': {
      backgroundColor: 'rgba(229, 90, 61, 0.9)',
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(229, 90, 61, 0.5)'
    },
    '&:disabled': {
      backgroundColor: '#ccc',
      color: '#999',
      boxShadow: 'none'
    }
  };

  const renderCtaButton = () => (
    <Button
      variant="contained"
      onClick={handleAddClick}
      disabled={!available}
      sx={ctaButtonSx}
    >
      {available ? (
        <>
          <Box component="span">{t.bundleAddToCart}</Box>
          <Box
            component="span"
            aria-hidden
            sx={{
              width: '1px',
              alignSelf: 'stretch',
              mx: 1.5,
              my: 0.5,
              backgroundColor: 'rgba(245, 240, 227, 0.55)'
            }}
          />
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'baseline',
              fontWeight: 700
            }}
          >
            <PriceDisplay
              pricing={pricing}
              format={(n) => `₪ ${n.toFixed(2)}`}
              regularSx={{
                color: 'rgba(245, 240, 227, 0.85)',
                opacity: 1
              }}
              finalSx={{ color: 'inherit' }}
            />
          </Box>
        </>
      ) : (
        t.bundleSoldOut
      )}
    </Button>
  );

  if (loading) {
    return (
      <Container
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          pt: 14
        }}
      >
        <CircularProgress size={60} sx={{ color: 'rgba(199, 61, 34, 1)' }} />
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container sx={{ py: 14, textAlign: 'center', direction: isHebrew ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#1d1d1f' }}>
          {t.bundleLoadError}
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" sx={{ backgroundColor: '#d8472a' }}>
          {t.home}
        </Button>
      </Container>
    );
  }

  if (notFound || !bundle) {
    return (
      <Container sx={{ py: 14, textAlign: 'center', direction: isHebrew ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#1d1d1f' }}>
          {t.bundleNotFound}
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" sx={{ backgroundColor: '#d8472a' }}>
          {t.home}
        </Button>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(245, 240, 227, 0.9)',
        pt: 8,
        pb: { xs: 4, md: 6 },
        minHeight: '100vh'
      }}
    >
      <BundleSeo bundle={bundle} />

      <Container maxWidth="lg" sx={{ py: 4, direction: isHebrew ? 'rtl' : 'ltr' }}>
        <Box
          sx={{
            mb: { xs: 3, md: 5 },
            mt: { xs: 1.5, md: 2.5 },
            textAlign: isHebrew ? 'right' : 'left'
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 600,
              color: '#1d1d1f',
              fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.8rem' },
              mb: 1.5,
              lineHeight: 1.2
            }}
          >
            {bundleName}
          </Typography>

          <Box
            sx={{
              fontSize: { xs: '1.3rem', md: '1.8rem' },
              fontWeight: 600,
              color: '#1d1d1f'
            }}
          >
            <PriceDisplay
              pricing={pricing}
              format={(n) => `₪ ${n.toFixed(2)}`}
            />
          </Box>

          {/* Mobile product selection chips */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexWrap: 'wrap',
              gap: 1,
              mt: 2.5,
              direction: isHebrew ? 'rtl' : 'ltr'
            }}
          >
            {orderedItems.map((item, index) => {
              const product = item.product;
              if (!product) return null;
              const name = isHebrew ? product.name_he : product.name_en;
              const isSelected = String(activeProductId) === String(product.id);
              return (
                <Chip
                  key={product.id}
                  clickable
                  onClick={() => scrollToSection(product.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      scrollToSection(product.id);
                    }
                  }}
                  label={`${t.bundleSectionLabel} ${index + 1} - ${name}`}
                  sx={{
                    backgroundColor: isSelected ? CTA_ORANGE : CTA_BEIGE,
                    border: isSelected
                      ? `1px solid ${CTA_ORANGE}`
                      : '1px solid rgba(229, 90, 61, 0.45)',
                    color: isSelected ? CTA_BEIGE : '#1d1d1f',
                    fontWeight: 500,
                    maxWidth: '100%',
                    height: 'auto',
                    py: 0.75,
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      color: 'inherit'
                    },
                    '&:hover': {
                      backgroundColor: isSelected
                        ? 'rgba(229, 90, 61, 0.92)'
                        : 'rgba(245, 240, 227, 0.85)'
                    }
                  }}
                />
              );
            })}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: productCount === 1 ? '1fr' : '1fr 1fr',
              md: gridColumns
            },
            alignItems: 'start',
            columnGap: 0,
            rowGap: { xs: 0, sm: 3, md: 4 },
            maxWidth: productCount === 1 ? { md: 420 } : '100%',
            mx: productCount === 1 ? 'auto' : 0
          }}
        >
          {orderedItems.map((item, index) => {
            const product = item.product;
            if (!product) return null;
            const isLast = index === orderedItems.length - 1;
            const isLastInDesktopRow =
              (index + 1) % desktopCols === 0 || isLast;

            return (
              <Box
                key={product.id}
                sx={{
                  minWidth: 0,
                  borderInlineEnd: {
                    xs: 'none',
                    md: !isLastInDesktopRow
                      ? '1px solid rgba(229, 90, 61, 0.25)'
                      : 'none'
                  },
                  px: {
                    xs: 0,
                    sm: productCount > 1 ? 1.5 : 0,
                    md: desktopCols > 1 ? 2 : 0
                  },
                  borderBottom: {
                    xs: !isLast
                      ? '1px solid rgba(229, 90, 61, 0.25)'
                      : 'none',
                    md: 'none'
                  },
                  pb: { xs: !isLast ? 3.5 : 0, md: 0 },
                  mb: { xs: !isLast ? 3.5 : 0, md: 0 },
                  pt: { xs: index > 0 ? 0.5 : 0, md: 0 }
                }}
              >
                <BundleProductSection
                  product={product}
                  index={index}
                  selectedColor={selection[product.id] ?? null}
                  onColorSelect={(color) => handleColorSelect(product.id, color)}
                  allProducts={allProducts}
                  sectionId={`bundle-product-${product.id}`}
                />
              </Box>
            );
          })}
        </Box>

        {/* In-flow dock for the CTA — when sticky ends, button renders here (above footer) */}
        <Box
          ref={buttonTargetRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: { xs: 4, md: 5 },
            mb: { xs: 2, md: 3 },
            minHeight: { xs: 56, md: 64 }
          }}
        >
          {!isSticky && renderCtaButton()}
        </Box>
      </Container>

      {isSticky && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: 'auto',
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' }
          }}
        >
          {renderCtaButton()}
        </Box>
      )}
    </Box>
  );
}
