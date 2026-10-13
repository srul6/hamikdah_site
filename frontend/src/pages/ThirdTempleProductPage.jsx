import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Box, Button, Grid, Card,
    CircularProgress
} from '@mui/material';
import ExtensionIcon from '@mui/icons-material/Extension';
import StraightenIcon from '@mui/icons-material/Straighten';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import ChildrenPlayingSection from '../components/ChildrenPlayingSection';
import PriceDisplay from '../components/PriceDisplay';
import { computeProductPricing } from '../utils/productPricing';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TEXT_SECTION_IMAGE = 'https://cdn.bmikdash.com/3mikdash_5.jpeg';
const HERO_IMAGE = '/3th_mikdash_white.png';
const LOGO_IMAGE = '/3th_mikdash_logo.webp';

/** Light blue accent: highlighted words, borders and outline buttons. */
const ACCENT_COLOR = '#2fb3c1';

/** Desktop: distance of the temple image from the hero panel's left edge (smaller = further left, negative allowed). */
const DESKTOP_HERO_IMAGE_LEFT = '-5%';
/** Mobile: temple image width relative to the screen width (100% = full width; larger overflows evenly on both sides). */
const MOBILE_HERO_IMAGE_WIDTH = '125%';
/** Mobile: space above the logo, relative to the screen width (larger = lower). */
const MOBILE_HERO_LOGO_TOP = '40%';
/** Mobile: extra offset of the temple image below the logo, relative to the screen width (negative = higher, 0 = default). */
const MOBILE_HERO_IMAGE_TOP = '-8%';

/** Desktop: distance of the logo from the right edge of the hero area (larger = further left). */
const DESKTOP_HERO_LOGO_RIGHT = '8%';

/** Renders translation text, coloring phrases wrapped in **double asterisks** with the accent color. */
function renderHighlighted(text) {
    return String(text || '').split(/\*\*(.+?)\*\*/g).map((part, i) => (
        i % 2 === 1
            ? <span key={i} style={{ color: ACCENT_COLOR }}>{part}</span>
            : part
    ));
}

/**
 * Hero panel geometry, in pixels of the Second Temple hero video frame (mikdash_2_hero.webm, 1890×768),
 * so both pages share the same chevron stripe, tip curve and corner rounding.
 */
const HERO_FRAME = { width: 1890, height: 768 };
const HERO_ASPECT_RATIO = HERO_FRAME.width / HERO_FRAME.height;
const HERO_CORNER_RADIUS = 68;
const HERO_STRIPE = {
    upperPoint: [820.5, 12],
    upperDirection: [1.3355, 1],
    lowerPoint: [982, 756],
    lowerDirection: [-3.31, 1],
    tipRadius: 71,
    halfWidth: 21.5,
};

const normalize = ([x, y]) => {
    const length = Math.hypot(x, y);
    return [x / length, y / length];
};

/** Outline of one hero piece: the stripe's center line offset sideways by `offset` (negative = left piece), closed along `closingX`. */
function heroPiecePath(offset, closingX) {
    const { width, height } = HERO_FRAME;
    const a = normalize(HERO_STRIPE.upperDirection);
    const b = normalize(HERO_STRIPE.lowerDirection);
    const upperNormal = [a[1], -a[0]];
    const lowerNormal = [b[1], -b[0]];
    const p1 = [HERO_STRIPE.upperPoint[0] + upperNormal[0] * offset, HERO_STRIPE.upperPoint[1] + upperNormal[1] * offset];
    const p2 = [HERO_STRIPE.lowerPoint[0] + lowerNormal[0] * offset, HERO_STRIPE.lowerPoint[1] + lowerNormal[1] * offset];

    const det = a[0] * -b[1] + b[0] * a[1];
    const s = ((p2[0] - p1[0]) * -b[1] + b[0] * (p2[1] - p1[1])) / det;
    const corner = [p1[0] + a[0] * s, p1[1] + a[1] * s];

    const halfAngle = Math.acos(-a[0] * b[0] - a[1] * b[1]) / 2;
    const radius = HERO_STRIPE.tipRadius + offset;
    const tangentDistance = radius / Math.tan(halfAngle);
    const tangentIn = [corner[0] - a[0] * tangentDistance, corner[1] - a[1] * tangentDistance];
    const tangentOut = [corner[0] + b[0] * tangentDistance, corner[1] + b[1] * tangentDistance];

    const top = -20;
    const bottom = height + 20;
    const start = [p1[0] + (a[0] / a[1]) * (top - p1[1]), top];
    const end = [p2[0] + (b[0] / b[1]) * (bottom - p2[1]), bottom];

    const u = ([x, y]) => `${(x / width).toFixed(5)} ${(y / height).toFixed(5)}`;
    const rx = (radius / width).toFixed(5);
    const ry = (radius / height).toFixed(5);
    return `M ${u(start)} L ${u(tangentIn)} A ${rx} ${ry} 0 0 1 ${u(tangentOut)} L ${u(end)} L ${u([closingX, bottom])} L ${u([closingX, top])} Z`;
}

