
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, fetchProducts } from '../api/products';
import {
  Container, Typography, Button, Grid, Card, CardMedia, Box, IconButton, CardContent
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExtensionIcon from '@mui/icons-material/Extension';
import StraightenIcon from '@mui/icons-material/Straighten';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
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
  const [isSticky, setIsSticky] = useState(true); // Start as sticky (at bottom)
  const [hasReachedTarget, setHasReachedTarget] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const { language, isHebrew } = useLanguage();
  const t = translations[language];

  const buttonTargetRef = useRef(null); // Reference to the target position

  // Get the appropriate name and description based on language
  const productName = product ? (isHebrew ? product.name_he : product.name_en) : '';
  const productDescription = product ? (isHebrew ? product.description_he : product.description_en) : '';

  // Check if this is THE Mikdash product for special styling (exact match only)
  const isMikdashProduct = product && (
    (product.name_he && product.name_he.trim() === 'המקדש') ||
    (product.name_en && product.name_en.trim().toLowerCase() === 'the temple')
  );

  // Color functionality
  const hasMultipleColors = product?.colors && Array.isArray(product.colors) && product.colors.length > 0;

  // Initialize selected color when product loads
  useEffect(() => {
    if (hasMultipleColors && !selectedColor) {
      setSelectedColor(product.colors[0]);
    }
  }, [product, hasMultipleColors, selectedColor]);

  // Get current images based on selected color
  const getCurrentImages = () => {
    if (!product) return [];

    if (hasMultipleColors && selectedColor) {
      // Use selected color's images
      const colorImages = [selectedColor.mainImage, ...(selectedColor.extraImages || [])];
      return colorImages.filter(img => img); // Remove any null/undefined images
    } else {
      // Use default product images
      const defaultImages = [product.homepageimage, ...(product.extraimages || [])];
      return defaultImages.filter(img => img);
    }
  };

  // Get main image based on selected color
  const getMainImage = () => {
    if (hasMultipleColors && selectedColor) {
      return selectedColor.mainImage || product.homepageimage;
    }
    return product?.homepageimage;
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  useEffect(() => {
    fetchProductById(id).then(setProduct);
    fetchProducts().then(products => {
      // Filter out the current product and get up to 4 related products
      const filtered = products.filter(p => p.id !== id && p.id !== parseInt(id)).slice(0, 4);
      setRelatedProducts(filtered);
    });
  }, [id]);

  // Scroll tracking for sticky button behavior
  useEffect(() => {
    const handleScroll = () => {
      if (buttonTargetRef.current) {
        const rect = buttonTargetRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // If the target position is visible or has been scrolled past
        if (rect.top <= windowHeight - 100) { // 100px buffer from bottom
          if (isSticky) {
            setIsSticky(false);
            setHasReachedTarget(true);
          }
        } else {
          // If scrolling back up and target is out of view
          if (!isSticky && hasReachedTarget) {
            setIsSticky(true);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isSticky, hasReachedTarget]);

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
    const currentImages = getCurrentImages();
    return currentImages.map(img => getImageUrl(img));
  };

  if (!product) return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h5" sx={{ textAlign: 'center', color: '#86868b' }}>
        Loading...
      </Typography>
    </Container>
  );

  return (
    <Box sx={{
      backgroundColor: isMikdashProduct ? '#002144' : 'rgba(245, 240, 227, 0.9)',
      pt: 8,
      minHeight: '100vh',
      transition: 'background-color 0.5s ease'
    }}>
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
            image={getImageUrl(getMainImage())}
            alt={productName}
          />
        </Box>
      </Container>

      {/* Horizontal Scrolling Gallery */}
      {getCurrentImages().length > 1 && (
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
                direction: isHebrew ? 'rtl' : 'ltr',
                '&::-webkit-scrollbar': {
                  display: 'none'
                }
              }}
            >
              {getCurrentImages().slice(1).map((img, idx) => (
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

      {/* Color Selection Section */}
      {hasMultipleColors && (
        <Container maxWidth="lg" sx={{ my: 3, mb: { xs: 5, sm: 8, md: 8, lg: 8 } }}>
          {/* Colors Heading */}
          <Typography
            variant="h4"
            sx={{
              color: 'rgba(229, 90, 61, 1)',
              fontWeight: 600,
              textAlign: isHebrew ? 'right' : 'left',
              fontSize: { xs: '1.5rem', sm: '1.7rem', md: '1.8rem' },
              mb: 2,
              maxWidth: { xs: '80%', sm: '80%', md: '80%', lg: '70%' },
              mx: 'auto',
              direction: isHebrew ? 'rtl' : 'ltr'
            }}
          >
            {isHebrew ? 'צבעים' : 'Colors'}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'flex-start',
              maxWidth: { xs: '80%', sm: '80%', md: '80%', lg: '70%' },
              mx: 'auto',
              direction: isHebrew ? 'rtl' : 'ltr'
            }}
          >
            {product.colors.map((color, index) => (
              <Box
                key={index}
                onClick={() => handleColorSelect(color)}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                {/* Color Circle */}
                <Box
                  sx={{
                    width: { xs: 40, sm: 50, md: 70 },
                    height: { xs: 40, sm: 50, md: 70 },
                    borderRadius: '50%',
                    border: selectedColor === color ? '1px solid rgba(229, 90, 61, 1)' : '2px solid #e0e0e0',
                    boxShadow: selectedColor === color ? '0 4px 20px rgba(229, 90, 61, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    // Handle single color
                    backgroundColor: color.colorValues && color.colorValues.length === 1 ? color.colorValues[0] : 'transparent',
                    // Handle multiple colors with gradient or split
                    background: color.colorValues && color.colorValues.length > 1 ?
                      (color.colorValues.length === 2 ?
                        `linear-gradient(90deg, ${color.colorValues[0]} 50%, ${color.colorValues[1]} 50%)` :
                        `conic-gradient(${color.colorValues.map((c, i) => `${c} ${i * (360 / color.colorValues.length)}deg ${(i + 1) * (360 / color.colorValues.length)}deg`).join(', ')})`
                      ) : undefined
                  }}
                >

                </Box>


              </Box>
            ))}
          </Box>
        </Container>

      )}
      {/* Divider between colors and description */}
      <Box
        sx={{
          width: { xs: '60%', sm: '60%', md: '60%' },
          height: '1px',
          backgroundColor: 'rgba(229, 90, 61, 0.2)',
          mx: 'auto',
          mb: 2
        }}
      />

      {/* Product Info Section */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* A Bit About the Product Heading */}
        <Typography
          variant="h4"
          sx={{
            color: 'rgba(229, 90, 61, 1)',
            fontWeight: 600,
            textAlign: isHebrew ? 'right' : 'left',
            fontSize: { xs: '1.5rem', sm: '1.7rem', md: '1.8rem' },
            mb: 2,
            maxWidth: { xs: '80%', sm: '80%', md: '80%', lg: '70%' },
            mx: 'auto',
            direction: isHebrew ? 'rtl' : 'ltr'
          }}
        >
          {isHebrew ? 'קצת על המוצר' : 'A Bit About the Product'}
        </Typography>

        {/* Description Section */}
        <Typography
          variant="body1"
          sx={{
            color: '#1d1d1f',
            lineHeight: 1.6,
            textAlign: isHebrew ? 'right' : 'left',
            fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.5rem' },
            mb: 4,
            maxWidth: { xs: '80%', sm: '80%', md: '80%', lg: '70%' },
            mx: 'auto',
            direction: isHebrew ? 'rtl' : 'ltr',
            transition: 'font-size 0.3s ease, max-width 0.3s ease'
          }}
        >
          {productDescription}
        </Typography>

        {/* Divider between description and features */}
        <Box
          sx={{
            width: { xs: '60%', sm: '70%', md: '80%' },
            height: '1px',
            backgroundColor: 'rgba(229, 90, 61, 0.2)',
            mx: 'auto',
            mb: 4
          }}
        />

        {/* Product Features Heading */}
        <Typography
          variant="h4"
          sx={{
            color: 'rgba(229, 90, 61, 1)',
            fontWeight: 600,
            textAlign: isHebrew ? 'right' : 'left',
            fontSize: { xs: '1.5rem', sm: '1.7rem', md: '1.8rem' },
            mb: 3,
            maxWidth: { xs: '80%', sm: '80%', md: '80%', lg: '70%' },
            mx: 'auto',
            direction: isHebrew ? 'rtl' : 'ltr'
          }}
        >
          {isHebrew ? 'מאפייני המוצר' : 'Product Features'}
        </Typography>

        {/* Product Features Section */}
        <Box
          sx={{
            maxWidth: { xs: '80%', sm: '80%', md: '80%', lg: '70%' },
            mx: 'auto',
            mb: 4,
            direction: isHebrew ? 'rtl' : 'ltr'
          }}
        >
          <Grid container spacing={3} justifyContent="center">
            {/* Building Time */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(245, 240, 227, 0.8)',
                  border: '1px solid rgba(229, 90, 61, 0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 240, 227, 1)',
                    border: '1px solid rgba(229, 90, 61, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(229, 90, 61, 0.15)'
                  }
                }}
              >
                <AccessTimeIcon
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    color: 'rgba(229, 90, 61, 1)',
                    mb: 1
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    mb: 0,
                    fontSize: { xs: '1rem', md: '1.2rem' }
                  }}
                >
                  {isHebrew ? 'זמן בנייה' : 'Building Time'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(229, 90, 61, 1)',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                  }}
                >
                  {product?.buildingTime ?
                    (isHebrew ? `±${product.buildingTime} שעות` : `±${product.buildingTime} hours`) :
                    (isHebrew ? '±1 שעות' : '±1 hours')
                  }
                </Typography>
              </Card>
            </Grid>
            {/* Number of Pieces */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(245, 240, 227, 0.8)',
                  border: '1px solid rgba(229, 90, 61, 0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 240, 227, 1)',
                    border: '1px solid rgba(229, 90, 61, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(229, 90, 61, 0.15)'
                  }
                }}
              >
                <ExtensionIcon
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    color: 'rgba(229, 90, 61, 1)',
                    mb: 1
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    mb: 0,
                    fontSize: { xs: '1rem', md: '1.2rem' }
                  }}
                >
                  {isHebrew ? 'מספר חלקים' : 'Number of Pieces'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(229, 90, 61, 1)',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                  }}
                >
                  {product?.pieces || (isHebrew ? '500' : '500+')}
                </Typography>
              </Card>
            </Grid>

            {/* Size */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(245, 240, 227, 0.8)',
                  border: '1px solid rgba(229, 90, 61, 0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 240, 227, 1)',
                    border: '1px solid rgba(229, 90, 61, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(229, 90, 61, 0.15)'
                  }
                }}
              >
                <StraightenIcon
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    color: 'rgba(229, 90, 61, 1)',
                    mb: 1
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    mb: 0,
                    fontSize: { xs: '1rem', md: '1.2rem' }
                  }}
                >
                  {isHebrew ? 'גודל' : 'Size'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(229, 90, 61, 1)',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                  }}
                >
                  {product?.size || (isHebrew ? '25×20×15 ס״מ' : '25×20×15 cm')}
                </Typography>
              </Card>
            </Grid>

            {/* Recommended Age */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(245, 240, 227, 0.8)',
                  border: '1px solid rgba(229, 90, 61, 0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 240, 227, 1)',
                    border: '1px solid rgba(229, 90, 61, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(229, 90, 61, 0.15)'
                  }
                }}
              >
                <ChildCareIcon
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    color: 'rgba(229, 90, 61, 1)',
                    mb: 1
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#1d1d1f',
                    mb: 0,
                    fontSize: { xs: '1rem', md: '1.2rem' }
                  }}
                >
                  {isHebrew ? 'גיל מומלץ' : 'Recommended Age'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(229, 90, 61, 1)',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                  }}
                >
                  {product?.recommendedAge || (isHebrew ? '8+' : '8+ ')}
                </Typography>
              </Card>
            </Grid>

            {/* Instruction Booklet */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(245, 240, 227, 0.8)',
                  border: '1px solid rgba(229, 90, 61, 0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 240, 227, 1)',
                    border: '1px solid rgba(229, 90, 61, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(229, 90, 61, 0.15)'
                  }
                }}
              >
                <MenuBookIcon
                  sx={{
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    color: 'rgba(229, 90, 61, 1)',
                    mb: 1
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(229, 90, 61, 1)',
                    fontWeight: 600,
                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                  }}
                >
                  {isHebrew ? 'כולל חוברת הוראות מפורטת' : 'Detailed Booklet Instructions'}
                </Typography>
              </Card>
            </Grid>

          </Grid>
        </Box>

        {/* Divider between features and product name/price */}
        <Box
          sx={{
            width: { xs: '60%', sm: '70%', md: '80%' },
            height: '1px',
            backgroundColor: 'rgba(229, 90, 61, 0.2)',
            mx: 'auto',
            my: { xs: 5, sm: 6, md: 6, lg: 6 }
          }}
        />

        {/* Product Name and Price Section - Matching Homepage Design */}
        <Box
          sx={{
            border: '2px solid rgba(229, 90, 61, 1)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            borderRadius: 3,
            width: '80%',
            maxWidth: '600px', // Add max width for better control
            margin: '0 auto', // This centers the box horizontally
            padding: { xs: '20px 26px', sm: '24px 30px', md: '28px 34px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-2px)',

            }
          }}
        >

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
                color: 'rgba(229, 90, 61, 1)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: { xs: '1.4rem', sm: '2rem', md: '2.4rem', lg: '2.8rem' },
                transition: 'font-size 0.3s ease, max-width 0.3s ease'
              }}
            >
              {productName + ' | ' + "₪" + (product.price || 0).toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Add to Cart Button Target Position */}
        <Box ref={buttonTargetRef} sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          {!isSticky && (
            <Button
              variant="contained"
              onClick={() => onAddToCart && onAddToCart(product, selectedColor)}
              disabled={!product || product.quantity <= 0}
              sx={{
                backgroundColor: 'rgba(229, 90, 61, 1)', // Orange background
                color: 'rgba(245, 240, 227, 1)', // Light text color
                width: '80%',
                maxWidth: '600px', // Same max width as the box above
                padding: { xs: '12px 24px', sm: '16px 32px', md: '20px 40px' },
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(229, 90, 61, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(229, 90, 61, 0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(229, 90, 61, 0.4)',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                  color: '#999',
                  boxShadow: 'none'
                }
              }}
            >
              {product && product.quantity > 0 ?
                (isHebrew ? 'הוסף לסל' : 'Add to Cart') :
                (isHebrew ? 'בקרוב' : 'Coming Soon')
              }
            </Button>
          )}
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

      {/* Sticky Add to Cart Button */}
      {isSticky && product && (
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
          }}
        >
          <Button
            variant="contained"
            onClick={() => onAddToCart && onAddToCart(product, selectedColor)}
            disabled={!product || product.quantity <= 0}
            sx={{
              backgroundColor: 'rgba(229, 90, 61, 1)',
              color: 'rgba(245, 240, 227, 1)',
              px: { xs: 4, md: 6 },
              py: { xs: 1.5, md: 2 },
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              fontWeight: 600,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(229, 90, 61, 0.4)',
              transition: 'all 0.3s ease',
              minWidth: { xs: '280px', md: '320px' },
              '&:hover': {
                backgroundColor: 'rgba(229, 90, 61, 0.9)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(229, 90, 61, 0.5)',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
                color: '#999',
                boxShadow: 'none'
              }
            }}
          >
            {product && product.quantity > 0 ?
              (isHebrew ? 'הוסף לסל' : 'Add to Cart') :
              (isHebrew ? 'בקרוב' : 'Coming Soon')
            }
          </Button>
        </Box>
      )}
    </Box>
  );
}