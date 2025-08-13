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

export default function ProductDetail({ onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [galleryScroll, setGalleryScroll] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    const images = [product.homepageImage]; // Use homepage image as main image
    if (product.extraImages && product.extraImages.length > 0) {
      images.push(...product.extraImages);
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
            height: '75vh',
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
            image={product.homepageImage}
            alt={product.name}
          />
        </Box>
      </Container>

      {/* Horizontal Scrolling Gallery */}
      {product.extraImages && product.extraImages.length > 0 && (
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
            גלריה
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
              {product.extraImages.map((img, idx) => (
                <Card
                  key={idx}
                  onClick={() => openLightbox(idx + 1)} // +1 because main image is at index 0
                  sx={{
                    minWidth: 300,
                    height: 300,
                    flexShrink: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    image={img}
                    alt={`${product.name} gallery ${idx + 1}`}
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
          {product.description}
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
              fontSize: { xs: '1.4rem', sm: '1.7rem', md: '2.2rem' },
              fontWeight: 500,
              borderRadius: 1.5,
              flexShrink: 0,
              '&:hover': {
                backgroundColor: 'rgba(245, 240, 227, 0.85)',
                transition: 'background-color 0.3s ease'
              }
            }}
          >
            הוסף לעגלה
          </Button>

          {/* Center: Price - Positioned in the center of remaining space */}
          <Typography
            className="product-price"
            variant="h4"
            sx={{
              color: 'rgba(245, 240, 227, 0.95)',
              fontWeight: 600,
              textAlign: 'center',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: { xs: '1.6rem', sm: '2rem', md: '2.3rem', lg: '2.8rem' },
              transition: 'font-size 0.3s ease'
            }}
          >
            ₪{(product.price || 0).toFixed(2)}
          </Typography>

          {/* Right: Product Name */}
          <Typography
            className="product-name"
            variant="h4"
            sx={{
              fontWeight: 500,
              textAlign: 'right',
              marginLeft: 'auto',
              lineHeight: 1,
              maxWidth: { xs: '30%', sm: '45%', md: '50%', lg: '55%' },
              color: 'rgba(245, 240, 227, 0.95)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: { xs: '1.6rem', sm: '2rem', md: '2.4rem', lg: '2.8rem' },
              transition: 'font-size 0.3s ease, max-width 0.3s ease'
            }}
          >
            {product.name}
          </Typography>
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
              מוצרים שיכולים לעניין אותך
            </Typography>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                padding: 1,
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
                    minWidth: 280,
                    flexShrink: 0,
                    borderRadius: 2,
                    backgroundColor: 'rgba(245, 240, 227, 1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    border: '2px solid rgba(229, 90, 61, 1)',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      height: 200,
                      objectFit: 'cover'
                    }}
                    image={relatedProduct.homepageImage}
                    alt={relatedProduct.name}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {relatedProduct.name}
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