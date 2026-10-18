import React, { useState, useEffect, useRef } from 'react';
import { fetchProducts } from '../api/products';
import { fetchPromoSlides } from '../api/promoSlides';
import { Box, Typography, Grid } from '@mui/material';
import ProductCard from '../components/ProductCard';
import BundleCard from '../components/BundleCard';
import VideoCard from '../components/VideoCard';
import CommentsSection from '../components/CommentsSection';
import FaqSection from '../components/FaqSection';
import HomepageTextSection from '../components/HomepageTextSection';
import NewsletterSection from '../newsletter/NewsletterSection';
import BannerSlot from '../banners/BannerSlot';
import HeroSection from '../components/HeroSection';
import PromoSlider from '../components/PromoSlider';
import { useLanguage } from '../contexts/LanguageContext';
import { useBundles } from '../contexts/BundlesContext';
import { translations } from '../translations/translations';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HOME_SECTION_SCROLL_MARGIN = { xs: '100px', md: '120px' };

export default function Home({ onAddToCart, onAddBundle }) {
  const [products, setProducts] = useState([]);
  const [promoSlides, setPromoSlides] = useState([]);
  const { language, isHebrew } = useLanguage();
  const { bundles } = useBundles();
  const t = translations[language];

  // Refs for animations
  const firstTitleRef = useRef(null);
  const firstDescRef = useRef(null);
  const secondTitleRef = useRef(null);
  const secondDescRef = useRef(null);

  useEffect(() => {
    fetchProducts()
      .then(data => {
        // Ensure products is always an array
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(error => {
        console.error('Error loading products:', error);
        setProducts([]); // Set empty array on error
      });

    fetchPromoSlides()
      .then((slides) => setPromoSlides(Array.isArray(slides) ? slides : []))
      .catch(() => setPromoSlides([]));
  }, []);

  // Animation effect - slide from left to right
  useEffect(() => {
    if (!products.length) return;

    const ctx = gsap.context(() => {
      // First section animations - slide from left to right
      if (firstTitleRef.current) {
        gsap.fromTo(
          firstTitleRef.current,
          { x: -100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: firstTitleRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      if (firstDescRef.current) {
        gsap.fromTo(
          firstDescRef.current,
          { x: -100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            delay: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: firstDescRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // Second section animations - slide from left to right
      if (secondTitleRef.current) {
        gsap.fromTo(
          secondTitleRef.current,
          { x: -100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: secondTitleRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      if (secondDescRef.current) {
        gsap.fromTo(
          secondDescRef.current,
          { x: -100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            delay: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: secondDescRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, [products]);

  return (
    <Box sx={{
      background: 'rgba(245, 240, 227, 0.9)', // Changed to match global background
      pt: { xs: 9.5, sm: 10, md: 11 }, // Responsive top padding to maintain consistent distance from navbar
      pb: 0,
      minHeight: '100vh'
    }}>
      <BannerSlot placement="site_entry" />
      {products.length === 0 ? (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          pt: 14
        }}>
          <Typography variant="h5" sx={{ color: '#86868b' }}>
            {t.loadingProducts}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Hero Section - First element */}
          <Box sx={{
            maxWidth: 'calc(100% - 32px)', // Match navbar width exactly
            margin: '0 auto',
            px: 0 // Remove horizontal padding to match navbar width exactly
          }}>
            <HeroSection products={products} />
          </Box>

          {/* Promo slides — same width as hero rectangle */}
          <Box sx={{
            maxWidth: 'calc(100% - 32px)',
            margin: '0 auto',
            px: 0
          }}>
            <PromoSlider slides={promoSlides} />
          </Box>

          {/* Text Section - Title and description */}
          <Box sx={{
            maxWidth: '100%', // Changed to max width
            margin: '0 auto',
            px: { xs: 2, sm: 3, md: 4 },
            pt: 6, // Responsive horizontal padding
            pb: 1, // Add vertical padding
            textAlign: 'center',
            direction: isHebrew ? 'rtl' : 'ltr'
          }}>
            <Typography
              ref={firstTitleRef}
              variant="h3"
              sx={{
                fontWeight: 600,
                color: 'rgb(5, 38, 51)',
                fontSize: { xs: '1.8rem', sm: '3rem', md: '3.5rem' }, // Increased font sizes
                mb: { xs: 2.5, sm: 1 },
                lineHeight: { xs: 0.7, sm: 0.9 }
              }}
            >
              {(() => {
                const titleParts = t.mainTitle.split('|');
                if (titleParts.length === 1) {
                  return t.mainTitle;
                }

                return (
                  <>
                    {titleParts[0]}
                    <Box
                      component="span"
                      sx={{
                        display: { xs: 'block', sm: 'inline' },
                        mt: { xs: 1.25, sm: 0 }
                      }}
                    >
                      {' '}{titleParts.slice(1).join('|')}
                    </Box>
                  </>
                );
              })()}
            </Typography>

            <Typography
              ref={firstDescRef}
              variant="h5"
              sx={{
                color: '#86868b',
                fontWeight: 400,
                mb: { xs: 4, sm: 2 },
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                lineHeight: 1.2
              }}
            >
              {t.mainDescription}
            </Typography>
          </Box>


          {/* Product Cards - 2 columns on large screens */}
          <Box
            id="home-products"
            sx={{
              maxWidth: 'calc(100% - 32px)', // Match navbar width exactly
              margin: '0 auto',
              px: 0, // Remove horizontal padding to match navbar width exactly
              scrollMarginTop: HOME_SECTION_SCROLL_MARGIN
            }}
          >
            <Grid container spacing={3} justifyContent="center">
              {products.slice(0, 2).map(product => (
                <Grid item xs={12} md={6} key={product.id}>
                  <ProductCard product={product} allProducts={products} onAddToCart={onAddToCart} />
                </Grid>
              ))}
            </Grid>
          </Box>


          {/* Second Text Section - Title and description */}
          <Box sx={{
            maxWidth: '100%', // Changed to max width
            margin: '0 auto',
            px: { xs: 2, sm: 3, md: 4 },
            pt: 10, // Responsive horizontal padding
            pb: 1, // Add vertical padding
            textAlign: 'center',
            direction: isHebrew ? 'rtl' : 'ltr'
          }}>
            <Typography
              ref={secondTitleRef}
              variant="h2"
              sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                fontSize: { xs: '1.8rem', sm: '3rem', md: '3.5rem' }, // Increased font sizes
                mb: 1,
                lineHeight: 0.9
              }}
            >
              {t.secondTitle}
            </Typography>

            <Typography
              ref={secondDescRef}
              variant="h5"
              sx={{
                color: '#86868b',
                fontWeight: 400,
                mb: 0,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                lineHeight: 1.2
              }}
            >
              {t.secondDescription}
            </Typography>
          </Box>

          {/* Video - Full width */}
          <Box
            id="home-video"
            sx={{
              maxWidth: 'calc(100% - 32px)', // Match navbar width exactly
              margin: '0 auto',
              px: 0, // Remove horizontal padding to match navbar width exactly
              scrollMarginTop: HOME_SECTION_SCROLL_MARGIN
            }}
          >
            <VideoCard />
          </Box>

          {/* Remaining Product Cards + Bundles - 2 columns on large screens */}
          <Box
            id="home-catalog"
            sx={{
              maxWidth: 'calc(100% - 32px)', // Match navbar width exactly
              margin: '0 auto',
              px: 0, // Remove horizontal padding to match navbar width exactly
              mb: { xs: 8, md: 12 },
              scrollMarginTop: HOME_SECTION_SCROLL_MARGIN
            }}
          >
            <Grid container spacing={3} justifyContent="center">
              {products.slice(2).map(product => (
                <Grid item xs={12} md={6} key={product.id}>
                  <ProductCard product={product} allProducts={products} onAddToCart={onAddToCart} />
                </Grid>
              ))}
              {bundles.map((bundle) => (
                <Grid item xs={12} md={6} key={`bundle-${bundle.id}`}>
                  <BundleCard bundle={bundle} onAddBundle={onAddBundle} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Optional admin-managed text (hidden when empty) */}
          <Box id="home-homepage-text" sx={{ scrollMarginTop: HOME_SECTION_SCROLL_MARGIN }}>
            <HomepageTextSection />
          </Box>

          {/* Testimonials Gallery - Full width */}
          <Box id="home-testimonials" sx={{ scrollMarginTop: HOME_SECTION_SCROLL_MARGIN }}>
            <CommentsSection />
          </Box>

          {/* FAQ */}
          <Box id="home-faq" sx={{ scrollMarginTop: HOME_SECTION_SCROLL_MARGIN }}>
            <FaqSection />
          </Box>

          <BannerSlot placement="homepage_section" />

          {/* Newsletter signup */}
          <Box id="home-newsletter" sx={{ scrollMarginTop: HOME_SECTION_SCROLL_MARGIN }}>
            <NewsletterSection />
          </Box>
        </>
      )}
    </Box>
  );
}