import React, { useState, useEffect, useRef } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Badge, Box, MenuItem, List, ListItem, ListItemText, Divider, Button, Card, CardContent, CardMedia, TextField, Grid
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Link, useLocation } from 'react-router-dom';
import { fetchProducts } from '../api/products';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { getImageUrl } from '../utils/imageUtils';
import { getCartItemDisplayName } from '../utils/cartDisplayName';

// Add CSS animation for smooth slide-down
const slideDownAnimation = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default function Navbar({ cartCount, cart, onRemoveFromCart, onUpdateQuantity }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [products, setProducts] = useState([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileProductsPage, setIsMobileProductsPage] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [couponError, setCouponError] = useState('');
    const { language, toggleLanguage, isHebrew } = useLanguage();
    const t = translations[language];
    const location = useLocation();

    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const cartMenuRef = useRef(null);
    const cartButtonRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        fetchProducts().then(setProducts);
    }, []);

    // Handle window resize for mobile detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setIsScrolled(scrollTop > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Handle products menu
            if (isExpanded) {
                const isClickInsideMenu = menuRef.current && menuRef.current.contains(event.target);
                const isClickInsideButton = buttonRef.current && buttonRef.current.contains(event.target);

                if (!isClickInsideMenu && !isClickInsideButton) {
                    setIsExpanded(false);
                }
            }

            // Handle cart menu
            if (isCartExpanded) {
                const isClickInsideCartMenu = cartMenuRef.current && cartMenuRef.current.contains(event.target);
                const isClickInsideCartButton = cartButtonRef.current && cartButtonRef.current.contains(event.target);

                if (!isClickInsideCartMenu && !isClickInsideCartButton) {
                    setIsCartExpanded(false);
                }
            }
        };

        if (isExpanded || isCartExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isExpanded, isCartExpanded]);

    const handleProductsHover = () => {
        if (!isMobile && !isExpanded) {
            setIsExpanded(true);
            setIsCartExpanded(false); // Close cart when opening products
        }
    };

    const handleCartHover = () => {
        // Don't open cart dropdown if we're already on the cart page
        if (!isMobile && !isCartExpanded && location.pathname !== '/cart') {
            setIsCartExpanded(true);
            setIsExpanded(false); // Close products when opening cart
        }
    };

    const handleHeaderLeave = () => {
        if (!isMobile) {
            setIsExpanded(false);
            setIsCartExpanded(false);
        }
    };

    const handleProductClick = () => {
        setIsExpanded(false);
        setIsMobileMenuOpen(false);
        setIsMobileProductsPage(false);
    };

    const handleProductsClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isMobile) {
            // Open products page in mobile menu
            setIsMobileProductsPage(true);
        } else {
            // On desktop, just open the menu if it's not already open
            if (!isExpanded) {
                setIsExpanded(true);
            }
        }
    };

    const handleLogoClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Close mobile menu if it's open
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
            setIsMobileProductsPage(false);
        }
    };

    const handleContactClick = (e) => {
        e.preventDefault();
        setIsExpanded(false);
        setIsCartExpanded(false);
        const footer = document.getElementById('site-footer');
        if (footer) {
            footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setIsMobileProductsPage(false);
    };

    const handleMobileMenuClose = () => {
        setIsMobileMenuOpen(false);
        setIsMobileProductsPage(false);
    };

    const handleBackToMainMenu = () => {
        setIsMobileProductsPage(false);
    };

    const handleLanguageToggle = () => {
        toggleLanguage();
        // Don't close menu on mobile
    };

    const handleCartClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isMobile) {
            // On mobile, go directly to cart page
            return;
        } else {
            // On desktop, toggle cart dropdown (open/close on click)
            setIsCartExpanded(!isCartExpanded);
            if (!isCartExpanded) {
                setIsExpanded(false); // Close products menu when opening cart
            }
        }
    };

    const calculateCartTotal = () => {
        return cart.reduce((total, item) => total + (Number(item.price || 0) * item.quantity), 0);
    };

    const calculateDiscountedTotal = () => {
        const subtotal = calculateCartTotal();
        return subtotal - discount;
    };

    const handleQuantityChange = (uniqueId, newQuantity) => {
        if (newQuantity < 1) {
            onRemoveFromCart(uniqueId);
        } else {
            onUpdateQuantity(uniqueId, newQuantity);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError(isHebrew ? 'הזן קוד קופון' : 'Enter coupon code');
            return;
        }

        try {
            // Mock coupon validation - replace with actual API call
            const validCoupons = {
                'SAVE10': { discount: 10, type: 'percentage' },
                'SAVE20': { discount: 20, type: 'fixed' },
                'WELCOME': { discount: 15, type: 'percentage' }
            };

            const coupon = validCoupons[couponCode.toUpperCase()];

            if (coupon) {
                const subtotal = calculateCartTotal();
                let discountAmount = 0;

                if (coupon.type === 'percentage') {
                    discountAmount = (subtotal * coupon.discount) / 100;
                } else {
                    discountAmount = coupon.discount;
                }

                setAppliedCoupon(couponCode.toUpperCase());
                setDiscount(discountAmount);
                setCouponError('');
                setCouponCode('');
            } else {
                setCouponError(isHebrew ? 'קוד קופון לא תקין' : 'Invalid coupon code');
            }
        } catch (error) {
            setCouponError(isHebrew ? 'שגיאה בהחלת הקופון' : 'Error applying coupon');
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponError('');
    };

    return (
        <>
            <style>{slideDownAnimation}</style>
            <AppBar
                position="fixed"
                sx={{
                    backgroundColor: 'rgba(245, 240, 227, 0.9)',
                    backdropFilter: 'blur(25px)',
                    boxShadow: isScrolled ? '0 2px 20px rgba(0, 0, 0, 0.41)' : 'none',
                    border: 'none',
                    margin: '16px auto',
                    marginTop: '8px',
                    borderRadius: isMobile && isExpanded ? '15px 15px 0 0' : '15px',
                    width: 'calc(100% - 45px)',
                    top: '12px',
                    zIndex: 1000,
                    left: '0',
                    right: '0',
                    transition: 'all 0.3s ease'
                }}
                {...(!isMobile && { onMouseLeave: handleHeaderLeave })}
            >
                <Toolbar sx={{
                    justifyContent: 'space-between',
                    py: 0.5,
                    minHeight: '50px',
                    flexDirection: isHebrew ? 'row-reverse' : 'row'
                }}>
                    {/* Logo */}
                    <Link
                        to="/"
                        onClick={handleLogoClick}
                        style={{ textDecoration: 'none', color: 'inherit', marginTop: '8px' }}
                    >
                        <Box
                            component="span"
                            sx={{
                                display: 'inline-block',
                                position: 'relative',
                                pb: '4px',
                                lineHeight: 0,
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: '2px',
                                    backgroundColor: 'rgba(199, 61, 34, 1)',
                                    transform: 'scaleX(0)',
                                    transformOrigin: isHebrew ? '100% 50%' : '0% 50%',
                                    transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                                    pointerEvents: 'none'
                                },
                                '&:hover::after': {
                                    transform: 'scaleX(1)'
                                }
                            }}
                        >
                            <Box
                                component="img"
                                src="/logo.png"
                                alt="Store"
                                sx={{
                                    height: '30px',
                                    width: '70px',
                                    objectFit: 'cover',
                                    display: 'block',
                                    verticalAlign: 'middle'
                                }}
                            />
                        </Box>
                    </Link>

                    {/* Desktop: Products Menu and Language Switcher */}
                    {!isMobile && (
                        <>
                            <Typography
                                variant="body1"
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: { md: 'calc(50% + 270px)', lg: 'calc(50% + 360px)' },
                                    transform: 'translateY(-50%)',
                                    color: 'rgba(229, 90, 61, 1)',
                                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                    fontWeight: 400,
                                    whiteSpace: 'nowrap',
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    pointerEvents: 'none'
                                }}
                            >
                                {t.deliveryWithin7Days}
                            </Typography>

                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                    gap: { xs: 1, sm: 2, md: 3, lg: 5 }
                                }}
                            >
                                {/* Contact */}
                                <Typography
                                    component="a"
                                    href="#site-footer"
                                    onClick={handleContactClick}
                                    variant="body1"
                                    sx={{
                                        color: '#1d1d1f',
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                        fontWeight: 400,
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        transition: 'color 0.2s ease',
                                        '&:hover': {
                                            color: 'rgba(199, 61, 34, 1)'
                                        }
                                    }}
                                >
                                    {t.contact}
                                </Typography>

                                {/* Separator */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#86868b',
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                        fontWeight: 400,
                                        mx: 0,
                                        display: { xs: 'block', sm: 'block', md: 'block', lg: 'none' }
                                    }}
                                >
                                    |
                                </Typography>

                                <Box
                                    ref={buttonRef}
                                    onMouseEnter={handleProductsHover}
                                    onClick={handleProductsClick}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#1d1d1f',
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                            fontWeight: 400,
                                            cursor: 'pointer',
                                            transition: 'color 0.2s ease',
                                            '&:hover': {
                                                color: 'rgba(199, 61, 34, 1)'
                                            }
                                        }}
                                    >
                                        {t.products}
                                    </Typography>
                                </Box>

                                {/* Separator */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#86868b',
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                        fontWeight: 400,
                                        mx: 0,
                                        display: { xs: 'block', sm: 'block', md: 'block', lg: 'none' }
                                    }}
                                >
                                    |
                                </Typography>

                                {/* About Us */}
                                <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#1d1d1f',
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                            fontWeight: 400,
                                            cursor: 'pointer',
                                            transition: 'color 0.2s ease',
                                            '&:hover': {
                                                color: 'rgba(199, 61, 34, 1)'
                                            }
                                        }}
                                    >
                                        {t.aboutUs}
                                    </Typography>
                                </Link>

                                {/* Separator */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#86868b',
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                        fontWeight: 400,
                                        mx: 0,
                                        display: { xs: 'block', sm: 'block', md: 'block', lg: 'none' }
                                    }}
                                >
                                    |
                                </Typography>

                                {/* Home */}
                                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleLogoClick}>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#1d1d1f',
                                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                            fontWeight: 400,
                                            cursor: 'pointer',
                                            transition: 'color 0.2s ease',
                                            '&:hover': {
                                                color: 'rgba(199, 61, 34, 1)'
                                            }
                                        }}
                                    >
                                        {t.home || 'Home'}
                                    </Typography>
                                </Link>

                                {/* Separator */}
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#86868b',
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                        fontWeight: 400,
                                        mx: 0,
                                        display: { xs: 'block', sm: 'block', md: 'block', lg: 'none' }
                                    }}
                                >
                                    |
                                </Typography>

                                {/* Language Switcher */}
                                <Typography
                                    onClick={toggleLanguage}
                                    variant="body1"
                                    sx={{
                                        color: '#1d1d1f',
                                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.4rem' },
                                        fontWeight: 400,
                                        cursor: 'pointer',
                                        transition: 'color 0.2s ease',
                                        '&:hover': {
                                            color: 'rgba(199, 61, 34, 1)'
                                        }
                                    }}
                                >
                                    {language}
                                </Typography>
                            </Box>
                        </>
                    )}

                    {/* Cart and Mobile Menu */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        {/* Hebrew Mode: Hamburger first, then Cart */}
                        {isMobile && isHebrew && (
                            <IconButton
                                onClick={isMobileProductsPage ? handleBackToMainMenu : handleMobileMenuToggle}
                                sx={{
                                    color: 'rgba(173, 153, 103, 0.9)',
                                    transition: 'color 0.2s ease',
                                    '&:hover': {
                                        color: 'rgba(199, 61, 34, 1)'
                                    },
                                    '& .MuiSvgIcon-root': {
                                        fontSize: '1.5rem',
                                        strokeWidth: 0.5
                                    }
                                }}
                            >
                                {isMobileMenuOpen ? (
                                    isMobileProductsPage ? <ArrowBackIcon /> : <CloseIcon />
                                ) : (
                                    <MenuIcon />
                                )}
                            </IconButton>
                        )}

                        {/* Cart Icon - Hidden when mobile menu is open */}
                        {(!isMobile || !isMobileMenuOpen) && (
                            isMobile ? (
                                <Link to="/cart" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <IconButton
                                        disableRipple
                                        sx={{
                                            color: 'rgba(173, 153, 103, 0.9)',
                                            backgroundColor: 'transparent',
                                            transition: 'color 0.2s ease',
                                            '&:hover': {
                                                color: 'rgba(199, 61, 34, 1)',
                                                backgroundColor: 'transparent'
                                            }
                                        }}
                                    >
                                        <Badge badgeContent={cartCount} color="error">
                                            <ShoppingCartIcon />
                                        </Badge>
                                    </IconButton>
                                </Link>
                            ) : (
                                <Box
                                    ref={cartButtonRef}
                                    onMouseEnter={handleCartHover}
                                    onClick={handleCartClick}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <IconButton
                                        disableRipple
                                        sx={{
                                            color: 'rgba(173, 153, 103, 0.9)',
                                            backgroundColor: 'transparent',
                                            transition: 'color 0.2s ease',
                                            '&:hover': {
                                                color: 'rgba(199, 61, 34, 1)',
                                                backgroundColor: 'transparent'
                                            }
                                        }}
                                    >
                                        <Badge badgeContent={cartCount} color="error">
                                            <ShoppingCartIcon />
                                        </Badge>
                                    </IconButton>
                                </Box>
                            )
                        )}

                        {/* English Mode: Cart first, then Hamburger */}
                        {isMobile && !isHebrew && (
                            <IconButton
                                onClick={isMobileProductsPage ? handleBackToMainMenu : handleMobileMenuToggle}
                                sx={{
                                    color: 'rgba(173, 153, 103, 0.9)',
                                    transition: 'color 0.2s ease',
                                    '&:hover': {
                                        color: 'rgba(199, 61, 34, 1)'
                                    },
                                    '& .MuiSvgIcon-root': {
                                        fontSize: '1.5rem',
                                        strokeWidth: 0.5
                                    }
                                }}
                            >
                                {isMobileMenuOpen ? (
                                    isMobileProductsPage ? <ArrowBackIcon /> : <CloseIcon />
                                ) : (
                                    <MenuIcon />
                                )}
                            </IconButton>
                        )}
                    </Box>
                </Toolbar>

                {/* Desktop: Expanding Menu */}
                {!isMobile && isExpanded && (
                    <Box
                        ref={menuRef}
                        sx={{
                            backgroundColor: 'rgba(245, 240, 227, 0.95)',
                            backdropFilter: 'blur(25px)',
                            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                            height: 'auto',
                            maxHeight: '500px',
                            overflow: 'auto',
                            transition: 'all 0.3s ease',
                            py: 3,
                            px: 3,
                            opacity: 1,
                            visibility: 'visible',
                            display: 'flex',
                            justifyContent: 'center',
                            animation: 'slideDown 0.3s ease',
                            position: 'relative',
                            zIndex: 1001,
                            borderRadius: '0 0 15px 15px',
                            marginTop: '-1px',
                        }}
                    >
                        <Box
                            sx={{
                                // Use CSS grid (Safari-safe sizing)
                                display: 'grid',
                                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
                                gap: 2,
                                width: 'min(800px, 100%)',
                                maxWidth: { xs: '400px', sm: '600px', md: '800px' },
                                position: 'relative',
                                mx: 'auto'
                            }}
                        >
                            {products.map((product, index) => {
                                // Calculate row position (0-indexed)
                                const row = Math.floor(index / 3);
                                const totalRows = Math.ceil(products.length / 3);
                                const isLastRow = row === totalRows - 1;

                                return (
                                    <Box key={product.id} sx={{ position: 'relative', minWidth: 0 }}>
                                        <Box
                                            component={Link}
                                            to={`/product/${product.id}`}
                                            sx={{
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                minWidth: 0,
                                                marginX: { xs: '8px', sm: '8px', md: '15px' },
                                                ...(isLastRow ? { marginTop: '0px' } : { marginTop: { xs: '10px', sm: '10px', md: '20px' } }),
                                                '&:hover .product-name-text': {
                                                    width: '70%',
                                                    marginX: 'auto',
                                                    color: 'white',
                                                    backgroundColor: 'rgb(216, 71, 42)',
                                                    transition: 'background-color 0.3s ease',
                                                }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleProductClick();
                                            }}
                                        >
                                            {/* Image with its own frame/border */}
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: { xs: '100px', sm: '100px', md: '140px' },
                                                    borderRadius: 2,
                                                    border: '1px solid rgb(216, 71, 42)',
                                                    backgroundColor: 'transparent',
                                                    overflow: 'hidden',
                                                    cursor: 'pointer',
                                                    mb: { xs: 0.5, sm: 0.5, md: 1 },
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={getImageUrl(product.homepageimage || product.homepageImage)}
                                                    alt={isHebrew ? product.name_he : product.name_en}
                                                    sx={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        backgroundColor: '#f5f5f5',
                                                        display: 'block'
                                                    }}
                                                />
                                            </Box>

                                            {/* Product name - outside the frame */}
                                            <Typography
                                                className="product-name-text"
                                                variant="body2"
                                                sx={{
                                                    color: '#1d1d1f',
                                                    fontWeight: 500,
                                                    fontSize: { xs: '0.75rem', sm: '0.75rem', md: '0.9rem' },
                                                    textAlign: 'center',
                                                    lineHeight: 1.3,
                                                    direction: isHebrew ? 'rtl' : 'ltr',
                                                    mt: { xs: 0.25, sm: 0.25, md: 0.5 },
                                                    px: { xs: 0.5, sm: 0.5, md: 1 },
                                                    py: { xs: 0.25, sm: 0.25, md: 0.5 },
                                                }}
                                            >
                                                {isHebrew ? product.name_he : product.name_en}
                                            </Typography>
                                        </Box>

                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {/* Desktop: Cart Dropdown */}
                {!isMobile && isCartExpanded && (
                    <Box
                        ref={cartMenuRef}
                        sx={{
                            backgroundColor: 'rgba(245, 240, 227, 1)',
                            backdropFilter: 'blur(25px)',
                            border: '1px solid rgba(199, 61, 34, 1)',
                            borderTop: '1px solid rgba(245, 240, 227, 0)',
                            height: 'auto',
                            maxHeight: '500px',
                            overflow: 'auto',
                            transition: 'all 0.3s ease',
                            py: 2,
                            opacity: 1,
                            visibility: 'visible',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'slideDown 0.3s ease',
                            position: 'absolute',
                            top: '100%',
                            right: isHebrew ? 'auto' : 20,
                            left: isHebrew ? 20 : 'auto',
                            zIndex: 1001,
                            borderRadius: isHebrew ? '0 0 15px 15px' : '0 0 15px 15px',
                            marginTop: '0px',
                            width: '300px', // Half the original width (400px -> 200px)
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {cart.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Box
                                    component="img"
                                    src="/empty_bag.webp"
                                    alt="Empty cart"
                                    sx={{
                                        width: '80px',
                                        height: 'auto',
                                        mb: 2,
                                        mx: 'auto',
                                        display: 'block'
                                    }}
                                />
                                <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
                                    {isHebrew ? 'העגלה ריקה' : 'Your cart is empty'}
                                </Typography>
                                <Link to="/cart" style={{ textDecoration: 'none' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'rgba(199, 61, 34, 1)',
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => setIsCartExpanded(false)}
                                    >
                                        {isHebrew ? 'עבור לדף העגלה' : 'Go to Cart Page'}
                                    </Typography>
                                </Link>
                            </Box>
                        ) : (
                            <>
                                {/* Cart Items */}
                                <Box sx={{ px: 2, maxHeight: '300px', overflow: 'auto' }}>
                                    {cart.map((item, index) => (
                                        <Box key={item.id}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    py: 2,
                                                    gap: 2,
                                                    direction: isHebrew ? 'rtl' : 'ltr'
                                                }}
                                            >
                                                {/* Product Image */}
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            (item.selectedColor && item.selectedColor.mainImage) ?
                                                                item.selectedColor.mainImage :
                                                                (item.homepageimage || '/logo.png')
                                                        }
                                                        alt={getCartItemDisplayName(item, isHebrew)}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                </Box>

                                                {/* Product Details */}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: '#1d1d1f',
                                                            mb: 0.5,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {getCartItemDisplayName(item, isHebrew)}
                                                    </Typography>

                                                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                                                        ₪{Number(item.price || 0).toFixed(2)}
                                                    </Typography>

                                                    {/* Quantity Controls */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleQuantityChange(item.uniqueId || item.id, item.quantity - 1)}
                                                            sx={{
                                                                width: 20,
                                                                height: 20,
                                                                backgroundColor: 'rgba(229, 90, 61, 0.1)',
                                                                '&:hover': { backgroundColor: 'rgba(229, 90, 61, 0.2)' }
                                                            }}
                                                        >
                                                            <RemoveIcon sx={{ fontSize: 12 }} />
                                                        </IconButton>
                                                        <Typography variant="body2" sx={{ minWidth: 16, textAlign: 'center', fontSize: '0.75rem' }}>
                                                            {item.quantity}
                                                        </Typography>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleQuantityChange(item.uniqueId || item.id, item.quantity + 1)}
                                                            sx={{
                                                                width: 20,
                                                                height: 20,
                                                                backgroundColor: 'rgba(229, 90, 61, 0.1)',
                                                                '&:hover': { backgroundColor: 'rgba(229, 90, 61, 0.2)' }
                                                            }}
                                                        >
                                                            <AddIcon sx={{ fontSize: 12 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>

                                                {/* Remove Button */}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => onRemoveFromCart(item.uniqueId || item.id)}
                                                    sx={{
                                                        color: '#999',
                                                        '&:hover': { color: 'rgba(199, 61, 34, 1)' }
                                                    }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Box>

                                            <Divider sx={{ mx: 1 }} />

                                        </Box>
                                    ))}
                                </Box>


                                {/* Cart Summary */}
                                <Box sx={{ px: 2, mt: 2, borderTop: appliedCoupon ? '1px solid rgba(0, 0, 0, 0.1)' : 'none', pt: appliedCoupon ? 2 : 0 }}>
                                    {appliedCoupon && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                                {isHebrew ? 'סה״כ ביניים:' : 'Subtotal:'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#666', fontSize: '0.75rem' }}>
                                                ₪{calculateCartTotal().toFixed(2)}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: '0.9rem' }}>
                                            {isHebrew ? 'סה״כ:' : 'Total:'}
                                        </Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'rgba(199, 61, 34, 1)', fontSize: '0.9rem' }}>
                                            ₪{calculateDiscountedTotal().toFixed(2)}
                                        </Typography>
                                    </Box>

                                    {/* Checkout Button */}
                                    <Link
                                        to="/payment"
                                        style={{ textDecoration: 'none', width: '100%' }}
                                        state={{
                                            cart: cart,
                                            subtotal: calculateCartTotal(),
                                            discount: discount,
                                            total: calculateDiscountedTotal(),
                                            appliedCoupon: appliedCoupon,
                                            homeDelivery: calculateDiscountedTotal() >= 499
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={() => setIsCartExpanded(false)}
                                            sx={{
                                                backgroundColor: 'rgba(229, 90, 61, 1)',
                                                color: 'white',
                                                py: 1.2,
                                                mb: 1,
                                                fontWeight: 600,
                                                '&:hover': {
                                                    backgroundColor: 'rgba(229, 90, 61, 0.9)'
                                                }
                                            }}
                                        >
                                            {isHebrew ? 'המשך לתשלום' : 'Proceed to Checkout'}
                                        </Button>
                                    </Link>

                                    {/* Go to Cart Page Link */}
                                    <Link to="/cart" style={{ textDecoration: 'none' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                textAlign: 'center',
                                                color: 'rgba(199, 61, 34, 1)',
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}
                                            onClick={() => setIsCartExpanded(false)}
                                        >
                                            {isHebrew ? 'עבור לדף העגלה' : 'Go to Cart Page'}
                                        </Typography>
                                    </Link>
                                </Box>
                            </>
                        )}
                    </Box>
                )}
            </AppBar >

            {/* Mobile Full-Page Menu - Opens in place */}
            {
                isMobile && isMobileMenuOpen && (
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(245, 240, 227, 0.98)',
                            backdropFilter: 'blur(25px)',
                            zIndex: 999,
                            padding: 3,
                            paddingTop: '80px', // Account for navbar height
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Main Menu or Products Page */}
                        {!isMobileProductsPage ? (
                            // Main Menu
                            <Box sx={{ height: '100%', mt: 5, ml: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Menu Items */}
                                <List sx={{ flex: 1 }}>
                                    {/* Home */}
                                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleMobileMenuClose}>
                                        <ListItem
                                            sx={{
                                                borderRadius: 0,
                                                backgroundColor: 'transparent',
                                                cursor: 'pointer',
                                                opacity: 0,
                                                animation: 'fadeInUp 0.6s ease forwards',
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                    '& .MuiListItemText-primary': {
                                                        color: 'rgba(199, 61, 34, 1)'
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={t.home || 'Home'}
                                                primaryTypographyProps={{
                                                    fontSize: '2.5rem',
                                                    mb: -1.5,
                                                    fontWeight: 400,
                                                    color: '#1d1d1f',
                                                    cursor: 'pointer',
                                                    transition: 'color 0.2s ease'
                                                }}
                                            />
                                        </ListItem>
                                    </Link>

                                    {/* Products */}
                                    <ListItem
                                        button
                                        onClick={handleProductsClick}
                                        sx={{
                                            borderRadius: 0,
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            opacity: 0,
                                            animation: 'fadeInUp 0.6s ease 0.1s forwards',
                                            '&:hover': {
                                                backgroundColor: 'transparent',
                                                '& .MuiListItemText-primary': {
                                                    color: 'rgba(199, 61, 34, 1)'
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={t.products}
                                            primaryTypographyProps={{
                                                fontSize: '2.5rem',
                                                mb: -1.5,
                                                fontWeight: 400,
                                                color: '#1d1d1f',
                                                cursor: 'pointer',
                                                transition: 'color 0.2s ease'
                                            }}
                                        />
                                    </ListItem>

                                    {/* About Us */}
                                    <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleMobileMenuClose}>
                                        <ListItem
                                            sx={{
                                                borderRadius: 0,
                                                backgroundColor: 'transparent',
                                                cursor: 'pointer',
                                                opacity: 0,
                                                animation: 'fadeInUp 0.6s ease 0.2s forwards',
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                    '& .MuiListItemText-primary': {
                                                        color: 'rgba(199, 61, 34, 1)'
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={t.aboutUs}
                                                primaryTypographyProps={{
                                                    fontSize: '2.5rem',
                                                    mb: -1.5,
                                                    fontWeight: 400,
                                                    color: '#1d1d1f',
                                                    cursor: 'pointer',
                                                    transition: 'color 0.2s ease'
                                                }}
                                            />
                                        </ListItem>
                                    </Link>

                                    {/* Language Toggle */}
                                    <ListItem
                                        button
                                        onClick={handleLanguageToggle}
                                        sx={{
                                            borderRadius: 0,
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            opacity: 0,
                                            animation: 'fadeInUp 0.6s ease 0.3s forwards',
                                            '&:hover': {
                                                backgroundColor: 'transparent',
                                                '& .MuiListItemText-primary': {
                                                    color: 'rgba(199, 61, 34, 1)'
                                                }
                                            },
                                            '&:active': {
                                                backgroundColor: 'transparent',
                                                transform: 'none'
                                            },
                                            '&:focus': {
                                                backgroundColor: 'transparent',
                                                outline: 'none'
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <span>
                                                    <span style={{ color: isHebrew ? 'rgba(199, 61, 34, 1)' : '#1d1d1f' }}>HE</span>
                                                    <span style={{ color: '#86868b' }}> | </span>
                                                    <span style={{ color: !isHebrew ? 'rgba(199, 61, 34, 1)' : '#1d1d1f' }}>EN</span>
                                                </span>
                                            }
                                            primaryTypographyProps={{
                                                fontSize: '2.4rem',
                                                fontWeight: 400,
                                                color: '#1d1d1f',
                                                cursor: 'pointer',
                                                transition: 'color 0.2s ease'
                                            }}
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                        ) : (
                            // Products Page
                            <Box sx={{ height: '100%', mt: 6, display: 'flex', flexDirection: 'column' }}>
                                {/* Products List */}
                                <List sx={{ flex: 1 }}>
                                    {products.map((product, index) => (
                                        <Link
                                            key={product.id}
                                            to={`/product/${product.id}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                            onClick={handleProductClick}
                                        >
                                            <ListItem
                                                sx={{
                                                    borderRadius: 0,
                                                    backgroundColor: 'transparent',
                                                    ml: 1,
                                                    mt: -2,
                                                    cursor: 'pointer',
                                                    opacity: 0,
                                                    animation: `fadeInUp 0.6s ease ${0.1 * index}s forwards`,
                                                    '&:hover': {
                                                        backgroundColor: 'transparent',
                                                        '& .MuiListItemText-primary': {
                                                            color: 'rgba(199, 61, 34, 1)'
                                                        }
                                                    }
                                                }}
                                            >
                                                <ListItemText
                                                    primary={isHebrew ? product.name_he : product.name_en}
                                                    primaryTypographyProps={{
                                                        fontSize: '2.5rem',
                                                        fontWeight: 400,
                                                        color: '#1d1d1f',
                                                        cursor: 'pointer',
                                                        transition: 'color 0.2s ease'
                                                    }}
                                                />
                                            </ListItem>
                                        </Link>
                                    ))}
                                </List>
                            </Box>
                        )}
                    </Box>
                )
            }
        </>
    );
}