const HERO_LEFT_PIECE_PATH = heroPiecePath(-HERO_STRIPE.halfWidth, -20);
const HERO_RIGHT_PIECE_PATH = heroPiecePath(HERO_STRIPE.halfWidth, HERO_FRAME.width + 20);
const HERO_PANEL_BORDER_RADIUS = `${(HERO_CORNER_RADIUS / HERO_FRAME.width) * 100}% / ${(HERO_CORNER_RADIUS / HERO_FRAME.height) * 100}%`;

const ProductFeaturesSection = React.forwardRef(({ product, isHebrew }, ref) => {
    return (
        <Box
            ref={ref}
            sx={{
                backgroundColor: '#1d392d',
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
                            color: '#f5efe3',
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
                                    color: '#f5efe3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5efe3',
                                    mb: 0,
                                    fontSize: { xs: '1rem', md: '1.2rem' }
                                }}
                            >
                                {isHebrew ? 'זמן בנייה' : 'Building Time'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: '#f5efe3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5efe3',
                                    mb: 0,
                                    fontSize: { xs: '1rem', md: '1.2rem' }
                                }}
                            >
                                {isHebrew ? 'מספר חלקים' : 'Number of Pieces'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: '#f5efe3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5efe3',
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
                                            color: '#f5efe3',
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
                                            color: '#f5efe3',
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
                                            color: '#f5efe3',
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
                                    color: '#f5efe3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: '#f5efe3',
                                    mb: 0,
                                    fontSize: { xs: '1rem', md: '1.2rem' }
                                }}
                            >
                                {isHebrew ? 'גיל מומלץ' : 'Recommended Age'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: '#f5efe3',
                                    mb: 1
                                }}
                            />
                            <Typography
                                variant="body2"
                                sx={{
                                    color: '#f5efe3',
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

export default function ThirdTempleProductPage({ onAddToCart, product: productProp = null }) {
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

    const galleryImages = (Array.isArray(product?.extraImages) ? product.extraImages : [])
        .filter(Boolean);

    const subtitleRef = useRef(null);
    const buttonTargetRef = useRef(null); // Reference to the target position
    const heroSectionRef = useRef(null); // Reference to the hero section
    const advantageScrollContainerRef = useRef(null);

    // GSAP animation refs for mobile
    const mobileBackgroundRef = useRef(null);
    const mobileLogoRef = useRef(null);
    const textSectionRef = useRef(null);
    const gilImageRef = useRef(null);
    const productFeaturesRef = useRef(null);
    const galleryRef = useRef(null);
    const childrenPlayingRef = useRef(null);
    const kitAdvantagesRef = useRef(null);

    // GSAP animation refs for desktop hero image
    const desktopHeroImageRef = useRef(null);
    const desktopHeroLeftRef = useRef(null);
    const desktopHeroRightRef = useRef(null);
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

                // Gallery and children playing sections animation
                [galleryRef.current, childrenPlayingRef.current].filter(Boolean).forEach((section) => {
                    // Animate the title separately - slide from side
                    const childrenTitle = section.querySelector('h2');
                    if (childrenTitle) {
                        gsap.set(childrenTitle, { x: isHebrew ? 50 : -50, opacity: 0 });
                        gsap.to(childrenTitle, {
                            scrollTrigger: {
                                trigger: section,
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
                    const scrollContainer = section.querySelector('[data-children-playing-scroll]');
                    if (scrollContainer) {
                        gsap.set(scrollContainer, { opacity: 0, y: 15 });
                        gsap.to(scrollContainer, {
                            scrollTrigger: {
                                trigger: section,
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
                });

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

    // Desktop hero — same timing as the Second Temple video: both pieces slide in over 0.6s once the model
    // image has loaded, and the logo slides in from the right 0.7s after that starts
    useLayoutEffect(() => {
        const isDesktop = window.innerWidth >= 900;
        if (!isDesktop || !product) return undefined;

        const image = desktopHeroImageRef.current;
        const leftPiece = desktopHeroLeftRef.current;
        const rightPiece = desktopHeroRightRef.current;
        const logo = desktopHeroLogoRef.current;
        if (!image || !leftPiece || !rightPiece || !logo) return undefined;

        let delayTimer = null;
        let hasAnimated = false;

        gsap.set(leftPiece, { xPercent: -100 });
        gsap.set(rightPiece, { xPercent: 60 });
        gsap.set(logo, { x: 120, opacity: 0 });

        const startLogoSlide = () => {
            if (hasAnimated) return;
            hasAnimated = true;
            gsap.to([leftPiece, rightPiece], {
                xPercent: 0,
                duration: 0.6,
                ease: 'power2.out',
            });
            delayTimer = setTimeout(() => {
                gsap.to(logo, {
                    x: 0,
                    opacity: 1,
                    duration: 1.1,
                    ease: 'power3.out',
                });
            }, 700);
        };

        image.addEventListener('load', startLogoSlide);

        // The image may already be loaded (cached) before the listener was attached
        if (image.complete && image.naturalWidth > 0) {
            startLogoSlide();
        }

        return () => {
            image.removeEventListener('load', startLogoSlide);
            if (delayTimer) clearTimeout(delayTimer);
            gsap.killTweensOf([leftPiece, rightPiece, logo]);
        };
    }, [product]);

    const handleBackClick = () => {
        navigate('/');
    };

    const handleAddToCart = () => {
        console.log('ThirdTempleProductPage - Add to Cart clicked');
        console.log('Product:', product);
        console.log('Selected Color:', selectedColor);
        console.log('onAddToCart function:', onAddToCart);

        if (onAddToCart && product) {
            onAddToCart(product, selectedColor);
            console.log('ThirdTempleProductPage - Successfully called onAddToCart');
        } else {
            console.error('ThirdTempleProductPage - Missing onAddToCart or product');
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
            backgroundColor: '#1d392d',
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
                        backgroundColor: '#f5efe3',
                        borderRadius: 4.5,
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        zIndex: -1,
                        display: { xs: 'block', md: 'none' }
                    }}
                />

                {/* Desktop hero — Third Temple image (mobile unchanged) */}
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
                    {/* Recreates the Second Temple hero video: an arrow piece carrying the model slides in from the left
                        and the right piece from the right; the gap left between them is the dark stripe */}
                    <Box
                        component="svg"
                        aria-hidden
                        sx={{ position: 'absolute', width: 0, height: 0 }}
                    >
                        <defs>
                            <clipPath id="tt-hero-left" clipPathUnits="objectBoundingBox">
                                <path d={HERO_LEFT_PIECE_PATH} />
                            </clipPath>
                            <clipPath id="tt-hero-right" clipPathUnits="objectBoundingBox">
                                <path d={HERO_RIGHT_PIECE_PATH} />
                            </clipPath>
                        </defs>
                    </Box>
                    <Box
                        sx={{
                            position: 'relative',
                            width: `min(100%, calc((100vh - 140px) * ${HERO_ASPECT_RATIO}))`,
                            aspectRatio: String(HERO_ASPECT_RATIO),
                            borderRadius: HERO_PANEL_BORDER_RADIUS,
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            ref={desktopHeroLeftRef}
                            sx={{ position: 'absolute', inset: 0, backgroundColor: '#f5efe3', clipPath: 'url(#tt-hero-left)' }}
                        >
                            <Box
                                ref={desktopHeroImageRef}
                                component="img"
                                src={HERO_IMAGE}
                                alt={isHebrew ? 'בית המקדש השלישי' : 'The Third Temple'}
                                fetchpriority="high"
                                sx={{
                                    position: 'absolute',
                                    left: DESKTOP_HERO_IMAGE_LEFT,
                                    top: 0,
                                    bottom: 0,
                                    my: 'auto',
                                    width: '72%',
                                    height: '102%',
                                    objectFit: 'contain',
                                    display: 'block',
                                }}
                            />
                        </Box>
                        <Box
                            ref={desktopHeroRightRef}
                            sx={{ position: 'absolute', inset: 0, backgroundColor: '#f5efe3', clipPath: 'url(#tt-hero-right)' }}
                        />
                    </Box>
                    {/* Slides in from the right after the hero image loads — tweak size/position on the wrapper */}
                    <Box
                        sx={{
                            position: 'absolute',
                            right: DESKTOP_HERO_LOGO_RIGHT,
                            top: '31%',
                            transform: 'translateY(-50%)',
                            width: { md: '17%', lg: '18%' },
                            maxHeight: '50%',
                            zIndex: 2,
                            pointerEvents: 'none',
                        }}
                    >
                        <Box
                            component="img"
                            ref={desktopHeroLogoRef}
                            src={LOGO_IMAGE}
                            alt={isHebrew ? 'לוגו המקדש השלישי' : 'Third Temple Logo'}
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
                        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'clip' }}>
                            <Box
                                component="img"
                                src={LOGO_IMAGE}
                                alt={isHebrew ? 'לוגו המקדש השלישי' : 'Third Temple Logo'}
                                fetchpriority="high"
                                sx={{ width: '46%', height: 'auto', display: 'block', mt: MOBILE_HERO_LOGO_TOP, mb: 3 }}
                            />
                            <Box
                                component="img"
                                src={HERO_IMAGE}
                                alt={isHebrew ? 'בית המקדש השלישי' : 'The Third Temple'}
                                sx={{
                                    width: MOBILE_HERO_IMAGE_WIDTH,
                                    mt: MOBILE_HERO_IMAGE_TOP,
                                    maxWidth: 'none',
                                    flexShrink: 0,
                                    height: 'auto',
                                    display: 'block'
                                }}
                            />
                        </Box>
                    </Box>

                </Container>
            </Box>

            {/* Text Section */}
            <Box
                ref={textSectionRef}
                sx={{
                    backgroundColor: '#13271f',
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
                                        borderColor: ACCENT_COLOR,
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
                                    src={TEXT_SECTION_IMAGE}
                                    alt={isHebrew ? 'דגם בית המקדש השלישי' : 'Third Temple model'}
                                    sx={{
                                        display: 'block',
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: `${GIL_SNAKE_RADIUS}px`,
                                        border: `${GIL_SNAKE_STROKE}px solid ${ACCENT_COLOR}`,
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
                                            stroke={ACCENT_COLOR}
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
                                    color: '#f5efe3',
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
                                {t.thirdTempleIntroTitle}
                            </Typography>
                            <Typography
                                ref={subtitleRef}
                                variant="h5"
                                sx={{
                                    maxWidth: '90%',
                                    ml: 'auto',
                                    color: '#f5efe3',
                                    fontWeight: 400,
                                    fontSize: { md: '1.5rem', lg: '1.6rem' },
                                    lineHeight: 1.5,
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                }}
                            >
                                {renderHighlighted(t.thirdTempleIntro)}
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
                                color: '#f5efe3',
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
                            {t.thirdTempleIntroTitle}
                        </Typography>
                        <Typography
                            ref={subtitleRef}
                            variant="h5"
                            sx={{
                                color: '#f5efe3',
                                fontWeight: 400,
                                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                                lineHeight: 1.6,
                                maxWidth: '80%',
                                mx: 'auto',
                                direction: isHebrew ? 'rtl' : 'ltr',
                                textAlign: isHebrew ? 'right' : 'left',
                            }}
                        >
                            {renderHighlighted(t.thirdTempleIntro)}
                        </Typography>
                    </Box>
                </Container>
            </Box>


            {/* Gallery — same layout and behavior as Kids Playing */}
            <ChildrenPlayingSection
                ref={galleryRef}
                media={galleryImages}
                isHebrew={isHebrew}
                backgroundColor="#234536"
                titleHe="גלריה"
                titleEn="Gallery"
            />

            {/* Children Playing Media Section */}
            <ChildrenPlayingSection
                ref={childrenPlayingRef}
                media={product?.childrenPlaying}
                isHebrew={isHebrew}
                backgroundColor="#234536"
            />

            {/* Product Features Section */}
            <ProductFeaturesSection ref={productFeaturesRef} product={product} isHebrew={isHebrew} />

            {/* Kit Advantages Section */}
            <Box
                ref={kitAdvantagesRef}
                sx={{
                    backgroundColor: '#182f25',
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
                            color: '#f5efe3',
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
                            border: `1px solid ${ACCENT_COLOR}`,
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: 'rgba(245, 239, 227, 0.9)',
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
                            border: `1px solid ${ACCENT_COLOR}`,
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: 'rgba(245, 239, 227, 0.9)',
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
                            border: `1px solid ${ACCENT_COLOR}`,
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: 'rgba(245, 239, 227, 0.9)',
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
                            border: `1px solid ${ACCENT_COLOR}`,
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: 'rgba(245, 239, 227, 0.9)',
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
                            border: `1px solid ${ACCENT_COLOR}`,
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    color: '#f5efe3',
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
                                    color: 'rgba(245, 239, 227, 0.9)',
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
                            backgroundColor: 'rgba(245, 239, 227, 0.3)',
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
                            backgroundColor: '#f5efe3',
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
                                    backgroundColor: '#f5efe3',
                                    color: '#1d392d',
                                    width: '80%',
                                    maxWidth: '600px',
                                    padding: { xs: '16px 32px', sm: '20px 40px', md: '24px 48px' },
                                    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.8rem' },
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 16px rgba(241, 241, 238, 0.6)',
                                    transition: 'all 0.3s ease',
                                    border: '2px solid #f5efe3',
                                    '&:hover': {
                                        backgroundColor: '#f5efe3',
                                        color: ACCENT_COLOR,
                                        transform: 'translateY(-4px)',
                                        borderColor: ACCENT_COLOR
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#666',
                                        color: '#999',
                                        boxShadow: 'none',
                                        borderColor: '#666'
                                    }
                                }}
                            >
                                {product && product.quantity > 0 ? (
                                    <Box
                                        component="span"
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            direction: 'ltr'
                                        }}
                                    >
                                        <Box component="span">
                                            {isHebrew ? 'הוספה לסל' : 'Add to Cart'}
                                        </Box>
                                        <Box
                                            component="span"
                                            sx={{
                                                width: 0,
                                                alignSelf: 'stretch',
                                                borderLeft: '2.5px solid currentColor',
                                                opacity: 0.55,
                                            }}
                                        />
                                        <PriceDisplay
                                            pricing={computeProductPricing(product)}
                                            format={(n) => `₪${Number.isInteger(n) ? n : n.toFixed(2)}`}
                                            finalSx={{ color: 'inherit' }}
                                        />
                                    </Box>
                                ) : (
                                    isHebrew ? 'בקרוב' : 'Coming Soon'
                                )}
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
                                backgroundColor: '#f5efe3',
                                color: '#1d392d',
                                px: { xs: 4, md: 6 },
                                py: { xs: 1.5, md: 2 },
                                fontSize: { xs: '1.1rem', md: '1.3rem' },
                                fontWeight: 700,
                                borderRadius: 3,
                                boxShadow: '0 4px 16px rgba(241, 241, 238, 0.6)',
                                transition: 'all 0.3s ease',
                                minWidth: { xs: '280px', md: '320px' },
                                border: '2px solid #f5efe3',
                                '&:hover': {
                                    backgroundColor: '#f5efe3',
                                    color: ACCENT_COLOR,
                                    transform: 'translateY(-4px)',
                                    borderColor: ACCENT_COLOR
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
                                (isHebrew ? 'הוספה לסל' : 'Add to Cart') :
                                (isHebrew ? 'אזל מהמלאי' : 'Out of Stock')
                            }
                        </Button>
                    </Box>
                )
            }
        </Box >
    );
}
