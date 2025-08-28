import React, { useState, useEffect, useRef } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Badge, Box, MenuItem
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../api/products';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

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
`;

export default function Navbar({ cartCount }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [products, setProducts] = useState([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const { language, toggleLanguage, isHebrew } = useLanguage();
    const t = translations[language];

    const menuRef = useRef(null);
    const buttonRef = useRef(null);
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
            if (isExpanded) {
                const isClickInsideMenu = menuRef.current && menuRef.current.contains(event.target);
                const isClickInsideButton = buttonRef.current && buttonRef.current.contains(event.target);

                if (!isClickInsideMenu && !isClickInsideButton) {
                    setIsExpanded(false);
                }
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isExpanded]);

    const handleProductsHover = () => {
        if (!isMobile && !isExpanded) {
            setIsExpanded(true);
        }
    };

    const handleHeaderLeave = () => {
        if (!isMobile) setIsExpanded(false);
    };

    const handleProductClick = () => {
        setIsExpanded(false);
    };

    const handleProductsClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isMobile) {
            // Simple toggle for mobile
            setIsExpanded(!isExpanded);
        } else {
            // On desktop, just open the menu if it's not already open
            if (!isExpanded) {
                setIsExpanded(true);
            }
        }
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
                    minHeight: '50px'
                }}>
                    {/* Logo */}
                    <Link to="/" style={{ textDecoration: 'none', marginTop: '8px', color: 'inherit' }}>
                        <img
                            src="/logo.png"
                            alt="Store"
                            style={{
                                height: '30px',
                                width: '70px',
                                objectFit: 'cover'
                            }}
                        />
                    </Link>

                    {/* Products Menu and Language Switcher */}
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                            gap: 1
                        }}
                    >
                        <Box
                            ref={buttonRef}
                            onMouseEnter={handleProductsHover}
                            onClick={handleProductsClick}
                        >
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#1d1d1f',
                                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' },
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
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                                fontWeight: 400,
                                mx: 0
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
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' },
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

                    {/* Cart Icon */}
                    <Link to="/cart" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <IconButton
                            sx={{
                                color: 'rgba(173, 153, 103, 0.9)',
                                transition: 'color 0.2s ease',
                                '&:hover': {
                                    color: 'rgba(199, 61, 34, 1)'
                                }
                            }}
                        >
                            <Badge badgeContent={cartCount} color="error">
                                <ShoppingCartIcon />
                            </Badge>
                        </IconButton>
                    </Link>
                </Toolbar>

                {/* Expanding Menu */}
                {isExpanded && (
                    <Box
                        ref={menuRef}
                        sx={{
                            backgroundColor: 'rgba(245, 240, 227, 0.95)',
                            backdropFilter: 'blur(25px)',
                            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                            height: 'auto',
                            maxHeight: '300px',
                            overflow: 'visible',
                            transition: 'all 0.3s ease',
                            py: 2,
                            opacity: 1,
                            visibility: 'visible',
                            display: 'flex',
                            justifyContent: 'center',

                            animation: 'slideDown 0.3s ease',
                            position: 'relative',
                            zIndex: 1001,
                            borderRadius: '0 0 15px 15px',

                            marginTop: '-1px', // Remove gap between navbar and menu
                            '@media (max-width: 768px)': {
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                width: '100%',
                                maxHeight: '70vh',
                                overflowY: 'auto',
                                marginTop: '-1px' // Remove gap on mobile too
                            }
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            width: '100%',
                            maxWidth: '400px'
                        }}>
                            {products.map((product, index) => (
                                <div key={product.id}>
                                    <Link
                                        to={`/product/${product.id}`}
                                        style={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            width: '100%',
                                            textAlign: 'center'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProductClick();
                                        }}
                                    >
                                        <MenuItem
                                            sx={{
                                                color: '#1d1d1f',
                                                fontWeight: 400,
                                                fontSize: '0.95rem',
                                                py: 1.5,
                                                px: 3,
                                                borderRadius: '8px',
                                                mx: 2,
                                                transition: 'color 0.2s ease',
                                                backgroundColor: 'transparent',
                                                textAlign: 'center',
                                                justifyContent: 'center',
                                                '&:hover': {
                                                    color: 'rgba(199, 61, 34, 1)',
                                                    backgroundColor: 'transparent'
                                                }
                                            }}
                                        >
                                            {isHebrew ? product.name_he : product.name_en}
                                        </MenuItem>
                                    </Link>
                                    {index < products.length - 1 && (
                                        <Box
                                            sx={{
                                                height: '1px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                mx: 3,
                                                my: 0.5
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </Box>
                    </Box>
                )}
            </AppBar>
        </>
    );
}