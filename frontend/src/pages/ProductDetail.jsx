import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, fetchProducts } from '../api/products';
import {
  Container, Typography, Button, Grid, Card, CardMedia, Box, IconButton, CardContent
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import Lightbox from '../components/Lightbox';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { getImageUrl } from '../utils/imageUtils';

export default function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [galleryScroll, setGalleryScroll] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { language, isHebrew } = useLanguage();
  const t = translations[language];

  // Get the appropriate name and description based on language
  const productName = product ? (isHebrew ? product.name_he : product.name_en) : '';
  const productDescription = product ? (isHebrew ? product.description_he : product.description_en) : '';

  useEffect(() => {
    fetchProductById(id).then(setProduct);
    fetchProducts().then(products => {
      // Filter out the current product and get up to 4 related products
      const filtered = products.filter(p => p.id !== id && p.id !== parseInt(id)).slice(0, 4);
      setRelatedProducts(filtered);
    });
  }, [id]);

  const scrollGallery = (direction) => {
    const container = document.getElementById('gallery-container');
    if (container) {
      const scrollAmount = 320; // 300px card + 16px gap
      const newScroll = direction === 'left'
        ? Math.max(0, galleryScroll - scrollAmount)
        : galleryScroll + scrollAmount;
      container.scrollTo({ left: newScroll, behavior: 'smooth' });
      setGalleryScroll(newScroll);
    }
  };

  const handleRelatedProductClick = (productId) => {
    // Scroll to top and navigate to new product
    window.scrollTo(0, 0);
    navigate(`/product/${productId}`);
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const navigateLightbox = (direction) => {
    if (direction === 'prev' && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    } else if (direction === 'next' && lightboxIndex < getAllImages().length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const getAllImages = () => {
    if (!product) return [];
    const images = [getImageUrl(product.homepageimage)]; // Use homepage image as main image
    if (product.extraimages && product.extraimages.length > 0) {
      images.push(...product.extraimages.map(img => getImageUrl(img)));
    }
    return images;
  };

  if (!product) return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h5" sx={{ textAlign: 'center', color: '#86868b' }}>
        Loading...
      </Typography>
    </Container>
  );

  return (
    <Box sx={{ backgroundColor: 'rgba(245, 240, 227, 0.9)', pt: 8 }}>
      {/* Hero Image Section */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{
            width: '100%',
            height: { xs: '45vh', sm: '60vh', md: '85vh' }, // Reduced height for all screen sizes
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 2,
            cursor: 'pointer'
          }}
          onClick={() => openLightbox(0)}
        >
          <CardMedia
            component="img"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 2
            }}
            image={getImageUrl(product.homepageimage)}
            alt={productName}
          />
        </Box>
      </Container>

      {/* Horizontal Scrolling Gallery */}
      {product.extraimages && product.extraimages.length > 0 && (
        <Container maxWidth="lg" sx={{ pb: 8 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#1d1d1f',
              mb: 2,
              textAlign: 'center'
            }}
          >
            {t.gallery}
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <Box
              id="gallery-container"
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                padding: 0.5,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                }
              }}
            >
              {product.extraimages.map((img, idx) => (
                <Card
                  key={idx}
                  onClick={() => openLightbox(idx + 1)} // +1 because main image is at index 0
                  sx={{
                    minWidth: { xs: 230, sm: 300, md: 400 },
                    height: { xs: 230, sm: 300, md: 400 }, // Reduced gallery height
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
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
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
                    image={getImageUrl(img)}
                    alt={`${productName} gallery ${idx + 1}`}
                    loading="lazy"
                  />
                </Card>
              ))}
            </Box>
          </Box>
        </Container>
      )}

      {/* Product Info Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Description Section */}
        <Typography
          variant="body1"
          sx={{
            color: '#1d1d1f',
            lineHeight: 1.6,
            textAlign: 'center',
            fontSize: { xs: '1.5rem', sm: '1.5rem', md: '2.3rem' },
            mb: 3,
            maxWidth: { xs: '100%', sm: '90%', md: '80%', lg: '70%' },
            mx: 'auto',
            transition: 'font-size 0.3s ease, max-width 0.3s ease'
          }}
        >
          {productDescription}
        </Typography>

        {/* Product Name and Price Section - Matching Homepage Design */}
        <Box
          sx={{
            backgroundColor: 'rgba(229, 90, 61, 1)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            borderRadius: 1.5,
            width: '100%',
            padding: { xs: '20px 26px', sm: '24px 30px', md: '28px 34px' },
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-2px)',
              '& .product-name': {
                color: 'rgba(245, 240, 227, 0.95)',
                transition: 'color 0.3s ease'
              },
              '& .product-price': {
                color: 'rgba(245, 240, 227, 0.95)',
                transition: 'color 0.3s ease'
              }
            }
          }}
        >
          {/* Left: Add to Cart Button */}
          <Button
            variant="contained"
            onClick={() => onAddToCart(product)}
            sx={{
              backgroundColor: 'rgba(245, 240, 227, 1)',
              color: 'rgba(229, 90, 61, 1) ',
              px: { xs: 2, sm: 2.5, md: 3 },
              py: { xs: 1, sm: 1.25, md: 1.5 },
              fontSize: { xs: '1.2rem', sm: '1.7rem', md: '2.2rem' },
              fontWeight: 500,
              borderRadius: 1.5,
              flexShrink: 0,
              '&:hover': {
                backgroundColor: 'rgba(245, 240, 227, 0.85)',
                transition: 'background-color 0.3s ease'
              }
            }}
          >
            {t.addToCart}
          </Button>

          {/* Center: Name and Price Container */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: { xs: 0, sm: 1 }
            }}
          >
            {/* Product Name */}
            <Typography
              className="product-name"
              variant="h4"
              sx={{
                fontWeight: 500,
                textAlign: 'center',
                lineHeight: 1.1,
                color: 'rgba(245, 240, 227, 0.95)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: '130px', sm: '300px', md: '400px', lg: '500px' },
                fontSize: { xs: '1.4rem', sm: '2rem', md: '2.4rem', lg: '2.8rem' },
                transition: 'font-size 0.3s ease, max-width 0.3s ease'
              }}
            >
              {productName}
            </Typography>

            {/* Price */}
            <Typography
              className="product-price"
              variant="h4"
              sx={{
                color: 'rgba(245, 240, 227, 0.95)',
                fontWeight: 600,
                textAlign: 'center',
                fontSize: { xs: '1.4rem', sm: '2rem', md: '2.3rem', lg: '2.8rem' },
                transition: 'font-size 0.3s ease'
              }}
            >
              ₪{(product.price || 0).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <Box sx={{ backgroundColor: 'rgba(245, 240, 227, 1)', py: 8 }}>
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                mb: 3,
                textAlign: 'center',
                fontSize: { xs: '2.5rem', md: '2.3rem' }
              }}
            >
              {t.productsThatMayInterestYou}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1, sm: 2 },
                overflowX: 'auto',
                padding: { xs: 0.5, sm: 1 },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                }
              }}
            >
              {relatedProducts.map(relatedProduct => (
                <Card
                  key={relatedProduct.id}
                  onClick={() => handleRelatedProductClick(relatedProduct.id)}
                  sx={{
                    minWidth: { xs: 240, sm: 280 },
                    maxWidth: { xs: 240, sm: 280 },
                    flexShrink: 0,
                    borderRadius: 2,
                    backgroundColor: 'rgba(245, 240, 227, 1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    border: '2px solid rgba(229, 90, 61, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      height: 200,
                      width: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      flexShrink: 0,
                      borderRadius: '8px 8px 0 0'
                    }}
                    image={getImageUrl(relatedProduct.homepageimage)}
                    alt={isHebrew ? relatedProduct.name_he : relatedProduct.name_en}
                    loading="lazy"
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {isHebrew ? relatedProduct.name_he : relatedProduct.name_en}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₪{(relatedProduct.price || 0).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={getAllImages()}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </Box>
  );
}