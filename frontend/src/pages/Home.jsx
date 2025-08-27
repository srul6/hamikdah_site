import React, { useState, useEffect } from 'react';
import { fetchProducts } from '../api/products';
import { Box, Typography, Grid } from '@mui/material';
import ProductCard from '../components/ProductCard';
import VideoCard from '../components/VideoCard';
import CommentsSection from '../components/CommentsSection';
import HeroSection from '../components/HeroSection';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function Home({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const { language, isHebrew } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  return (
    <Box sx={{
      background: 'rgba(245, 240, 227, 0.9)', // Changed to match global background
      pt: { xs: 9.5, sm: 10, md: 11 }, // Responsive top padding to maintain consistent distance from navbar
      pb: 4,
      minHeight: '100vh'
    }}>
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
            <HeroSection />
          </Box>

          {/* Text Section - Title and description */}
          <Box sx={{
            maxWidth: '80%', // Changed to max width
            margin: '0 auto',
            px: { xs: 2, sm: 3, md: 4 },
            pt: 6, // Responsive horizontal padding
            pb: 1, // Add vertical padding
            textAlign: 'center',
            direction: isHebrew ? 'rtl' : 'ltr'
          }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                mb: 2,
                fontSize: { xs: '2.1rem', sm: '3rem', md: '3.5rem' }, // Increased font sizes
                lineHeight: 1.2
              }}
            >
              {t.mainTitle}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: '#86868b',
                fontWeight: 400,
                mb: 2,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                lineHeight: 1.2
              }}
            >
              {t.mainDescription}
            </Typography>
          </Box>


          {/* Product Cards - 2 columns on large screens */}
          <Box sx={{
            maxWidth: 'calc(100% - 32px)', // Match navbar width exactly
            margin: '0 auto',
            px: 0 // Remove horizontal padding to match navbar width exactly
          }}>
            <Grid container spacing={3} justifyContent="center">
              {products.slice(0, 2).map(product => (
                <Grid item xs={12} md={6} key={product.id}>
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </Grid>
              ))}
            </Grid>
          </Box>


          {/* Second Text Section - Title and description */}
          <Box sx={{
            maxWidth: '80%', // Changed to max width
            margin: '0 auto',
            px: { xs: 2, sm: 3, md: 4 },
            pt: 10, // Responsive horizontal padding
            pb: 1, // Add vertical padding
            textAlign: 'center',
            direction: isHebrew ? 'rtl' : 'ltr'
          }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                mb: 2,
                fontSize: { xs: '2.1rem', sm: '3rem', md: '3.5rem' }, // Increased font sizes
              }}
            >
              {t.mainTitle}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: '#86868b',
                fontWeight: 400,
                mb: 0,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                lineHeight: 1.2
              }}
            >
              {t.mainDescription}
            </Typography>
          </Box>

          {/* Video - Full width */}
          <Box sx={{
            maxWidth: 'calc(100% - 32px)', // Match navbar width exactly
            margin: '0 auto',
            px: 0 // Remove horizontal padding to match navbar width exactly
          }}>
            <VideoCard />
          </Box>

          {/* Remaining Product Cards - 2 columns on large screens */}
          <Box sx={{
            maxWidth: 'calc(100% - 32px)', // Match navbar width exactly
            margin: '0 auto',
            px: 0 // Remove horizontal padding to match navbar width exactly
          }}>
            <Grid container spacing={3} justifyContent="center">
              {products.slice(2).map(product => (
                <Grid item xs={12} md={6} key={product.id}>
                  <ProductCard product={product} onAddToCart={onAddToCart} />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Testimonials Gallery - Full width */}
          <CommentsSection />
        </>
      )}
    </Box>
  );
}