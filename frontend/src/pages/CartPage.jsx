import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container, Typography, Box, Button, Card, CardContent, CardMedia,
    Grid, TextField, IconButton, Alert, Chip, Divider, Paper,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
    InputLabel, Select, MenuItem, InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
    LocalOffer as CouponIcon,
    ShoppingCart as CartIcon,
    Payment as PaymentIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { API_ENDPOINTS } from '../config';

export default function CartPage({ cart, onRemove, onUpdateQuantity }) {
    const navigate = useNavigate();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [homeDelivery, setHomeDelivery] = useState(false);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = subtotal - discount;

    // Apply coupon
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setIsLoading(true);
        setCouponError('');
        setCouponSuccess('');

        try {
            const response = await fetch(`${API_ENDPOINTS.coupons}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    totalAmount: subtotal
                })
            });

            const data = await response.json();

            if (data.success) {
                setAppliedCoupon(data);
                setCouponSuccess(`Coupon applied! You saved ₪${data.discountAmount.toFixed(2)}`);
                setCouponCode('');
            } else {
                setCouponError(data.message || 'Failed to apply coupon');
            }
        } catch (error) {
            setCouponError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Remove coupon
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponSuccess('');
        setCouponError('');
    };

    // Continue to payment
    const handleContinueToPayment = () => {
        if (cart.length === 0) return;

        navigate('/payment', {
            state: {
                cart: cart,
                subtotal: subtotal,
                discount: discount,
                total: total,
                appliedCoupon: appliedCoupon,
                homeDelivery: homeDelivery,
                finalTotal: total + (homeDelivery && subtotal < 499 ? 30 : 0)
            }
        });
    };

    if (cart.length === 0) {
        return (
            <Container maxWidth="md" sx={{ pt: 15, pb: 8, textAlign: 'center' }}>
                <Box
                    component="img"
                    src="/empty_bag.png"
                    alt="Empty cart"
                    sx={{
                        width: { xs: '150px', sm: '200px', md: '250px' },
                        height: 'auto',
                        mb: 2,
                        mx: 'auto',
                        display: 'block'
                    }}
                />
                <Typography variant="h5" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                    {t.cartEmpty}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                    {t.cartEmptyMessage}
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/')}
                    startIcon={isHebrew ? <ArrowBackIcon /> : null}
                    endIcon={!isHebrew ? <ArrowForwardIcon /> : null}
                    sx={{
                        backgroundColor: 'rgba(229, 90, 61, 1)',
                        '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' }
                    }}
                >
                    {t.continueShopping}
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Typography variant="h3" gutterBottom sx={{
                textAlign: 'center',
                mt: 8,
                mb: 4,
                direction: isHebrew ? 'rtl' : 'ltr',
                color: 'rgba(229, 90, 61, 1)'
            }}>
                {t.shoppingCart}
            </Typography>

            <Grid container spacing={6} justifyContent="center">
                {/* Cart Items */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {cart.map((item) => (
                            <Card key={item.id} sx={{
                                mb: 2,
                                backgroundColor: 'transparent', // Transparent background
                                border: '1px solid rgba(229, 90, 61, 1)', // Same color as cart text
                                boxShadow: 'none', // Remove shadow since we have border
                                borderRadius: 2,
                                overflow: 'hidden',
                                maxWidth: { xs: '250px', md: '400px' }, // 250px mobile, 400px desktop
                                width: '100%', // Ensure cards take full available width up to max
                                mx: 'auto', // Center the card horizontally
                            }}>
                                <Grid container sx={{ width: '100%' }}>
                                    {/* Product Image */}
                                    <Grid item xs={12} sm={4} md={3}>
                                        <Link to={`/product/${item.id}`} style={{ textDecoration: 'none' }}>
                                            <CardMedia
                                                component="img"
                                                height={{ xs: 200, sm: 220, md: 240 }}
                                                image={
                                                    (item.selectedColor && item.selectedColor.mainImage) ?
                                                        item.selectedColor.mainImage :
                                                        (item.homepageimage || '/logo.png')
                                                }
                                                alt={item.displayName || (isHebrew ? item.name_he : item.name_en)}
                                                sx={{
                                                    objectFit: 'cover',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'scale(1.02)'
                                                    }
                                                }}
                                            />
                                        </Link>
                                    </Grid>

                                    {/* Product Details */}
                                    <Grid item xs={12} sm={8} md={9} sx={{ width: '100%' }}>
                                        <CardContent sx={{
                                            height: '100%',
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            minHeight: { xs: '100px', sm: '220px', md: '240px' },
                                            p: 0// Remove default padding to use full width
                                        }}>
                                            {/* Single Container for All Product Details */}
                                            <Box sx={{
                                                width: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                height: '100%',
                                                p: 3,


                                                // Add padding to the container instead
                                            }}>
                                                {/* Top Row: Product Name (right) and Price (left) */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    borderBottom: '1px solid rgba(216, 71, 42, 0.38)',
                                                    pb: 2,
                                                    mb: 1
                                                }}>
                                                    {/* Price per unit - Left side */}
                                                    <Typography variant="body1" sx={{
                                                        fontWeight: '500',
                                                        fontSize: { xs: '1.1rem', sm: '1.5rem' }
                                                    }}>
                                                        ₪{item.price.toFixed(2)}
                                                    </Typography>

                                                    {/* Product Name - Right side */}
                                                    <Typography variant="h6" sx={{
                                                        direction: isHebrew ? 'rtl' : 'ltr',
                                                        maxWidth: '60%',
                                                        fontWeight: '500',
                                                        fontSize: { xs: '1.1rem', sm: '1.5rem' },
                                                        lineHeight: '1.1',
                                                        textAlign: 'right',
                                                    }}>
                                                        {item.displayName || (isHebrew ? item.name_he : item.name_en)}
                                                    </Typography>


                                                </Box>

                                                {/* Middle Row: Quantity Controls */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',

                                                }}>
                                                    <IconButton
                                                        onClick={() => onUpdateQuantity(item.uniqueId || item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        size="small"
                                                        sx={{
                                                            '&:hover': { color: ' #d8472a' }
                                                        }}
                                                    >
                                                        <RemoveIcon />
                                                    </IconButton>

                                                    <Typography variant="h6" sx={{
                                                        minWidth: '40px',
                                                        textAlign: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: { xs: '1rem', sm: '1.45rem' }
                                                    }}>
                                                        {item.quantity}
                                                    </Typography>

                                                    <IconButton
                                                        onClick={() => onUpdateQuantity(item.uniqueId || item.id, item.quantity + 1)}
                                                        size="small"
                                                        sx={{
                                                            '&:hover': { color: '#d8472a' }
                                                        }}
                                                    >
                                                        <AddIcon />
                                                    </IconButton>
                                                </Box>

                                                {/* Bottom Row: Total (left) and Delete Button (right) */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-end',
                                                    borderTop: '1px solid rgba(216, 71, 42, 0.38)',
                                                    pt: 1,
                                                    mb: -3,
                                                    mt: 1

                                                }}>
                                                    {/* Total Price - Left side, aligned under unit price */}
                                                    <Box sx={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start'
                                                    }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{
                                                            direction: isHebrew ? 'rtl' : 'ltr',
                                                            mb: { xs: -0.5, sm: -1 },
                                                            fontSize: { xs: '0.75rem', sm: '1rem' }
                                                        }}>
                                                            {t.total}
                                                        </Typography>
                                                        <Typography variant="h6" color="#d8472a" fontWeight="bold" sx={{
                                                            fontSize: { xs: '1.1rem', sm: '1.5rem' }
                                                        }}>
                                                            ₪{(item.price * item.quantity).toFixed(2)}
                                                        </Typography>
                                                    </Box>

                                                    {/* Delete Button - Right side, aligned under product name */}
                                                    <IconButton
                                                        onClick={() => onRemove(item.uniqueId || item.id)}
                                                        size="small"
                                                        sx={{
                                                            color: '#d8472a',
                                                            '&:hover': { backgroundColor: '#d8472a' }
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Grid>
                                </Grid>
                            </Card>
                        ))}
                    </Box>
                </Grid>

                {/* Order Summary */}
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        position: 'sticky', // Make the Box container sticky
                        top: 150, // Position below navbar (increased to avoid overlap)
                        Button: 250,
                        zIndex: 100, // Ensure it's above other content
                        alignSelf: 'flex-start' // Important for sticky to work in flex containers
                    }}>
                        <Paper elevation={3} sx={{
                            p: 3, // Smaller padding on mobile
                            borderRadius: 2,
                            marginTop: { xs: -2, md: 0 },
                            maxWidth: { xs: '260px', md: '350px' }, // Smaller width on mobile
                            width: '100%'
                        }}>
                            <Typography variant="h5" gutterBottom sx={{
                                mb: { xs: 2, md: 3 },
                                textAlign: 'center', // Smaller margin on mobile
                                direction: isHebrew ? 'rtl' : 'ltr',
                                color: 'rgba(229, 90, 61, 1)',
                                fontSize: { xs: '1.5rem', md: '2rem' } // Smaller font on mobile
                            }}>
                                {t.orderSummary}
                            </Typography>

                            {/* Coupon Section */}
                            <Box sx={{ mb: { xs: 2, md: 2 } }}>

                                {!appliedCoupon ? (
                                    <Box sx={{
                                        mt: 2.5,
                                        display: 'flex',
                                        gap: 1,
                                        flexDirection: isHebrew ? 'row-reverse' : 'row' // Reverse order for Hebrew
                                    }}>
                                        <TextField
                                            fullWidth

                                            size="small"
                                            placeholder={t.enterCouponCode}
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                            sx={{
                                                direction: isHebrew ? 'rtl' : 'ltr',
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: couponCode ? '#d8472a' : '#ccc', // Orange when typing, gray when empty
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: '#d8472a', // Orange on hover
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#d8472a', // Orange when focused
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="outlined"
                                            onClick={handleApplyCoupon}
                                            disabled={isLoading || !couponCode.trim()}
                                            size="small"
                                            sx={{
                                                direction: isHebrew ? 'rtl' : 'ltr',
                                                color: '#d8472a', // Orange color for the checkmark
                                                borderColor: '#d8472a', // Orange border
                                                minWidth: '40px', // Reduce button width
                                                width: '40px', // Fixed width for compact appearance
                                                '&:hover': {
                                                    borderColor: '#b83a22', // Darker orange on hover
                                                    backgroundColor: 'rgba(216, 71, 42, 0.1)' // Light orange background on hover
                                                }
                                            }}
                                        >
                                            {isLoading ? '...' : '✓'}
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={`${appliedCoupon.coupon.code} - ₪${appliedCoupon.discountAmount.toFixed(2)} off`}
                                            color="success"
                                            onDelete={handleRemoveCoupon}
                                        />
                                    </Box>
                                )}

                                {couponError && (
                                    <Alert severity="error" sx={{ mt: 1 }}>
                                        {couponError}
                                    </Alert>
                                )}

                                {couponSuccess && (
                                    <Alert severity="success" sx={{ mt: 1 }}>
                                        {couponSuccess}
                                    </Alert>
                                )}
                            </Box>

                            <Divider sx={{}} />

                            {/* Price Breakdown */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                    mt: 1,
                                    flexDirection: isHebrew ? 'row-reverse' : 'row' // Reverse order for Hebrew
                                }}>
                                    <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>{t.subtotal}:</Typography>
                                    <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>₪{subtotal.toFixed(2)}</Typography>
                                </Box>

                                {appliedCoupon && (
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        mb: 1,
                                        flexDirection: isHebrew ? 'row-reverse' : 'row' // Reverse order for Hebrew
                                    }}>
                                        <Typography color="success.main" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>{t.discount}:</Typography>
                                        <Typography color="success.main" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>-₪{discount.toFixed(2)}</Typography>
                                    </Box>
                                )}

                                <Divider sx={{}} />

                                {/* Home Delivery Section */}
                                <Box sx={{ mb: 1.5, mt: 1.5 }}>
                                    {/* Free Delivery Message (when total >= 499) */}
                                    {subtotal >= 499 && (
                                        <Typography
                                            variant="body2"
                                            color="rgba(229, 90, 61, 1)"
                                            sx={{
                                                mb: 0.5,
                                                textAlign: 'center',
                                                direction: isHebrew ? 'rtl' : 'ltr',
                                                fontSize: { xs: '1rem', md: '1.2rem' }
                                            }}
                                        >
                                            {isHebrew ? 'יש לך משלוח עד הבית!' : 'You have home delivery!'}
                                        </Typography>
                                    )}
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 1,
                                            textAlign: 'center',
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            fontSize: { xs: '0.8rem', md: '0.9rem' },
                                        }}
                                    >
                                        {isHebrew ? 'קנייה מעל ₪499 מזכה במשלוח חינם' : 'Purchase over ₪499 qualifies for free delivery'}
                                    </Typography>

                                    {/* Delivery Selection Button (when total < 499) */}
                                    {subtotal < 499 && (

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: 1
                                        }}>


                                            <Button
                                                variant={homeDelivery ? "contained" : "outlined"}
                                                size="small"
                                                onClick={() => setHomeDelivery(!homeDelivery)}
                                                sx={{
                                                    backgroundColor: homeDelivery ? '#d8472a' : 'transparent',
                                                    color: homeDelivery ? 'white' : '#d8472a',
                                                    borderColor: '#d8472a',
                                                    '&:hover': {
                                                        backgroundColor: homeDelivery ? 'rgba(229, 90, 61, 1)' : 'rgba(216, 71, 42, 0.1)',
                                                        borderColor: '#b83a22'
                                                    },
                                                    fontSize: { xs: '0.8rem', md: '0.9rem' },
                                                    px: 2,
                                                    py: 0.5
                                                }}
                                            >
                                                {homeDelivery
                                                    ? (isHebrew ? '!יש לך משלוח עד הבית' : 'Home Delivery Selected')
                                                    : (isHebrew ? '(הוסף משלוח עד הבית +₪30)' : 'Add Home Delivery (+₪30)')
                                                }
                                            </Button>

                                            {/* Cancel Button - Only show when delivery is selected */}
                                            {homeDelivery && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => setHomeDelivery(false)}
                                                    sx={{
                                                        color: '#666',
                                                        borderColor: '#666',
                                                        minWidth: '32px',
                                                        width: '32px',
                                                        height: '32px',
                                                        p: 0,
                                                        '&:hover': {
                                                            borderColor: '#333',
                                                            backgroundColor: 'rgba(102, 102, 102, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    ✕
                                                </Button>
                                            )}
                                        </Box>
                                    )}

                                    {/* Pickup Text and Free Delivery Info - Only show when no delivery and total < 499 */}
                                    {!homeDelivery && subtotal < 499 && (
                                        <>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mb: 0.5,
                                                    textAlign: 'center',
                                                    direction: isHebrew ? 'rtl' : 'ltr',
                                                    fontSize: { xs: '0.8rem', md: '0.9rem' }
                                                }}
                                            >
                                                {isHebrew ? 'איסוף עצמי יתבצע מרחוב העליה 7 נתיבות' : 'Self-collection will be conducted on Aliya Street 7, Netivot'}
                                            </Typography>

                                        </>
                                    )}



                                </Box>

                                <Divider sx={{ my: 1 }} />

                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexDirection: isHebrew ? 'row-reverse' : 'row' // Reverse order for Hebrew
                                }}>
                                    <Typography variant="h6" fontWeight="bold" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>{t.total}:</Typography>
                                    <Typography variant="h6" fontWeight="bold" color="rgba(229, 90, 61, 1)" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                        ₪{(total + (homeDelivery && subtotal < 499 ? 30 : 0)).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Continue to Payment Button */}
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleContinueToPayment}
                                disabled={cart.length === 0}
                                startIcon={<PaymentIcon />}
                                sx={{
                                    backgroundColor: 'rgba(229, 90, 61, 1)',
                                    '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' },
                                    py: 1.5
                                }}
                            >
                                {t.continueToPayment}
                            </Button>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Container >
    );
}