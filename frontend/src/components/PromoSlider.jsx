import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { getImageUrl } from '../utils/imageUtils';
import { getHomeSectionElementId } from '../config/homeSections';

/** Layout + timing — single source of truth (also used for admin size hints). */
export const PROMO_SLIDER_CONFIG = {
  height: {
    desktop: 'clamp(320px, 50vh, 560px)',
    mobile: 'clamp(260px, 50vh, 460px)'
  },
  recommendedSize: {
    desktop: { w: 1920, h: 650 },
    mobile: { w: 900, h: 1000 }
  },
  borderRadius: '20px',
  autoplayMs: 3000,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
};

const DRAG_THRESHOLD = 40;
const CLICK_SUPPRESS_PX = 8;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(!!mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);
  return reduced;
}

function SlideMedia({ slide, alt, isMobile }) {
  const src =
    isMobile && slide.imageMobile
      ? getImageUrl(slide.imageMobile)
      : getImageUrl(slide.image);
  // Always eager: lazy images inside overflow+transform carousels often never load.
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      draggable={false}
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        display: 'block',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    />
  );
}

function SlideLinkShell({ slide, children, onNavigate, suppressRef }) {
  const type = slide.linkType || 'none';
  const target = slide.linkTarget || '';

  const guardClick = (e) => {
    if (suppressRef?.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  if (type === 'none' || !target) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'default',
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        {children}
      </Box>
    );
  }

  if (type === 'page') {
    return (
      <Box
        component={RouterLink}
        to={target}
        onClick={(e) => {
          guardClick(e);
          if (!suppressRef?.current) onNavigate?.(slide);
        }}
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        {children}
      </Box>
    );
  }

  if (type === 'section') {
    const elementId = getHomeSectionElementId(target);
    const href = elementId ? `#${elementId}` : '#';
    return (
      <Box
        component="a"
        href={href}
        onClick={(e) => {
          e.preventDefault();
          if (suppressRef?.current) return;
          if (!elementId) return;
          const el = document.getElementById(elementId);
          if (!el) return;
          onNavigate?.(slide);
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: elementId ? 'pointer' : 'default',
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        {children}
      </Box>
    );
  }

  if (type === 'external') {
    const newTab = slide.openInNewTab !== false;
    return (
      <Box
        component="a"
        href={target}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        onClick={(e) => {
          guardClick(e);
          if (!suppressRef?.current) onNavigate?.(slide);
        }}
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'pointer',
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        {children}
      </Box>
    );
  }

  return children;
}

/**
 * Auto-rotating promo carousel. Renders nothing when slides is empty.
 */
export default function PromoSlider({ slides = [] }) {
  const { language, isHebrew } = useLanguage();
  const t = translations[language] || translations.HE;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const reducedMotion = usePrefersReducedMotion();

  const list = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const count = list.length;
  const multi = count > 1;

  // RTL: mirrored visual order
  const displaySlides = isHebrew ? [...list].reverse() : list;

  const [index, setIndex] = useState(0);
  const [pausedHover, setPausedHover] = useState(false);
  const [pausedFocus, setPausedFocus] = useState(false);
  const [pausedTouch, setPausedTouch] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const suppressClickRef = useRef(false);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const dragPx = useRef(0);
  const regionRef = useRef(null);

  // Reset index when slide set / RTL flips
  useEffect(() => {
    setIndex(0);
  }, [count, isHebrew]);

  const goTo = useCallback(
    (next) => {
      if (!multi) return;
      const n = ((next % count) + count) % count;
      setIndex(n);
    },
    [count, multi]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  const autoplayPaused =
    !multi ||
    reducedMotion ||
    pausedHover ||
    pausedFocus ||
    pausedTouch ||
    tabHidden;

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (autoplayPaused) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, PROMO_SLIDER_CONFIG.autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayPaused, count]);

  if (count === 0) return null;

  const height = isMobile
    ? PROMO_SLIDER_CONFIG.height.mobile
    : PROMO_SLIDER_CONFIG.height.desktop;

  const onKeyDown = (e) => {
    if (!multi) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isHebrew) goNext();
      else goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (isHebrew) goPrev();
      else goNext();
    }
  };

  const onTouchStart = (e) => {
    if (!multi) return;
    const x = e.touches?.[0]?.clientX;
    if (x == null) return;
    touchStartX.current = x;
    touchDeltaX.current = 0;
    dragPx.current = 0;
    suppressClickRef.current = false;
    setPausedTouch(true);
  };

  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const x = e.touches?.[0]?.clientX;
    if (x == null) return;
    const delta = x - touchStartX.current;
    touchDeltaX.current = delta;
    dragPx.current = Math.abs(delta);
    if (dragPx.current > CLICK_SUPPRESS_PX) {
      suppressClickRef.current = true;
    }
  };

  const onTouchEnd = () => {
    const delta = touchDeltaX.current;
    touchStartX.current = null;
    setPausedTouch(false);
    if (!multi) return;
    if (Math.abs(delta) < DRAG_THRESHOLD) return;
    const swipedLeft = delta < 0;
    if (isHebrew) {
      if (swipedLeft) goPrev();
      else goNext();
    } else if (swipedLeft) {
      goNext();
    } else {
      goPrev();
    }
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 50);
  };

  const regionLabel = t.promoSliderRegion || (isHebrew ? 'מצגת מבצעים' : 'Promotions carousel');

  return (
    <Box
      sx={{
        width: '100%',
        mx: 'auto',
        px: 0,
        // Match hero Card vertical rhythm (hero uses margin: 15px 0)
        my: { xs: 2, md: 2.5 }
      }}
    >
      <Box
        ref={regionRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={regionLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPausedHover(true)}
        onMouseLeave={() => setPausedHover(false)}
        onFocusCapture={() => setPausedFocus(true)}
        onBlurCapture={(e) => {
          if (!regionRef.current?.contains(e.relatedTarget)) {
            setPausedFocus(false);
          }
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        sx={{
          position: 'relative',
          width: '100%',
          height,
          borderRadius: PROMO_SLIDER_CONFIG.borderRadius,
          overflow: 'hidden',
          boxShadow: PROMO_SLIDER_CONFIG.boxShadow,
          border: 'none',
          outline: 'none',
          '&:focus-visible': {
            boxShadow: `${PROMO_SLIDER_CONFIG.boxShadow}, 0 0 0 3px rgba(229, 90, 61, 0.45)`
          },
          direction: isHebrew ? 'rtl' : 'ltr'
        }}
      >
        {/*
          Track is width:100% of the viewport box; each slide is flex 0 0 100%.
          translateX(-index * 100%) is then relative to the viewport width, so
          every slide lines up (the old count*100% / (100/count)% math broke).
        */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            direction: 'ltr',
            width: '100%',
            height: '100%',
            transform: `translate3d(-${index * 100}%, 0, 0)`,
            transition: reducedMotion ? 'none' : 'transform 0.45s ease',
            willChange: 'transform'
          }}
        >
          {displaySlides.map((slide, i) => {
            const alt =
              (isHebrew ? slide.alt_he : slide.alt_en) ||
              (isHebrew ? slide.alt_en : slide.alt_he) ||
              '';
            return (
              <Box
                key={slide.id ?? i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} ${isHebrew ? 'מתוך' : 'of'} ${count}`}
                sx={{
                  flex: '0 0 100%',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <SlideLinkShell slide={slide} suppressRef={suppressClickRef}>
                  <SlideMedia slide={slide} alt={alt} isMobile={isMobile} />
                </SlideLinkShell>
              </Box>
            );
          })}
        </Box>

        {multi && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              zIndex: 2,
              pointerEvents: 'none'
            }}
          >
            {displaySlides.map((slide, i) => (
              <Box
                key={`dot-${slide.id ?? i}`}
                component="button"
                type="button"
                aria-label={`${i + 1} / ${count}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
                sx={{
                  pointerEvents: 'auto',
                  width: i === index ? 18 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: 'none',
                  p: 0,
                  cursor: 'pointer',
                  backgroundColor:
                    i === index ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                  transition: reducedMotion ? 'none' : 'width 0.2s ease, background-color 0.2s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
