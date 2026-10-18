import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    Container, Typography, Box, Button, Card, CardContent, CardMedia,
    Grid, TextField, IconButton, Alert, Divider, Paper,
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
import {
    getHomeDeliveryPreference,
    saveHomeDeliveryPreference
} from '../utils/cookieManager';
import { getCartItemDisplayName } from '../utils/cartDisplayName';
import { getProductPath } from '../utils/productSlug';
import { trackInitiateCheckout } from '../analytics/metaTracking';
import { trackGa4BeginCheckout } from '../analytics/ga4Tracking';
import { useGifts } from '../gifts/GiftContext';
import GiftCartProductCards from '../gifts/GiftCartProductCards';
import BannerSlot from '../banners/BannerSlot';
import PriceDisplay from '../components/PriceDisplay';
import BundleImage from '../components/BundleImage';
import {
    BundleCartComponentLines,
    useBundleCartDisplay
} from '../components/BundleCartLine';
import { getCartLinePricing } from '../utils/productPricing';
import { isBundleCartItem, cartHasUnavailableItems } from '../utils/bundleCart';

function CartPageBundleCard({ item, isHebrew, t, onRemove, onUpdateQuantity }) {
    const { path, name, imageBundle, pending } = useBundleCartDisplay(item);
    return (
        <CartPageCardShell
            item={item}
            isHebrew={isHebrew}
            t={t}
            onRemove={onRemove}
            onUpdateQuantity={onUpdateQuantity}
            imagePath={path}
            displayName={name}
            imageNode={(
                <Box sx={{
                    height: { xs: 200, sm: 220, md: 240 },
                    width: '100%',
                    overflow: 'hidden',
                    cursor: 'pointer'
                }}>
                    {!pending && <BundleImage bundle={imageBundle} alt={name} />}
                </Box>
            )}
            nameExtra={<BundleCartComponentLines item={item} sx={{ mt: 0.5 }} />}
            dimmed={item.available === false}
        />
    );
}

function CartPageProductCard({ item, isHebrew, t, onRemove, onUpdateQuantity }) {
    const displayName = getCartItemDisplayName(item, isHebrew);
    return (
        <CartPageCardShell
            item={item}
            isHebrew={isHebrew}
            t={t}
            onRemove={onRemove}
            onUpdateQuantity={onUpdateQuantity}
            imagePath={getProductPath(item)}
            displayName={displayName}
            imageNode={(
                <CardMedia
                    component="img"
                    height={{ xs: 200, sm: 220, md: 240 }}
                    image={
                        (item.selectedColor && item.selectedColor.mainImage)
                            ? item.selectedColor.mainImage
                            : (item.homepageimage || '/logo.png')
                    }
                    alt={displayName}
                    sx={{
                        objectFit: 'cover',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.02)' }
                    }}
                />
            )}
        />
    );
}

function CartPageCardShell({
    item, isHebrew, t, onRemove, onUpdateQuantity,
    imagePath, displayName, imageNode, nameExtra = null, dimmed = false
}) {
    return (
        <Card sx={{
            mb: 2,
            backgroundColor: 'transparent',
            border: '1px solid rgba(229, 90, 61, 1)',
            boxShadow: 'none',
            borderRadius: 2,
            overflow: 'hidden',
            maxWidth: { xs: '250px', md: '400px' },
            width: '100%',
            mx: 'auto',
            opacity: dimmed ? 0.85 : 1
        }}>
            <Grid container sx={{ width: '100%' }}>
                <Grid item xs={12} sm={4} md={3}>
                    <Link to={imagePath} style={{ textDecoration: 'none' }}>
                        {imageNode}
                    </Link>
                </Grid>

                <Grid item xs={12} sm={8} md={9} sx={{ width: '100%' }}>
                    <CardContent sx={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: { xs: '100px', sm: '220px', md: '240px' },
                        p: 0
                    }}>
                        <Box sx={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '100%',
                            p: 3
                        }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                borderBottom: '1px solid rgba(216, 71, 42, 0.38)',
                                pb: 2,
                                mb: 1
                            }}>
                                <Typography variant="body1" sx={{
                                    fontWeight: '500',
                                    fontSize: { xs: '1.1rem', sm: '1.5rem' }
                                }}>
                                    <PriceDisplay
                                        pricing={getCartLinePricing(item)}
                                        finalSx={{ color: 'inherit', fontWeight: 600 }}
                                    />
                                </Typography>

                                <Box sx={{
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    maxWidth: '60%',
                                    textAlign: 'right'
                                }}>
                                    <Typography
                                        component={Link}
                                        to={imagePath}
                                        variant="h6"
                                        sx={{
                                            fontWeight: '500',
                                            fontSize: { xs: '1.1rem', sm: '1.5rem' },
                                            lineHeight: '1.1',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            display: 'block',
                                            '&:hover': { color: '#d8472a' }
                                        }}
                                    >
                                        {displayName}
                                    </Typography>
                                    {nameExtra}
                                </Box>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <IconButton
                                    onClick={() => onUpdateQuantity(item.uniqueId || item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    size="small"
                                    sx={{ '&:hover': { color: ' #d8472a' } }}
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
                                    sx={{ '&:hover': { color: '#d8472a' } }}
                                >
                                    <AddIcon />
                                </IconButton>
                            </Box>

                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                                borderTop: '1px solid rgba(216, 71, 42, 0.38)',
                                pt: 1,
                                mb: -3,
                                mt: 1
                            }}>
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
                                        <PriceDisplay
                                            regularPrice={getCartLinePricing(item).regularPrice * item.quantity}
                                            finalPrice={getCartLinePricing(item).finalPrice * item.quantity}
                                            finalSx={{ color: 'inherit' }}
                                        />
                                    </Typography>
                                </Box>

                                <IconButton
                                    onClick={() => onRemove(item.uniqueId || item.id)}
                                    size="small"
                                    sx={{
                                        color: '#d8472a',
                                        '&:hover': {
                                            backgroundColor: 'rgba(229, 90, 61, 1)',
                                            color: 'rgb(236, 230, 229)',
                                        }
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
    );
}

