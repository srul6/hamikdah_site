import React, { useState, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, IconButton, Badge, Box, MenuItem
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../api/products';

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

    useEffect(() => {
        fetchProducts().then(setProducts);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setIsScrolled(scrollTop > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleProductsHover = () => {
        setIsExpanded(true);
    };

    const handleHeaderLeave = () => {
        setIsExpanded(false);
    };

    const handleProductClick = (productId) => {
        setIsExpanded(false);
    };

    return (
        <>
            <style>{slideDownAnimation}</style>
            <AppBar
                position="fixed"
                onMouseLeave={handleHeaderLeave}
                sx={{
                    backgroundColor: 'rgba(245, 240, 227, 0.9)', // Changed to match site background #f5f0e3
                    backdropFilter: 'blur(25px)', // Enhanced blur
                    boxShadow: isScrolled ? '0 2px 20px rgba(0, 0, 0, 0.41)' : 'none', // Subtle shadow when scrolled
                    border: 'none',
                    margin: '16px auto', // Center with auto margins
                    marginTop: '8px',
                    borderRadius: '15px',
                    width: 'calc(100% - 45px)', // Reduced from 32px to 128px (64px on each side)
                    top: '12px',
                    zIndex: 1000,
                    left: '0',
                    right: '0',
                    transition: 'all 0.3s ease'
                }}
            >
                <Toolbar sx={{
                    justifyContent: 'space-between',
                    py: 0.5, // Reduced from 1.5 to 1
                    minHeight: '50px' // Reduced from 60px to 50px
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

                    {/* Products Menu */}
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%'
                        }}
                        onMouseEnter={handleProductsHover}
                        onMouseLeave={handleHeaderLeave}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                color: '#1d1d1f', // Changed to dark color for white background
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' },
                                fontWeight: 400,
                                cursor: 'pointer',
                                textShadow: 'none', // Removed text shadow
                                transition: 'color 0.2s ease',
                                '&:hover': {
                                    color: 'rgba(199, 61, 34, 1)'
                                }
                            }}
                        >
                            מוצרים
                        </Typography>
                    </Box>

                    {/* Cart Icon */}
                    <Link to="/cart" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <IconButton
                            sx={{
                                color: 'rgba(173, 153, 103, 0.9)', // Changed to dark color for white background
                                textShadow: 'none', // Removed text shadow
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
                        onMouseLeave={handleHeaderLeave}
                        sx={{
                            backgroundColor: 'rgba(245, 240, 227, 0.95)', // Changed to match navbar background
                            backdropFilter: 'blur(25px)', // Enhanced blur
                            borderTop: '1px solid rgba(0, 0, 0, 0.1)', // Changed border color
                            height: 'auto',
                            maxHeight: '300px',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            py: 2,
                            opacity: 1,
                            visibility: 'visible',
                            display: 'flex',
                            justifyContent: 'center',
                            backdropFilter: 'blur(25px)', // Enhanced blur
                            borderBottomLeftRadius: '20px',
                            borderBottomRightRadius: '20px',
                            animation: 'slideDown 0.3s ease',
                            boxShadow: 'none' // Removed shadow effect
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
                                    <MenuItem
                                        onClick={() => handleProductClick(product.id)}
                                        sx={{
                                            color: '#1d1d1f', // Changed to dark color for white background
                                            fontWeight: 400,
                                            fontSize: '0.95rem',
                                            py: 1.5,
                                            px: 3,
                                            borderRadius: '8px',
                                            mx: 2,
                                            transition: 'color 0.2s ease',
                                            textShadow: 'none', // Removed text shadow
                                            backgroundColor: 'transparent',
                                            textAlign: 'center',
                                            justifyContent: 'center',
                                            '&:hover': {
                                                color: 'rgba(199, 61, 34, 1)',
                                                backgroundColor: 'transparent'
                                            }
                                        }}
                                    >
                                        <Link
                                            to={`/product/${product.id}`}
                                            style={{
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                width: '100%',
                                                textAlign: 'center'
                                            }}
                                        >
                                            {product.name}
                                        </Link>
                                    </MenuItem>
                                    {index < products.length - 1 && (
                                        <Box
                                            sx={{
                                                height: '1px',
                                                backgroundColor: 'rgba(0, 0, 0, 0.1)', // Changed to dark color
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