import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Button, Grid, Card, CardMedia,
    CircularProgress, Alert, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExtensionIcon from '@mui/icons-material/Extension';
import StraightenIcon from '@mui/icons-material/Straighten';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { getImageUrl } from '../utils/imageUtils';
import ChildrenPlayingSection from '../components/ChildrenPlayingSection';
import SnakeScrollGallery from '../components/SnakeScrollGallery';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GallerySection = React.forwardRef(({ product, selectedColor, isHebrew }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    // YouTube video URLs converted to embed format
    const videos = [
        'https://www.youtube.com/embed/qHSVrX7wbCE?start=1',
        'https://www.youtube.com/embed/hO0byC8b8BM?start=1',
        'https://www.youtube.com/embed/-7lrSjwONg4'
    ];

    useEffect(() => {
        setIsVisible(true);
    }, []);

    if (videos.length === 0) return null;

    return (
        <Box ref={ref} sx={{ position: 'relative', width: '100%' }}>
            <Box sx={{
                display: 'flex',
                justifyContent: isHebrew ? 'flex-end' : 'flex-start',
                width: '100%',
                mb: 3,
                px: { xs: 4, md: '9%' },
            }}>
                <Typography
                    variant="h2"
                    component="h2"
                    sx={{
                        color: '#f5f0e3',
                        fontWeight: 400,
                        fontSize: { xs: '2rem', sm: '2.2rem', md: '2.4rem', lg: '2.6rem' },
                        lineHeight: 1.6,
                        maxWidth: '80%',
                        textAlign: isHebrew ? 'right' : 'left',
                        direction: isHebrew ? 'rtl' : 'ltr',
                    }}
                >
                    {isHebrew ? 'סרטוני עזר לבנייה' : 'Building Tutorial Videos'}
                </Typography>
            </Box>

            <SnakeScrollGallery
                isHebrew={isHebrew}
                aria-label={isHebrew ? 'סרטוני עזר לבנייה' : 'Building Tutorial Videos'}
                trackColor="rgba(255, 255, 255, 0.3)"
                fillColor="#f5f0e3"
                rowSx={{
                    gap: 0,
                    py: 0,
                    '&::before': {
                        content: '""',
                        flexShrink: 0,
                        width: { xs: '4px', md: '100px' }
                    },
                    '&::after': {
                        content: '""',
                        flexShrink: 0,
                        width: { xs: '4px', md: '100px' }
                    }
                }}
                snakeOuterSx={{
                    mt: { xs: 4, md: 8 },
                    mb: { xs: 3, md: 6 }
                }}
            >
                {videos.map((video, index) => (
                    <Box
                        key={index}
                        data-snake-media
                        sx={{
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            px: { xs: 0, sm: 1 },
                            width: { xs: '100vw', sm: 'auto' },
                            maxWidth: { xs: '100vw', sm: 'none' },
                            opacity: isVisible ? 1 : 0,
                            transition: 'opacity 0.4s ease'
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: { xs: '250px', sm: '300px', md: '400px' },
                            width: { xs: '100vw', sm: '80vw', md: '600px' },
                            maxWidth: { xs: 'calc(100vw - 32px)', sm: '80vw', md: '600px' },
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                            mb: 1
                        }}>
                            <iframe
                                src={video}
                                title={`${isHebrew ? 'סרטון' : 'Video'} ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    borderRadius: '8px'
                                }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </Box>
                    </Box>
                ))}
            </SnakeScrollGallery>
        </Box>
    );
});

GallerySection.displayName = 'GallerySection';

const StaticGallerySection = React.forwardRef(({ product, selectedColor, isHebrew }, ref) => {
    const getCurrentImages = () => {
        if (selectedColor && selectedColor.extraImages) {
            // Ensure it's an array
            const images = Array.isArray(selectedColor.extraImages)
                ? selectedColor.extraImages
                : [];
            return images.filter(img => img);
        } else if (product.extraimages) {
            // Ensure it's an array (handle both camelCase and lowercase)
            const images = Array.isArray(product.extraimages)
                ? product.extraimages
                : (Array.isArray(product.extraImages) ? product.extraImages : []);
            return images.filter(img => img);
        }
        return [];
    };

    const images = getCurrentImages();

    const imageDescriptions = [
        {
            title: {
                he: 'כלי המקדש',
                en: 'Temple Vessels'
            },
            description: {
                he: 'ארבעה כלי מקדש מיניאטוריים מהממים - שולחן הפנים, המנורה, מזבח הזהב והכרובים. וכל זה באריזה מיוחדת במינה.',
                en: 'The Second Temple in all its glory - a comprehensive view of the magnificent structure'
            }
        },
        {
            title: {
                he: 'אלבום המקדש',
                en: 'Temple Album'
            },
            description: {
                he: 'אלבום מקדש מושקע, שמכיל בתוכו תמונות מרהיבות והסברים מורחבים על איזורי המקדש השונים. תוכלו לבנות וללמוד יחד עם הבנייה!',
                en: 'Temple album invested, containing beautiful images and detailed explanations of the different areas of the temple. You can build and learn together with the building!'
            }
        },
        {
            title: {
                he: 'אריזה מרהיבה',
                en: 'Beautiful Box'
            },
            description: {
                he: 'אריזה שעוצבה בידי מעצב על, כדי שתקבלו חוויה מושלמת של בניית המקדש.',
                en: 'A box designed by a designer, to give you a perfect experience of building the temple.'
            }
        },
        {
            title: {
                he: 'הוראות בנייה',
                en: 'Building Instructions'
            },
            description: {
                he: 'חוברת הוראות בנייה בהירה להבנה, שלב אחרי שלב.',
                en: 'Building instructions, step by step.'
            }
        },
        {
            title: {
                he: 'אלבום המקדש מבפנים',
                en: 'Temple Album from Inside'
            },
            description: {
                he: 'הצצה לעמוד מתוך אלבום המקדש. תמונות שנרכשו ממכון המקדש עם הסברים מפורטים כדי שתקבלו את ההדמיות היפות והאותנטיות ביותר.',
                en: 'A peek into the temple album. Pictures taken from the temple museum with detailed explanations to give you the most beautiful and meaningful pictures.'
            }
        }
    ];

    if (images.length === 0) return null;

    return (
        <Box
            ref={ref}
            sx={{
                backgroundColor: 'rgb(0, 26, 36)',
                pt: 8,
                pb: 6
            }}>
            <Container
                maxWidth="lg"
                sx={{
                    maxWidth: { xs: '100%', md: '800px' },
                    px: { xs: 2, md: 3 }
                }}
            >
                {/* Desktop: Title above, then text-image pairs */}
                <Box sx={{
                    display: { xs: 'none', md: 'block' }
                }}>
                    {/* Title above everything - aligned with image section */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        mb: 4
                    }}>
                        {/* Spacer matching text section width */}
                        <Box sx={{ flex: '0 0 40%' }} />

                        {/* Spacer for divider */}
                        <Box sx={{ width: '1px' }} />

                        {/* Title in image section area */}
                        <Box sx={{ flex: '0 0 60%' }}>
                            <Typography
                                variant="h2"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 400,
                                    fontSize: { md: '2.4rem', lg: '2.6rem' },
                                    lineHeight: 1.6,
                                    textAlign: isHebrew ? 'right' : 'left',
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                }}
                            >
                                {isHebrew ? 'מה הערכה כוללת?' : 'What does the package include?'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Text-Image pairs */}
                    {images.map((image, index) => (
                        <Box key={`pair-${index}`} className={`gallery-pair-${index}`} sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            mb: 4,
                            flexDirection: isHebrew ? 'row' : 'row',
                            '&:hover .gallery-divider': {
                                borderColor: 'rgb(229, 90, 61)',
                            }
                        }}>
                            {/* Text side */}
                            <Box
                                className="gallery-text"
                                sx={{
                                    flex: '0 0 40%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: 'white',
                                        fontSize: '1.6rem',
                                        lineHeight: 1.3,
                                        fontWeight: 600,
                                        mb: 1,
                                        direction: isHebrew ? 'rtl' : 'ltr',
                                    }}
                                >
                                    {isHebrew
                                        ? imageDescriptions[index]?.title?.he || imageDescriptions[0]?.title?.he
                                        : imageDescriptions[index]?.title?.en || imageDescriptions[0]?.title?.en}
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontSize: '1.15rem',
                                        lineHeight: 1.5,
                                        direction: isHebrew ? 'rtl' : 'ltr',
                                    }}
                                >
                                    {isHebrew
                                        ? imageDescriptions[index]?.description?.he || imageDescriptions[0]?.description?.he
                                        : imageDescriptions[index]?.description?.en || imageDescriptions[0]?.description?.en}
                                </Typography>
                            </Box>
                            <Divider
                                className="gallery-divider"
                                orientation="vertical"
                                sx={{
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    my: '32px',
                                    transition: 'border-color 0.3s ease'
                                }}
                                flexItem
                            />
                            {/* Image side */}
                            <Box
                                className="gallery-image"
                                sx={{
                                    flex: '0 0 60%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                <Box
                                    component="img"
                                    src={getImageUrl(image)}
                                    alt={`${isHebrew ? 'תמונה' : 'Image'} ${index + 1}`}
                                    sx={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        objectFit: 'contain',
                                        display: 'block',
                                        borderRadius: '8px',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                        '&:hover': {
                                            transform: 'scale(1.05)',
                                            boxShadow: '0 10px 40px rgba(229, 90, 61, 0.4)',
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    ))}
                </Box>

                {/* Mobile: Stacked layout (images above text) */}
                <Box sx={{
                    display: { xs: 'block', md: 'none' }
                }}>
                    <Typography
                        variant="h2"
                        sx={{
                            color: '#f5f0e3',
                            fontWeight: 400,
                            fontSize: { xs: '2rem', sm: '2.2rem' },
                            lineHeight: 1.6,
                            textAlign: isHebrew ? 'right' : 'left',
                            direction: isHebrew ? 'rtl' : 'ltr',
                            mb: 2,
                            width: '100%'
                        }}
                    >
                        {isHebrew ? 'מה הערכה כוללת?' : 'What does the package include?'}
                    </Typography>

                    <Grid container spacing={4}>
                        {images.map((image, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                                <Box
                                    className="gallery-item"
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                    }}>
                                    {/* Image Container */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: isHebrew ? 'flex-end' : 'flex-start',
                                        width: '100%',
                                    }}>
                                        <img
                                            src={getImageUrl(image)}
                                            alt={`${isHebrew ? 'תמונה' : 'Image'} ${index + 1}`}
                                            style={{
                                                maxWidth: '100%',
                                                height: 'auto',
                                                objectFit: 'contain',
                                                display: 'block',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </Box>

                                    {/* Image Title */}
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: 'white',
                                            textAlign: 'center',
                                            maxWidth: '100%',
                                            fontSize: '1.3rem',
                                            lineHeight: 1.3,
                                            fontWeight: 600,
                                            mt: 2,
                                            mb: 0.8,
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            pr: isHebrew ? 2 : 0,
                                            pl: isHebrew ? 0 : 2
                                        }}
                                    >
                                        {isHebrew
                                            ? imageDescriptions[index]?.title?.he || imageDescriptions[0]?.title?.he
                                            : imageDescriptions[index]?.title?.en || imageDescriptions[0]?.title?.en}
                                    </Typography>

                                    {/* Image Description */}
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            textAlign: 'center',
                                            maxWidth: '100%',
                                            fontSize: '1rem',
                                            lineHeight: 1.2,
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            pr: isHebrew ? 2 : 0,
                                            pl: isHebrew ? 0 : 2
                                        }}
                                    >
                                        {isHebrew
                                            ? imageDescriptions[index]?.description?.he || imageDescriptions[0]?.description?.he
                                            : imageDescriptions[index]?.description?.en || imageDescriptions[0]?.description?.en}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
});

StaticGallerySection.displayName = 'StaticGallerySection';

const ProductFeaturesSection = React.forwardRef(({ product, isHebrew }, ref) => {
    return (
        <Box
            ref={ref}
            sx={{
                backgroundColor: 'rgb(0, 33, 46)',
                py: 6
            }}>
            <Container maxWidth="lg">
                {/* Features Section Title */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: isHebrew ? 'flex-end' : 'flex-start',
                    width: '100%',
                    px: { xs: 4 },
                    mb: { xs: 3, md: 6 },
                }}>
                    <Typography
                        variant="h2"
                        sx={{
                            color: '#f5f0e3',
                            fontWeight: 400,
                            fontSize: { xs: '2rem', sm: '2.2rem', md: '2.4rem', lg: '2.6rem' },
                            lineHeight: 1.6,
                            maxWidth: '80%',
                            textAlign: isHebrew ? 'right' : 'left',
                            direction: isHebrew ? 'rtl' : 'ltr',
                        }}
                    >
                        {isHebrew ? 'מאפייני המוצר' : 'Product Features'}
                    </Typography>
                </Box>

                {/* Features Grid */}
                <Grid container spacing={3} justifyContent={{ xs: 'center', md: isHebrew ? 'flex-end' : 'flex-start' }} mb={6}>
                    {/* Building Time */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            className="feature-card"
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                                }
                            }}
                        >
                            <AccessTimeIcon
                                sx={{
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    color: '#f5f0e3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5f0e3',
                                    mb: 0,
                                    fontSize: { xs: '1rem', md: '1.2rem' }
                                }}
                            >
                                {isHebrew ? 'זמן בנייה' : 'Building Time'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                                }}
                            >
                                {product?.buildingTime ?
                                    (isHebrew ? `±${product.buildingTime} שעות` : `±${product.buildingTime} hours`) :
                                    (isHebrew ? '±2 שעות' : '±2 hours')
                                }
                            </Typography>
                        </Card>
                    </Grid>
                    {/* Number of Pieces */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            className="feature-card"
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                                }
                            }}
                        >
                            <ExtensionIcon
                                sx={{
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    color: '#f5f0e3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5f0e3',
                                    mb: 0,
                                    fontSize: { xs: '1rem', md: '1.2rem' }
                                }}
                            >
                                {isHebrew ? 'מספר חלקים' : 'Number of Pieces'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                                }}
                            >
                                {product?.pieces || (isHebrew ? '800+' : '800+')}
                            </Typography>
                        </Card>
                    </Grid>

                    {/* Size */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            className="feature-card"
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                                }
                            }}
                        >
                            <StraightenIcon
                                sx={{
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    color: '#f5f0e3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5f0e3',
                                    mb: 1,
                                    fontSize: { xs: '1rem', md: '1.2rem' }
                                }}
                            >
                                {isHebrew ? 'מידות' : 'Dimensions'}
                            </Typography>
                            <Box sx={{ textAlign: 'center' }}>
                                {product?.height && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#f5f0e3',
                                            fontWeight: 600,
                                            fontSize: { xs: '1rem', md: '1.1rem' },
                                            mb: 0.5
                                        }}
                                    >
                                        {isHebrew ? `גובה – ${product.height}` : `Height – ${product.height}`}
                                    </Typography>
                                )}
                                {product?.width && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#f5f0e3',
                                            fontWeight: 600,
                                            fontSize: { xs: '1rem', md: '1.1rem' },
                                            mb: 0.5
                                        }}
                                    >
                                        {isHebrew ? `רוחב – ${product.width}` : `Width – ${product.width}`}
                                    </Typography>
                                )}
                                {product?.length && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#f5f0e3',
                                            fontWeight: 600,
                                            fontSize: { xs: '1rem', md: '1.1rem' }
                                        }}
                                    >
                                        {isHebrew ? `אורך – ${product.length}` : `Length – ${product.length}`}
                                    </Typography>
                                )}
                            </Box>
                        </Card>
                    </Grid>

                    {/* Recommended Age */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            className="feature-card"
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                                }
                            }}
                        >
                            <ChildCareIcon
                                sx={{
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    color: '#f5f0e3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5f0e3',
                                    mb: 0,
                                    fontSize: { xs: '1rem', md: '1.2rem' }
                                }}
                            >
                                {isHebrew ? 'גיל מומלץ' : 'Recommended Age'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                                }}
                            >
                                {product?.recommendedAge || (isHebrew ? '10+' : '10+ ')}
                            </Typography>
                        </Card>
                    </Grid>

                    {/* Instruction Booklet */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            className="feature-card"
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                                }
                            }}
                        >
                            <MenuBookIcon
                                sx={{
                                    fontSize: { xs: '2rem', md: '2.5rem' },
                                    color: '#f5f0e3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.1rem', md: '1.3rem' }
                                }}
                            >
                                {isHebrew ? 'כולל חוברת הוראות מפורטת' : 'Detailed Booklet Instructions'}
                            </Typography>
                        </Card>
                    </Grid>

                </Grid>

            </Container>
        </Box>
    );
});

ProductFeaturesSection.displayName = 'ProductFeaturesSection';

export default function MikdashProductPage({ onAddToCart, product: productProp = null }) {
    const navigate = useNavigate();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const [product, setProduct] = useState(productProp || null);
    const [loading, setLoading] = useState(!productProp);
    const [error, setError] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [isSticky, setIsSticky] = useState(true); // Start as sticky (at bottom)
    const [hasReachedTarget, setHasReachedTarget] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [currentAdvantageIndex, setCurrentAdvantageIndex] = useState(0);
    const [advantageScrollProgress, setAdvantageScrollProgress] = useState(0);

    // Product gallery images - stored in public/2mikdash_product_images/
    const productGalleryImages = [
        '/2mikdash_product_images/candle.png',
        '/2mikdash_product_images/hamikdash.png',
        '/2mikdash_product_images/kruvim.png',
        '/2mikdash_product_images/lehem.png',
        '/2mikdash_product_images/pnimi.png',
        '/2mikdash_product_images/hamikdash2.png'
        // Add more images as needed
    ];

    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const imageRef = useRef(null);
    const buttonTargetRef = useRef(null); // Reference to the target position
    const heroSectionRef = useRef(null); // Reference to the hero section
    const advantageScrollContainerRef = useRef(null);

    // GSAP animation refs for mobile
    const mobileBackgroundRef = useRef(null);
    const mobileLogoRef = useRef(null);
    const textSectionRef = useRef(null);
    const gilImageRef = useRef(null);
    const staticGalleryRef = useRef(null);
    const videoGalleryRef = useRef(null);
    const productFeaturesRef = useRef(null);
    const childrenPlayingRef = useRef(null);
    const productGalleryRef = useRef(null);
    const kitAdvantagesRef = useRef(null);

    // GSAP animation refs for desktop hero video
    const desktopHeroVideoRef = useRef(null);
    const desktopHeroLogoRef = useRef(null);

    // Snake border around the gil / "Every home..." image
    const gilSnakeWrapRef = useRef(null);
    const [gilSnakeSize, setGilSnakeSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const el = gilSnakeWrapRef.current;
        if (!el) return undefined;

        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setGilSnakeSize({ w: width, h: height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [product, loading]);

    useEffect(() => {
        if (productProp) {
            setProduct(productProp);
            setLoading(false);
            setError(null);
            if (productProp?.colors && Array.isArray(productProp.colors) && productProp.colors.length > 0) {
                setSelectedColor(productProp.colors[0]);
            }
            return undefined;
        }

        // Fallback if mounted without a resolved product (should not happen via router)
        setError('Failed to load product details');
        setLoading(false);
        return undefined;
    }, [productProp]);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);


    // Sticky button logic
    useEffect(() => {
        const handleScroll = () => {
            if (buttonTargetRef.current) {
                const rect = buttonTargetRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                if (rect.top <= windowHeight - 100) {
                    if (isSticky) {
                        setIsSticky(false);
                        setHasReachedTarget(true);
                    }
                } else {
                    if (!isSticky && hasReachedTarget) {
                        setIsSticky(true);
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isSticky, hasReachedTarget]);

    // Advantages scroll tracking - exact copy from children playing
    useEffect(() => {
        const handleAdvantageScroll = () => {
            if (advantageScrollContainerRef.current) {
                const container = advantageScrollContainerRef.current;
                let scrollLeft = container.scrollLeft;
                const maxScroll = container.scrollWidth - container.clientWidth;

                // In RTL mode, scrollLeft is negative or zero when scrolling right
                // We need to convert it to a positive value
                if (isHebrew) {
                    scrollLeft = Math.abs(scrollLeft);
                }

                const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
                setAdvantageScrollProgress(progress);

                const childNodes = container.childNodes[0]?.childNodes || [];
                let totalWidth = 0;
                for (let i = 0; i < childNodes.length; i++) {
                    totalWidth += childNodes[i].offsetWidth + 24; // +gap (3 * 8px)
                    if (totalWidth >= scrollLeft + container.clientWidth / 2) {
                        setCurrentAdvantageIndex(i);
                        break;
                    }
                }
            }
        };

        const container = advantageScrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleAdvantageScroll);
            // Initial call to set progress
            handleAdvantageScroll();
            return () => container.removeEventListener('scroll', handleAdvantageScroll);
        }
    }, [product, isHebrew]);

    // Mobile rectangle animation – adjust to change how the red background appears
    const mobileRectAnimation = {
        duration: 1,           // seconds (e.g. 0.5 = snappier, 1.5 = slower)
        delay: 0.3,             // start after this many seconds (e.g. 0.3 = after logo)
        scaleFrom: 0.1,       // start size (1 = full, 0.8 = 80%, 0.5 = pop-in)
        opacityFrom: 0,       // 0 = fade in, 1 = no fade
        yFrom: 0,             // start offset in px (e.g. 30 = slide up from below)
        ease: 'power3.out'    // 'power2.out' | 'power3.inOut' | 'back.out' | 'elastic.out'
    };

    // Mobile logo animation – adjust how the temple logo appears
    const mobileLogoAnimation = {
        duration: 1,           // seconds
        delay: 0,           // start after this many seconds (0 = with rectangle)
        yFrom: 150,            // start offset in px (positive = slide up from below, 0 = no movement)
        opacityFrom: 0,       // 0 = fade in, 1 = no fade
        scaleFrom: 0.8,         // start scale (1 = no scale, 0.8 = grow in)
        ease: 'power3.out'    // 'power2.out' | 'power3.inOut' | 'back.out' | 'elastic.out'
    };

    // GSAP Mobile Animations
    useEffect(() => {
        if (!product) return;

        console.log('GSAP Animations starting..., window width:', window.innerWidth);

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                const r = mobileRectAnimation;
                if (mobileBackgroundRef.current) {
                    gsap.from(mobileBackgroundRef.current, {
                        scale: r.scaleFrom,
                        opacity: r.opacityFrom,
                        y: r.yFrom,
                        duration: r.duration,
                        delay: r.delay,
                        ease: r.ease,
                        transformOrigin: 'center center'
                    });
                }

                if (mobileLogoRef.current) {
                    const l = mobileLogoAnimation;
                    gsap.from(mobileLogoRef.current, {
                        y: l.yFrom,
                        opacity: l.opacityFrom,
                        scale: l.scaleFrom,
                        duration: l.duration,
                        delay: l.delay,
                        ease: l.ease,
                        transformOrigin: 'center center'
                    });
                }

                // Text section animation - wait for scroll
                if (textSectionRef.current) {
                    console.log('Setting up text section animation');
                    gsap.set(textSectionRef.current, { y: 60, opacity: 0 });
                    gsap.to(textSectionRef.current, {
                        scrollTrigger: {
                            trigger: textSectionRef.current,
                            start: 'top 80%',
                            end: 'top 50%',
                            toggleActions: 'play none none reverse',
                            onEnter: () => console.log('Text section animation triggered')
                        },
                        y: 0,
                        opacity: 1,
                        duration: 1,
                        ease: 'power3.out'
                    });
                }

                // Gil image animation
                if (gilImageRef.current) {
                    gsap.set(gilImageRef.current, { scale: 0.9, opacity: 0 });
                    gsap.to(gilImageRef.current, {
                        scrollTrigger: {
                            trigger: gilImageRef.current,
                            start: 'top 80%',
                            toggleActions: 'play none none reverse'
                        },
                        scale: 1,
                        opacity: 1,
                        duration: 0.8,
                        ease: 'power2.out'
                    });
                }

                // Static gallery items animation
                if (staticGalleryRef.current) {
                    // Animate the title separately - slide from side
                    const staticTitle = staticGalleryRef.current.querySelector('h2');
                    if (staticTitle) {
                        gsap.set(staticTitle, { x: isHebrew ? 50 : -50, opacity: 0 });
                        gsap.to(staticTitle, {
                            scrollTrigger: {
                                trigger: staticGalleryRef.current,
                                start: 'top 75%',
                                toggleActions: 'play none none reverse'
                            },
                            x: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: 'power2.out'
                        });
                    }

                    // Animate gallery items
                    const galleryItems = staticGalleryRef.current.querySelectorAll('.gallery-item');
                    galleryItems.forEach((item, index) => {
                        gsap.set(item, { y: 20, opacity: 0 });
                        gsap.to(item, {
                            scrollTrigger: {
                                trigger: item,
                                start: 'top 85%',
                                toggleActions: 'play none none reverse'
                            },
                            y: 0,
                            opacity: 1,
                            duration: 1.2,
                            delay: index * 0.15,
                            ease: 'power1.out'
                        });
                    });
                }

                // Video gallery section animation
                if (videoGalleryRef.current) {
                    // Animate the title separately - slide from side
                    const videoTitle = videoGalleryRef.current.querySelector('h2');
                    if (videoTitle) {
                        gsap.set(videoTitle, { x: isHebrew ? 50 : -50, opacity: 0 });
                        gsap.to(videoTitle, {
                            scrollTrigger: {
                                trigger: videoGalleryRef.current,
                                start: 'top 75%',
                                toggleActions: 'play none none reverse'
                            },
                            x: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: 'power2.out'
                        });
                    }

                    // Animate the content (videos)
                    const videoContent = videoGalleryRef.current.querySelector('[data-snake-scroll-container]');
                    if (videoContent) {
                        gsap.set(videoContent, { opacity: 0, y: 15 });
                        gsap.to(videoContent, {
                            scrollTrigger: {
                                trigger: videoGalleryRef.current,
                                start: 'top 75%',
                                toggleActions: 'play none none reverse'
                            },
                            opacity: 1,
                            y: 0,
                            duration: 1.5,
                            delay: 0.3,
                            ease: 'power1.out'
                        });
                    }
                }

                // Product features animation
                if (productFeaturesRef.current) {
                    // Animate the title separately - slide from side
                    const featuresTitle = productFeaturesRef.current.querySelector('h2');
                    if (featuresTitle) {
                        gsap.set(featuresTitle, { x: isHebrew ? 50 : -50, opacity: 0 });
                        gsap.to(featuresTitle, {
                            scrollTrigger: {
                                trigger: productFeaturesRef.current,
                                start: 'top 75%',
                                toggleActions: 'play none none reverse'
                            },
                            x: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: 'power2.out'
                        });
                    }

                    // Animate individual feature cards
                    const featureCards = productFeaturesRef.current.querySelectorAll('.feature-card');
                    featureCards.forEach((card, index) => {
                        gsap.set(card, { scale: 0.95, opacity: 0 });
                        gsap.to(card, {
                            scrollTrigger: {
                                trigger: card,
                                start: 'top 85%',
                                toggleActions: 'play none none reverse'
                            },
                            scale: 1,
                            opacity: 1,
                            duration: 0.8,
                            delay: index * 0.1,
                            ease: 'power2.out'
                        });
                    });
                }

                // Children playing section animation
                if (childrenPlayingRef.current) {
                    // Animate the title separately - slide from side
                    const childrenTitle = childrenPlayingRef.current.querySelector('h2');
                    if (childrenTitle) {
                        gsap.set(childrenTitle, { x: isHebrew ? 50 : -50, opacity: 0 });
                        gsap.to(childrenTitle, {
                            scrollTrigger: {
                                trigger: childrenPlayingRef.current,
                                start: 'top 75%',
                                toggleActions: 'play none none reverse'
                            },
                            x: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: 'power2.out'
                        });
                    }

                    // Animate the scrolling container separately - fade from bottom
                    const scrollContainer = childrenPlayingRef.current.querySelector('[data-children-playing-scroll]');
                    if (scrollContainer) {
                        gsap.set(scrollContainer, { opacity: 0, y: 15 });
                        gsap.to(scrollContainer, {
                            scrollTrigger: {
                                trigger: childrenPlayingRef.current,
                                start: 'top 75%',
                                toggleActions: 'play none none reverse'
                            },
                            opacity: 1,
                            y: 0,
                            duration: 1.5,
                            delay: 0.3,
                            ease: 'power1.out'
                        });
                    }
                }

                // Kit advantages section animation
                if (kitAdvantagesRef.current) {
                    // Animate the title separately - slide from side
                    const advantagesTitle = kitAdvantagesRef.current.querySelector('h2');
                    if (advantagesTitle) {
                        gsap.set(advantagesTitle, { x: isHebrew ? 50 : -50, opacity: 0 });
                        gsap.to(advantagesTitle, {
                            scrollTrigger: {
                                trigger: kitAdvantagesRef.current,
                                start: 'top 75%',
                                toggleActions: 'play none none reverse'
                            },
                            x: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: 'power2.out'
                        });
                    }

                    // Animate individual advantage cards
                    const advantageCards = kitAdvantagesRef.current.querySelectorAll('[data-advantage]');
                    advantageCards.forEach((card, index) => {
                        gsap.set(card, { scale: 0.95, opacity: 0 });
                        gsap.to(card, {
                            scrollTrigger: {
                                trigger: card,
                                start: 'top 85%',
                                toggleActions: 'play none none reverse'
                            },
                            scale: 1,
                            opacity: 1,
                            duration: 0.8,
                            delay: index * 0.1,
                            ease: 'power2.out'
                        });
                    });
                }

                // Refresh ScrollTrigger after all animations are set
                ScrollTrigger.refresh();
            });

            return () => {
                ctx.revert();
            };
        }, 100);

        return () => clearTimeout(timer);
    }, [product]);

    // GSAP Desktop Animations
    useEffect(() => {
        // Only run on desktop devices
        const isDesktop = window.innerWidth >= 900;
        if (!isDesktop || !product) return;

        console.log('GSAP Desktop Animations starting...');

        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                // Static gallery desktop animations
                if (staticGalleryRef.current) {
                    // Animate text-image pairs
                    const galleryPairs = staticGalleryRef.current.querySelectorAll('.gallery-pair-0, .gallery-pair-1, .gallery-pair-2, .gallery-pair-3, .gallery-pair-4');

                    galleryPairs.forEach((pair, index) => {
                        // Find text and image within each pair
                        const textBox = pair.querySelector('.gallery-text');
                        const imageBox = pair.querySelector('.gallery-image');

                        if (textBox) {
                            gsap.set(textBox, { x: -30, opacity: 0 });
                            gsap.to(textBox, {
                                scrollTrigger: {
                                    trigger: pair,
                                    start: 'top 75%',
                                    toggleActions: 'play none none reverse'
                                },
                                x: 0,
                                opacity: 1,
                                duration: 1,
                                delay: index * 0.1,
                                ease: 'power2.out'
                            });
                        }

                        if (imageBox) {
                            gsap.set(imageBox, { x: 30, opacity: 0 });
                            gsap.to(imageBox, {
                                scrollTrigger: {
                                    trigger: pair,
                                    start: 'top 75%',
                                    toggleActions: 'play none none reverse'
                                },
                                x: 0,
                                opacity: 1,
                                duration: 1,
                                delay: 0.2 + (index * 0.1),
                                ease: 'power2.out'
                            });
                        }
                    });
                }
            });

            return () => ctx.revert();
        }, 100);

        return () => clearTimeout(timer);
    }, [product]);

    // Desktop hero logo — slide in from the right 1s after the video starts
    useEffect(() => {
        const isDesktop = window.innerWidth >= 900;
        if (!isDesktop || !product) return undefined;

        const video = desktopHeroVideoRef.current;
        const logo = desktopHeroLogoRef.current;
        if (!video || !logo) return undefined;

        let delayTimer = null;
        let hasAnimated = false;

        gsap.set(logo, { x: 120, opacity: 0 });

        const startLogoSlide = () => {
            if (hasAnimated) return;
            hasAnimated = true;
            delayTimer = setTimeout(() => {
                gsap.to(logo, {
                    x: 0,
                    opacity: 1,
                    duration: 1.1,
                    ease: 'power3.out',
                });
            }, 700);
        };

        // `playing` fires when playback actually begins (better than relying on autoplay alone)
        video.addEventListener('playing', startLogoSlide);

        // If the video already started before the listener was attached
        if (!video.paused && video.currentTime > 0) {
            startLogoSlide();
        }

        return () => {
            video.removeEventListener('playing', startLogoSlide);
            if (delayTimer) clearTimeout(delayTimer);
            gsap.killTweensOf(logo);
        };
    }, [product]);

    const handleBackClick = () => {
        navigate('/');
    };

    const handleAddToCart = () => {
        console.log('MikdashProductPage - Add to Cart clicked');
        console.log('Product:', product);
        console.log('Selected Color:', selectedColor);
        console.log('onAddToCart function:', onAddToCart);

        if (onAddToCart && product) {
            onAddToCart(product, selectedColor);
            console.log('MikdashProductPage - Successfully called onAddToCart');
        } else {
            console.error('MikdashProductPage - Missing onAddToCart or product');
        }
    };

    if (loading) {
        return (
            <Box sx={{
                backgroundColor: 'white',
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <CircularProgress size={60} sx={{ color: '#FFD700' }} />
            </Box>
        );
    }

    const GIL_SNAKE_RADIUS = 10;
    const GIL_SNAKE_STROKE = 2;
    const gilSnakeInset = GIL_SNAKE_STROKE / 2;
    const gilSnakeRectW = Math.max(0, gilSnakeSize.w - GIL_SNAKE_STROKE);
    const gilSnakeRectH = Math.max(0, gilSnakeSize.h - GIL_SNAKE_STROKE);
    const gilSnakeRx = Math.max(0, GIL_SNAKE_RADIUS - gilSnakeInset);

    return (
        <Box sx={{
            backgroundColor: '#00212e',
            minHeight: '100vh',
            pt: { xs: 10, md: 12 },
            pb: 8,
            position: 'relative',
            zIndex: 1,
            width: '100%',
            overflowX: 'hidden',
            overflowY: 'visible',
        }}>

            <Box
                ref={heroSectionRef}
                sx={{
                    position: 'relative',
                    zIndex: 2,
                    minHeight: '50vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'visible',
                }}
            >
                {/* Mobile: Single Background Rectangle */}
                <Box
                    ref={mobileBackgroundRef}
                    sx={{
                        position: 'absolute',
                        top: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        margin: '16px auto',
                        width: 'calc(100% - 45px)',
                        height: { xs: '55vh', md: '100vh' },
                        backgroundColor: '#d8472a',
                        borderRadius: 4.5,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        zIndex: -1,
                        display: { xs: 'block', md: 'none' }
                    }}
                />

                {/* Desktop hero — video (mobile unchanged) */}
                <Box
                    sx={{
                        display: { xs: 'none', md: 'flex' },
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: 'calc(100vh - 140px)',
                        px: 3,
                        mt: 2,
                        mb: 10,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        ref={desktopHeroVideoRef}
                        component="video"
                        src="/mikdash_2_hero.webm"
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '28px',
                            display: 'block',
                            backgroundColor: 'transparent',
                        }}
                    />
                    {/* Slides in from the right 1s after video starts — tweak size/position on the wrapper */}
                    <Box
                        sx={{
                            position: 'absolute',
                            right: { md: '4%', lg: '6%' },
                            top: '25%',
                            transform: 'translateY(-50%)',
                            width: { md: '22%', lg: '24%' },
                            maxHeight: '50%',
                            zIndex: 2,
                            pointerEvents: 'none',
                        }}
                    >
                        <Box
                            component="img"
                            ref={desktopHeroLogoRef}
                            src="/mikdash_2_logo.webp"
                            alt={isHebrew ? 'לוגו המקדש השני' : 'Second Temple Logo'}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '50vh',
                                objectFit: 'contain',
                                display: 'block',
                                opacity: 0, // visible after slide-in starts
                            }}
                        />
                    </Box>
                </Box>

                <Container maxWidth="lg" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    {/* Mobile: Single logo */}
                    <Box
                        ref={mobileLogoRef}
                        sx={{
                            position: 'relative',
                            width: '100vw', // Full viewport width
                            marginLeft: 'calc(-50vw + 50%)', // Break out of container
                            marginRight: 'calc(-50vw + 50%)', // Break out of container
                            display: { xs: 'flex', md: 'none' },
                            justifyContent: 'center',
                            mb: 0,
                            mt: -10, // Move logo higher (adjust this value)
                        }}
                    >
                        <img
                            src="/mikdash_logo_2.webp"
                            alt={isHebrew ? '   לוגו המקדש השני' : 'Second Temple Logo'}
                            fetchpriority="high"
                            style={{
                                maxWidth: '100%',
                                width: 'auto',
                                height: 'auto',
                                maxHeight: '20%',
                            }}
                        />
                    </Box>

                </Container>
            </Box>

            {/* Text Section */}
            <Box
                ref={textSectionRef}
                sx={{
                    backgroundColor: 'rgb(1, 20, 29)',
                    py: 6,
                    minHeight: { xs: 'auto', md: 'calc(100vh - 140px)' },
                    display: { xs: 'block', md: 'flex' },
                    alignItems: { xs: 'unset', md: 'center' }
                }}>
                <Container maxWidth="lg">


                    {/* Desktop: Image left, Text right */}
                    <Box sx={{
                        display: { xs: 'none', md: 'flex' },
                        alignItems: 'center',
                        gap: 10,
                        flexDirection: isHebrew ? 'row' : 'row-reverse'
                    }}>
                        {/* Image side */}
                        <Box
                            ref={gilImageRef}
                            sx={{
                                flex: '0 0 40%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <Box
                                ref={gilSnakeWrapRef}
                                sx={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    maxWidth: '100%',
                                    borderRadius: `${GIL_SNAKE_RADIUS}px`,
                                    overflow: 'visible',
                                    cursor: 'pointer',
                                    '& .gil-snake-img': {
                                        borderColor: 'rgb(229, 90, 61)',
                                        transition: 'border-color 0.08s linear'
                                    },
                                    '&:hover .gil-snake-img': {
                                        borderColor: 'transparent'
                                    },
                                    '& .gil-snake-path': {
                                        strokeDasharray: 1,
                                        strokeDashoffset: 1,
                                        opacity: 0,
                                        transition: 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.01s linear 1.15s'
                                    },
                                    '&:hover .gil-snake-path': {
                                        strokeDashoffset: 0,
                                        opacity: 1,
                                        transition: 'stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1) 0.08s, opacity 0s linear 0.08s'
                                    }
                                }}
                            >
                                <Box
                                    component="img"
                                    className="gil-snake-img"
                                    src="/gil_image.jpg"
                                    alt={isHebrew ? 'ילד משחק עם דגם המקדש' : 'Child playing with Temple model'}
                                    sx={{
                                        display: 'block',
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: `${GIL_SNAKE_RADIUS}px`,
                                        border: `${GIL_SNAKE_STROKE}px solid rgb(229, 90, 61)`,
                                        boxSizing: 'border-box',
                                        padding: '25px',
                                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
                                    }}
                                />
                                {gilSnakeSize.w > 0 && gilSnakeSize.h > 0 && (
                                    <Box
                                        component="svg"
                                        aria-hidden
                                        width={gilSnakeSize.w}
                                        height={gilSnakeSize.h}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: gilSnakeSize.w,
                                            height: gilSnakeSize.h,
                                            zIndex: 2,
                                            pointerEvents: 'none',
                                            overflow: 'visible',
                                            transform: isHebrew ? 'scaleX(-1)' : 'none'
                                        }}
                                    >
                                        <rect
                                            className="gil-snake-path"
                                            x={gilSnakeInset}
                                            y={gilSnakeInset}
                                            width={gilSnakeRectW}
                                            height={gilSnakeRectH}
                                            rx={gilSnakeRx}
                                            ry={gilSnakeRx}
                                            pathLength={1}
                                            fill="none"
                                            stroke="rgb(229, 90, 61)"
                                            strokeWidth={GIL_SNAKE_STROKE}
                                            strokeLinecap="butt"
                                            strokeLinejoin="round"
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        {/* Text side */}
                        <Box sx={{
                            flex: '0 0 60%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isHebrew ? 'flex-end' : 'flex-start',
                            textAlign: isHebrew ? 'right' : 'left',
                            direction: isHebrew ? 'rtl' : 'ltr',
                            pr: isHebrew ? 0 : 2,
                            pl: isHebrew ? 2 : 0
                        }}>
                            {/* Title above everything */}
                            <Typography
                                variant="h2"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 400,
                                    fontSize: { xs: '2.2rem', sm: '2.3rem', md: '2.4rem', lg: '2.6rem' },
                                    lineHeight: 1.1,
                                    maxWidth: '80%',
                                    ml: 'auto',
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    textAlign: 'right',
                                    mb: 4
                                }}
                            >
                                {isHebrew ? 'בכל בית צריך להיות בית המקדש!' : 'Every home needs the Beit Hamikdash!'}
                            </Typography>
                            <Typography
                                ref={subtitleRef}
                                variant="h5"
                                sx={{
                                    maxWidth: '90%',
                                    ml: 'auto',
                                    color: '#f5f0e3',
                                    fontWeight: 400,
                                    fontSize: { md: '1.5rem', lg: '1.6rem' },
                                    lineHeight: 1.5,
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                }}
                            >
                                {isHebrew ? (
                                    <>
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>במו</span> עיני ראיתי כשנכנסו לגבאליה, בתים עם תמונת המסגד שלהם ברחבת הר הבית שלנו.{' '}
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>במלחמה</span> הזאת ירושלים נמצאת במרכז העולם.{' '}
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>ובבית</span> שלנו צריך לעמוד בגאון דגם בית המקדש – צלמו ושתפו את התמונה של כל המשפחה עם בית המקדש בבית – שכולם יידעו שדוד המלך בדרך לנצח את המלחמה!{' '}
                                        <br />
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>בית המקדש</span> הוא מקור של קדושה, יציבות, אהבת ישראל ואהבת התורה.{' '}
                                        <br />
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>בשנות</span> הגלות, הקב"ה רואה בכל יהודי בית מקדש קטן מהלך, שמביא ערכים של קדושה לכל מקום אליו מגיע.{' '}
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>ועכשיו,</span> עם דגם כזה בסלון, כל הילדים בבית חיים את בית המקדש!
                                    </>
                                ) : (
                                    <>
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>With</span> my own eyes, I saw that when they entered Jabalia, there were homes displaying pictures of their mosque in the plaza of our Temple Mount.{' '}
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>In</span> this war, Jerusalem stands at the center of the world.{' '}
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>And</span> in our home, a Beit Hamikdash model should stand proudly — photograph and share a family picture with the Temple at home — so everyone knows that King David is on the way to win this war!{' '}
                                        <br />
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>The</span> Beit Hamikdash is a source of holiness, stability, love of Israel, and love of Torah.{' '}
                                        <br />
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>During</span> the years of exile, Hashem sees every Jew as a small, walking Temple, bringing values of holiness wherever they go.{' '}
                                        <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>Now,</span> with a model like this in the living room, every child at home lives the Beit Hamikdash!
                                    </>
                                )}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Mobile: Stacked layout (text below title) */}
                    <Box sx={{
                        display: { xs: 'block', md: 'none' }
                    }}>
                        <Typography
                            variant="h2"
                            sx={{
                                color: '#f5f0e3',
                                fontWeight: 400,
                                fontSize: { xs: '2.2rem', sm: '2.3rem', md: '2.4rem', lg: '2.6rem' },
                                lineHeight: 1.1,
                                maxWidth: '80%',
                                ml: 'auto',
                                direction: isHebrew ? 'rtl' : 'ltr',
                                textAlign: 'right',
                                mx: 'auto',
                                mb: 4
                            }}
                        >
                            {isHebrew ? 'בכל בית צריך להיות בית המקדש!' : 'Every home needs the Beit Hamikdash!'}
                        </Typography>
                        <Typography
                            ref={subtitleRef}
                            variant="h5"
                            sx={{
                                color: '#f5f0e3',
                                fontWeight: 400,
                                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                                lineHeight: 1.6,
                                maxWidth: '80%',
                                mx: 'auto',
                                direction: isHebrew ? 'rtl' : 'ltr',
                                textAlign: isHebrew ? 'right' : 'left',
                            }}
                        >
                            {isHebrew ? (
                                <>
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>במו</span> עיני ראיתי כשנכנסו לגבאליה, בתים עם תמונת המסגד שלהם ברחבת הר הבית שלנו.{' '}
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>במלחמה</span> הזאת ירושלים נמצאת במרכז העולם.{' '}
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>ובבית שלנו</span> צריך לעמוד בגאון דגם בית המקדש – צלמו ושתפו את התמונה של כל המשפחה עם בית המקדש בבית – שכולם יידעו שדוד המלך בדרך לנצח את המלחמה!{' '}
                                    <br />
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>בית המקדש</span> הוא מקור של קדושה, יציבות, אהבת ישראל ואהבת התורה.{' '}
                                    <br />
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>בשנות</span> הגלות, הקב"ה רואה בכל יהודי בית מקדש קטן מהלך, שמביא ערכים של קדושה לכל מקום אליו מגיע.{' '}
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>ועכשיו,</span> עם דגם כזה בסלון, כל הילדים בבית חיים את בית המקדש!
                                </>
                            ) : (
                                <>
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>With</span> my own eyes, I saw that when they entered Jabalia, there were homes displaying pictures of their mosque in the plaza of our Temple Mount.{` `}
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>In</span> this war, Jerusalem stands at the center of the world.{` `}
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>And</span> in our home, a Beit Hamikdash model should stand proudly — photograph and share a family picture with the Temple at home — so everyone knows that King David is on the way to win this war!{` `}
                                    <br />
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>The</span> Beit Hamikdash is a source of holiness, stability, love of Israel, and love of Torah.{` `}
                                    <br />
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>During</span> the years of exile, Hashem sees every Jew as a small, walking Temple, bringing values of holiness wherever they go.{` `}
                                    <span style={{ color: 'rgb(229, 90, 61)', fontWeight: 700 }}>Now,</span> with a model like this in the living room, every child at home lives the Beit Hamikdash!
                                </>
                            )}
                        </Typography>
                    </Box>
                </Container>
            </Box>


            {/* Full-Width Hero Image Section */}
            {/* <Box
                ref={imageRef}
                sx={{
                    position: 'relative',
                    width: '100vw',
                    height: { xs: '70vh', sm: '75vh', md: '80vh', lg: '85vh' },
                    marginLeft: 'calc(-50vw + 50%)',
                    marginRight: 'calc(-50vw + 50%)',
                    overflow: 'hidden',
                    opacity: 1,
                    transform: 'translateY(50px) scale(0.95)',
                    filter: 'blur(3px)',
                    transition: 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }}
            >
                <CardMedia
                    component="img"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    }}
                    image={getImageUrl(
                        (selectedColor && selectedColor.mainImage) ?
                            selectedColor.mainImage :
                            (product.heroImage || product.homepageimage)
                    )}
                    alt={isHebrew ? 'המקדש השני' : 'The Second Temple'}
                /> */}

            {/* Enhanced Gradient Overlay */}
            {/* <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.11) 0%, rgba(0, 33, 46, 0.06) 50%, rgba(0, 0, 0, 0.3) 100%)',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.1) 100%)',
                        }
                    }}
                />
            </Box> */}

            {/* Static Image Gallery */}
            {
                product && (product.extraimages || (selectedColor && selectedColor.extraImages)) && (
                    <StaticGallerySection
                        ref={staticGalleryRef}
                        product={product}
                        selectedColor={selectedColor}
                        isHebrew={isHebrew}
                    />
                )
            }

            {/* Children Playing Media Section */}
            <ChildrenPlayingSection
                ref={childrenPlayingRef}
                media={product?.childrenPlaying}
                isHebrew={isHebrew}
            />

            {/* Horizontal Scrolling Video Gallery */}
            <Box sx={{
                backgroundColor: 'rgb(5, 38, 51)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                py: 6
            }}>
                {/* Horizontal Scrolling Video Gallery */}
                <GallerySection
                    ref={videoGalleryRef}
                    product={product}
                    selectedColor={selectedColor}
                    isHebrew={isHebrew}
                />
            </Box>

            {/* Product Features Section */}
            <ProductFeaturesSection ref={productFeaturesRef} product={product} isHebrew={isHebrew} />

            {/* Close-Up Photos — snake-controlled horizontal gallery */}
            {productGalleryImages.length > 0 && (
                <Box
                    ref={productGalleryRef}
                    sx={{
                        backgroundColor: 'rgb(5, 38, 51)',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        py: 6
                    }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: isHebrew ? 'flex-end' : 'flex-start',
                        width: '100%',
                        mb: 3,
                    }}>
                        <Typography
                            variant="h2"
                            component="h2"
                            sx={{
                                color: '#f5f0e3',
                                fontWeight: 400,
                                fontSize: { xs: '2rem', sm: '2.2rem', md: '2.4rem', lg: '2.6rem' },
                                lineHeight: 1.6,
                                maxWidth: '80%',
                                textAlign: isHebrew ? 'right' : 'left',
                                direction: isHebrew ? 'rtl' : 'ltr',
                                px: { xs: 4, md: '9%' },
                            }}
                        >
                            {isHebrew ? 'תמונות מקרוב' : 'Close-Up Photos'}
                        </Typography>
                    </Box>

                    <SnakeScrollGallery
                        isHebrew={isHebrew}
                        aria-label={isHebrew ? 'תמונות מקרוב' : 'Close-Up Photos'}
                        rowSx={{
                            height: { xs: '320px', sm: '450px', md: '500px' }
                        }}
                    >
                        <Box sx={{ flexShrink: 0, width: { xs: '0px', md: '100px' }, height: '1px' }} />
                        {productGalleryImages.map((imagePath, index) => (
                            <Box
                                key={`pg-${index}`}
                                data-snake-media
                                sx={{
                                    flexShrink: 0,
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <img
                                    src={imagePath}
                                    alt={`${isHebrew ? 'תמונת מוצר' : 'Product image'} ${index + 1}`}
                                    draggable={false}
                                    style={{
                                        height: '100%',
                                        width: 'auto',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        display: 'block'
                                    }}
                                />
                            </Box>
                        ))}
                        <Box sx={{ flexShrink: 0, width: { xs: '0px', md: '100px' }, height: '1px' }} />
                    </SnakeScrollGallery>
                </Box>
            )}

            {/* Kit Advantages Section */}
            <Box
                ref={kitAdvantagesRef}
                sx={{
                    backgroundColor: 'rgb(0, 26, 36)',
                    py: 6
                }}>
                {/* Section Title */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: isHebrew ? 'flex-end' : 'flex-start',
                    width: '100%',
                    mb: 3,

                }}>
                    <Typography
                        variant="h2"
                        sx={{
                            color: '#f5f0e3',
                            fontWeight: 400,
                            fontSize: { xs: '2rem', sm: '2.2rem', md: '2.4rem', lg: '2.6rem' },
                            lineHeight: 1.6,
                            maxWidth: '80%',
                            px: { xs: 4, md: '9%' },
                            textAlign: isHebrew ? 'right' : 'left',
                            direction: isHebrew ? 'rtl' : 'ltr',
                        }}
                    >
                        {isHebrew ? 'יתרונות הערכה' : 'Kit Advantages'}
                    </Typography>
                </Box>

                {/* Advantages Scrolling Container */}
                <Box
                    ref={advantageScrollContainerRef}
                    sx={{
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                        width: '100%',
                        direction: isHebrew ? 'rtl' : 'ltr'
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        gap: 3,
                        py: 1,
                        alignItems: 'flex-start'
                    }}>
                        {/* Spacer at start */}
                        <Box sx={{ flexShrink: 0, width: { xs: '0px', md: '100px' }, height: '1px' }} />

                        {/* Advantage 1 */}
                        <Box data-advantage sx={{
                            flexShrink: 0,
                            width: { xs: '280px', sm: '320px', md: '350px' },
                            height: { xs: '280px', sm: '320px', md: '350px' },
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.5rem', sm: '1.4rem', md: '1.5rem' },
                                    mb: 2,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew ? 'חינוך וערכים' : 'Education & Values'}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(245, 240, 227, 0.9)',
                                    fontSize: { xs: '1rem', sm: '1rem' },
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew
                                    ? 'הערכה מחנכת את הילדים על חשיבות בית המקדש בהיסטוריה היהודית ומעבירה ערכים של קדושה ואהבת ישראל.'
                                    : 'The kit educates children about the importance of the Temple in Jewish history and instills values of holiness and love for Israel.'
                                }
                            </Typography>
                        </Box>

                        {/* Advantage 2 */}
                        <Box data-advantage sx={{
                            flexShrink: 0,
                            width: { xs: '280px', sm: '320px', md: '350px' },
                            height: { xs: '280px', sm: '320px', md: '350px' },
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
                                    mb: 2,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew ? 'איכות גבוהה' : 'High Quality'}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(245, 240, 227, 0.9)',
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew
                                    ? 'חומרים עמידים ואיכותיים, עיצוב מדויק ופרטים מרשימים שיחזיקו מעמד לאורך שנים.'
                                    : 'Durable and high-quality materials, precise design and impressive details that will last for years.'
                                }
                            </Typography>
                        </Box>

                        {/* Advantage 3 */}
                        <Box data-advantage sx={{
                            flexShrink: 0,
                            width: { xs: '280px', sm: '320px', md: '350px' },
                            height: { xs: '280px', sm: '320px', md: '350px' },
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
                                    mb: 2,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew ? 'חוויה משפחתית' : 'Family Experience'}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(245, 240, 227, 0.9)',
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew
                                    ? 'פעילות מהנה לכל המשפחה שמחזקת את הקשר המשפחתי ומביאה שמחה וקדושה לבית.'
                                    : 'Fun activity for the whole family that strengthens family bonds and brings joy and holiness to the home.'
                                }
                            </Typography>
                        </Box>

                        {/* Advantage 4 */}
                        <Box data-advantage sx={{
                            flexShrink: 0,
                            width: { xs: '280px', sm: '320px', md: '350px' },
                            height: { xs: '280px', sm: '320px', md: '350px' },
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
                                    mb: 2,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew ? 'דיוק היסטורי' : 'Historical Accuracy'}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(245, 240, 227, 0.9)',
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew
                                    ? 'הדגם מבוסס על מחקרים היסטוריים ומקורות תורניים מדויקים, ומציג את בית המקדש כפי שהיה באמת.'
                                    : 'The model is based on historical research and accurate Torah sources, presenting the Temple as it really was.'
                                }
                            </Typography>
                        </Box>

                        {/* Advantage 5 */}
                        <Box data-advantage sx={{
                            flexShrink: 0,
                            width: { xs: '280px', sm: '320px', md: '350px' },
                            height: { xs: '280px', sm: '320px', md: '350px' },
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5f0e3',
                                    fontWeight: 600,
                                    fontSize: { xs: '1.3rem', sm: '1.4rem', md: '1.5rem' },
                                    mb: 2,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew ? 'עיצוב מרשים' : 'Impressive Design'}
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'rgba(245, 240, 227, 0.9)',
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                    direction: isHebrew ? 'rtl' : 'ltr'
                                }}
                            >
                                {isHebrew
                                    ? 'עיצוב מרשים ויפה שיהפוך את הדגם למוקד תשומת לב בסלון ויעניק יופי ורוחניות לבית.'
                                    : 'Impressive and beautiful design that will make the model a focal point in the living room and bring beauty and spirituality to the home.'
                                }
                            </Typography>
                        </Box>

                        {/* Spacer at end */}
                        <Box sx={{ flexShrink: 0, width: { xs: '8px', md: '160px' }, height: '1px' }} />
                    </Box>
                </Box>

                {/* Progress Indicator */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            width: '200px',
                            height: '8px',
                            backgroundColor: 'rgba(245, 240, 227, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            if (advantageScrollContainerRef.current) {
                                const container = advantageScrollContainerRef.current;
                                const nextIndex = (currentAdvantageIndex + 1) % 5; // 5 advantages
                                const targetChild = container.querySelectorAll('div[data-advantage]')[nextIndex];
                                if (targetChild) {
                                    targetChild.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                                }
                            }
                        }}
                    >
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: isHebrew ? 'auto' : 0,
                            right: isHebrew ? 0 : 'auto',
                            height: '100%',
                            width: `calc(${advantageScrollProgress * 100}%)`,
                            backgroundColor: '#f5f0e3',
                            borderRadius: '4px',
                            transition: 'width 0.1s ease-out'
                        }} />
                    </Box>
                </Box>
            </Box>

            {/* Add to Cart Button Target Position */}
            <Box sx={{
                py: 6
            }}>
                <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
                    <Box ref={buttonTargetRef} sx={{ display: 'flex', justifyContent: 'center' }}>
                        {!isSticky && (
                            <Button
                                variant="contained"
                                onClick={handleAddToCart}
                                disabled={!product || product.quantity <= 0}
                                sx={{
                                    backgroundColor: '#f5f0e3',
                                    color: '#002144',
                                    width: '80%',
                                    maxWidth: '600px',
                                    padding: { xs: '16px 32px', sm: '20px 40px', md: '24px 48px' },
                                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 16px rgba(241, 241, 238, 0.6)',
                                    transition: 'all 0.3s ease',
                                    border: '2px solid #f5f0e3',
                                    '&:hover': {
                                        backgroundColor: '#f5f0e3',
                                        color: 'rgba(229, 90, 61, 1)',
                                        transform: 'translateY(-4px)',
                                        borderColor: 'rgba(229, 90, 61, 1)'
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#666',
                                        color: '#999',
                                        boxShadow: 'none',
                                        borderColor: '#666'
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
            </Box>


            {/* Sticky Add to Cart Button */}
            {
                isSticky && product && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 999,
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
                                backgroundColor: '#f5f0e3',
                                color: '#002144',
                                px: { xs: 4, md: 6 },
                                py: { xs: 1.5, md: 2 },
                                fontSize: { xs: '1.1rem', md: '1.3rem' },
                                fontWeight: 700,
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(241, 241, 238, 0.6)',
                                transition: 'all 0.3s ease',
                                minWidth: { xs: '280px', md: '320px' },
                                border: '2px solid #f5f0e3',
                                '&:hover': {
                                    backgroundColor: '#f5f0e3',
                                    color: 'rgba(229, 90, 61, 1)',
                                    transform: 'translateY(-4px)',
                                    borderColor: 'rgba(229, 90, 61, 1)'
                                },
                                '&:disabled': {
                                    backgroundColor: '#666',
                                    color: '#999',
                                    boxShadow: 'none',
                                    borderColor: '#666'
                                }
                            }}
                        >
                            {product && product.quantity > 0 ?
                                (isHebrew ? 'הוסף לסל' : 'Add to Cart') :
                                (isHebrew ? 'אזל מהמלאי' : 'Out of Stock')
                            }
                        </Button>
                    </Box>
                )
            }
        </Box >
    );
}