function CartPageLineCard({ item, isBundle, isHebrew, t, onRemove, onUpdateQuantity }) {
    if (isBundle) {
        return (
            <CartPageBundleCard
                item={item}
                isHebrew={isHebrew}
                t={t}
                onRemove={onRemove}
                onUpdateQuantity={onUpdateQuantity}
            />
        );
    }
    return (
        <CartPageProductCard
            item={item}
            isHebrew={isHebrew}
            t={t}
            onRemove={onRemove}
            onUpdateQuantity={onUpdateQuantity}
        />
    );
}

export default function CartPage({ cart, onRemove, onUpdateQuantity }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const { ensureGiftsBeforeCheckout } = useGifts();
    const [pricesChanged, setPricesChanged] = useState(() => !!location.state?.pricesChanged);

    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [homeDelivery, setHomeDeliveryState] = useState(() => getHomeDeliveryPreference());

    const setHomeDelivery = (enabled) => {
        setHomeDeliveryState(enabled);
        saveHomeDeliveryPreference(enabled);
    };

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = subtotal - discount;

    // Apply coupon
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError(t.enterCouponCodeRequired);
            return;
        }

        setIsLoading(true);
        setCouponError('');

        try {
            const response = await fetch(`${API_ENDPOINTS.coupons}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    totalAmount: subtotal,
                    hasBundles: cart.some((item) => isBundleCartItem(item))
                })
            });

            const data = await response.json();

            if (data.success) {
                setAppliedCoupon(data);
                setCouponCode('');
            } else {
                setCouponError(
                    (isHebrew
                        ? (data.message_he || data.message)
                        : (data.message_en || data.message))
                    || t.couponNotFound
                );
            }
        } catch (error) {
            setCouponError(t.networkErrorRetry);
        } finally {
            setIsLoading(false);
        }
    };

    // Remove coupon
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    // Continue to payment
    const handleContinueToPayment = () => {
        if (cart.length === 0) return;
        if (cartHasUnavailableItems(cart)) return;

        const proceed = () => {
            saveHomeDeliveryPreference(homeDelivery);

            const finalTotal = total + (homeDelivery && subtotal < 350 ? 35 : 0);
            const numItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

            try {
                trackInitiateCheckout({
                    items: cart,
                    value: finalTotal,
                    numItems
                });
            } catch (_) {
                // Tracking must never block checkout
            }

            try {
                trackGa4BeginCheckout({
                    items: cart,
                    value: finalTotal,
                    currency: 'ILS'
                });
            } catch (_) {
                // Tracking must never block checkout
            }

            navigate('/payment', {
                state: {
                    cart: cart,
                    subtotal: subtotal,
                    discount: discount,
                    total: total,
                    appliedCoupon: appliedCoupon,
                    homeDelivery: homeDelivery,
                    finalTotal
                }
            });
        };

        ensureGiftsBeforeCheckout(proceed);
    };

    if (cart.length === 0) {
        return (
            <Container maxWidth="md" sx={{ pt: 15, pb: 8, textAlign: 'center' }}>
                <Helmet>
                    <meta name="robots" content="noindex, follow" />
                </Helmet>
                <Box
                    component="img"
                    src="/empty_bag.webp"
                    alt={t.emptyCartAlt}
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
            <Helmet>
                <meta name="robots" content="noindex, follow" />
            </Helmet>
            <BannerSlot placement="cart" />
            {pricesChanged && (
                <Alert
                    severity="info"
                    onClose={() => setPricesChanged(false)}
                    sx={{ mt: 8, mb: -4, mx: 'auto', maxWidth: 720, direction: isHebrew ? 'rtl' : 'ltr' }}
                >
                    {t.cartPricesUpdated}
                </Alert>
            )}
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
                        {cart.map((item) => {
                            const isBundle = isBundleCartItem(item);
                            return (
                            <React.Fragment key={item.uniqueId || item.id}>
                            <CartPageLineCard
                                item={item}
                                isBundle={isBundle}
                                isHebrew={isHebrew}
                                t={t}
                                onRemove={onRemove}
                                onUpdateQuantity={onUpdateQuantity}
                            />
                            <GiftCartProductCards item={item} />
                            </React.Fragment>
                            );
                        })}
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
                                    <Alert
                                        severity="success"
                                        onClose={handleRemoveCoupon}
                                        sx={{
                                            mt: 2.5,
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            textAlign: isHebrew ? 'right' : 'left',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            '& .MuiAlert-message': {
                                                flex: 1,
                                                fontWeight: 600,
                                                pr: isHebrew ? 0 : 1,
                                                pl: isHebrew ? 1 : 0
                                            },
                                            '& .MuiAlert-action': {
                                                marginInlineStart: 1.5,
                                                marginInlineEnd: 0,
                                                padding: 0,
                                                alignItems: 'center'
                                            },
                                            '& .MuiAlert-action .MuiIconButton-root': {
                                                color: 'inherit',
                                                padding: 0.5,
                                                backgroundColor: 'transparent',
                                                '&:hover': {
                                                    backgroundColor: 'transparent',
                                                    color: '#e8dcc8'
                                                }
                                            }
                                        }}
                                    >
                                        {`${t.couponAppliedPrefix}${Number(appliedCoupon.discountAmount).toFixed(2)}`}
                                    </Alert>
                                )}

                                {couponError && (
                                    <Alert
                                        severity="error"
                                        icon={false}
                                        sx={{
                                            mt: 1,
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            textAlign: isHebrew ? 'right' : 'left'
                                        }}
                                    >
                                        {couponError}
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
                                    {/* Free Delivery Message (when total >= 350) */}
                                    {subtotal >= 350 && (
                                        <>
                                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5, mb: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        backgroundColor: 'rgba(229, 90, 61, 1)',
                                                        borderRadius: 2,
                                                        px: 2,
                                                        py: 1,
                                                        textAlign: 'center',
                                                        width: 'fit-content'
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: 'white',
                                                            textAlign: 'center',
                                                            direction: isHebrew ? 'rtl' : 'ltr',
                                                            fontSize: { xs: '0.9rem', md: '1.1rem' }
                                                        }}
                                                    >
                                                        {t.youHaveHomeDelivery}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'rgb(21, 20, 20)',
                                                    mt: 2.5,
                                                    mb: 1.1,
                                                    textAlign: 'center',
                                                    direction: isHebrew ? 'rtl' : 'ltr',
                                                    fontSize: { xs: '0.9rem', md: '1rem' },
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                {t.deliveryTime}
                                            </Typography>
                                        </>
                                    )}
                                    {subtotal < 350 && (
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
                                            {t.freeDeliveryOver350}
                                        </Typography>
                                    )}

                                    {/* Delivery Selection Button (when total < 350) */}
                                    {subtotal < 350 && (

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
                                                    ? t.homeDeliverySelected
                                                    : t.addHomeDelivery
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

                                    {homeDelivery && subtotal < 350 && (
                                        <Typography
                                            variant="body2"
                                            color="rgb(21, 20, 20)"
                                            sx={{
                                                mt: 1.5,
                                                textAlign: 'center',
                                                direction: isHebrew ? 'rtl' : 'ltr',
                                                fontSize: { xs: '0.9rem', md: '1rem' },
                                                fontWeight: 'bold',
                                                pb: 0.5
                                            }}
                                        >
                                            {t.deliveryTime}
                                        </Typography>
                                    )}

                                    {/* Pickup Text and Free Delivery Info - Only show when no delivery and total < 350 */}
                                    {!homeDelivery && subtotal < 350 && (
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
                                                {t.selfCollectionInfo}
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
                                        ₪{(total + (homeDelivery && subtotal < 350 ? 35 : 0)).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Continue to Payment Button */}
                            {cartHasUnavailableItems(cart) && (
                                <Alert severity="warning" sx={{ mb: 1.5, direction: isHebrew ? 'rtl' : 'ltr' }}>
                                    {t.cartHasUnavailableItems}
                                </Alert>
                            )}
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleContinueToPayment}
                                disabled={cart.length === 0 || cartHasUnavailableItems(cart)}
                                startIcon={<PaymentIcon />}
                                sx={{
                                    backgroundColor: 'rgba(229, 90, 61, 1)',
                                    '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' },
                                    py: 1.5,
                                    '&:disabled': {
                                        backgroundColor: '#ccc',
                                        color: '#999'
                                    }
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