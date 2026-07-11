import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button, Paper, TextField,
    Grid, CircularProgress, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControlLabel, Checkbox
} from '@mui/material';
import { IconButton } from '@mui/material';
import { ArrowBackIosNew, ArrowForwardIos } from '@mui/icons-material';
import { getPaymentForm } from '../api/greenInvoice';
import { useLanguage } from '../contexts/LanguageContext';
import { useFormData } from '../contexts/FormDataContext';
import { useCart } from '../contexts/CartContext';
import { translations } from '../translations/translations';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import {
    getHomeDeliveryPreference,
    saveHomeDeliveryPreference,
    getHomeDeliveryOptOutPreference,
    saveHomeDeliveryOptOutPreference
} from '../utils/cookieManager';
import DOMPurify from 'dompurify';
import { getCartItemDisplayName } from '../utils/cartDisplayName';

/** Max lengths — matches backend `checkoutValidation` (defense in depth with input maxLength). */
const FIELD_MAX_LEN = {
    name: 120,
    email: 254,
    phone: 25,
    street: 200,
    houseNumber: 30,
    apartmentNumber: 30,
    floor: 15,
    city: 100,
    dedication: 500,
    feedback: 500
};

export default function GreenInvoicePayment() {
    const location = useLocation();
    const navigate = useNavigate();
    const { cart: contextCart, isLoading: cartLoading } = useCart();
    const locationState = location.state || {};
    const {
        cart: stateCart,
        subtotal: cartSubtotal,
        discount: stateDiscount,
        total: stateTotal,
        appliedCoupon
    } = locationState;
    const checkoutCart = (Array.isArray(stateCart) && stateCart.length > 0)
        ? stateCart
        : (contextCart || []);
    const { formData: savedFormData, updateField, updateFields } = useFormData();

    const [selectedHomeDelivery, setSelectedHomeDelivery] = useState(
        () => getHomeDeliveryPreference()
    );
    const [homeDeliveryOptOut, setHomeDeliveryOptOut] = useState(
        () => getHomeDeliveryOptOutPreference()
    );

    const updateHomeDelivery = (enabled) => {
        setSelectedHomeDelivery(enabled);
        saveHomeDeliveryPreference(enabled);
    };

    const clearAddressFieldErrors = () => {
        setFieldErrors(prev => ({
            ...prev,
            street: null,
            houseNumber: null,
            city: null,
            apartmentNumber: null,
            floor: null
        }));
    };

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentFormHtml, setPaymentFormHtml] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        dedication: '',
        street: '',
        houseNumber: '',
        apartmentNumber: '',
        floor: '',
        city: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackError, setFeedbackError] = useState(null);

    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const FEEDBACK_MAX_CHARS = FIELD_MAX_LEN.feedback;
    const feedbackMsgTrimmed = feedbackText.trim();
    const feedbackCharCount = feedbackMsgTrimmed.length;
    const feedbackTooLong = feedbackCharCount > FEEDBACK_MAX_CHARS;

    // Single client id + "only once" UX (server also enforces uniqueness)
    const getOrCreateFeedbackClientId = () => {
        try {
            const existing = localStorage.getItem('site_feedback_client_id');
            if (existing && existing.length >= 8) return existing;
            const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
            localStorage.setItem('site_feedback_client_id', id);
            return id;
        } catch (_) {
            return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }
    };

    useEffect(() => {
        try {
            const submitted = localStorage.getItem('site_feedback_submitted') === '1';
            if (submitted) setFeedbackSubmitted(true);
        } catch (_) { /* ignore */ }
    }, []);

    // Load saved form data from cookies on mount
    useEffect(() => {
        if (savedFormData && Object.keys(savedFormData).length > 0) {
            setCustomerInfo(prev => ({
                ...prev,
                ...savedFormData
            }));
        }
    }, [savedFormData]);

    // Redirect if no cart data
    useEffect(() => {
        if (cartLoading) return;
        if (!checkoutCart.length) {
            navigate('/cart');
        }
    }, [checkoutCart, cartLoading, navigate]);

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const orderSubtotal = cartSubtotal ?? checkoutCart.reduce(
        (sum, item) => sum + (Number(item.price || 0) * item.quantity),
        0
    );
    const discount = stateDiscount ?? 0;
    const orderTotal = stateTotal ?? (orderSubtotal - discount);
    const qualifiesForFreeShipping = orderSubtotal >= 350;
    const isHomeDelivery = (qualifiesForFreeShipping && !homeDeliveryOptOut) || selectedHomeDelivery;
    const deliveryFee = selectedHomeDelivery && !qualifiesForFreeShipping ? 35 : 0;
    const displayTotal = orderTotal + deliveryFee;

    const removeHomeDelivery = () => {
        if (qualifiesForFreeShipping) {
            setHomeDeliveryOptOut(true);
            saveHomeDeliveryOptOutPreference(true);
        }
        updateHomeDelivery(false);
        clearAddressFieldErrors();
    };

    const addHomeDelivery = () => {
        if (qualifiesForFreeShipping) {
            setHomeDeliveryOptOut(false);
            saveHomeDeliveryOptOutPreference(false);
        } else {
            updateHomeDelivery(true);
        }
    };

    const toggleHomeDelivery = () => {
        if (isHomeDelivery) {
            removeHomeDelivery();
        } else {
            addHomeDelivery();
        }
    };

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^(?:\+972|972|0)[\d\-\s]{7,10}$|^\+?[1-9]\d{6,14}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    };

    const validateField = (field, value) => {
        if (!value || value.trim() === '') {
            return t.fieldRequired;
        }

        switch (field) {
            case 'email':
                if (!validateEmail(value)) {
                    return t.invalidEmail;
                }
                break;
            case 'phone':
                if (!validatePhone(value)) {
                    return t.invalidPhone;
                }
                break;
            case 'name':
                if (value.trim().length < 2) {
                    return t.nameMinLength;
                }
                break;
            case 'street':
            case 'city':
                if (value.trim().length < 2) {
                    return t.fieldMinLength;
                }
                break;
            case 'houseNumber':
                if (value.trim().length < 1) {
                    return t.houseNumberRequired;
                }
                break;
        }
        return null;
    };

    const handleGetPaymentForm = async () => {
        // Clear previous errors
        setFieldErrors({});
        setError('');

        // Validate all required fields
        const requiredFields = ['name', 'email', 'phone'];
        if (isHomeDelivery) {
            requiredFields.push('street', 'houseNumber', 'city');
        }

        const newFieldErrors = {};
        let hasErrors = false;

        requiredFields.forEach(field => {
            const error = validateField(field, customerInfo[field]);
            if (error) {
                newFieldErrors[field] = error;
                hasErrors = true;
            }
        });

        // Check if terms and conditions are accepted
        if (!termsAccepted) {
            setError(t.acceptTermsRequired);
            return;
        }

        if (hasErrors) {
            setFieldErrors(newFieldErrors);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const items = checkoutCart.map(item => {
                const sc = item.selectedColor;
                const colorNameHe = sc ? (sc.name_he || sc.name || '') : '';
                const colorNameEn = sc ? (sc.name_en || sc.name || '') : '';
                return {
                    id: item.id,
                    name: item.name,
                    name_he: item.name_he,
                    name_en: item.name_en,
                    price: item.price,
                    quantity: item.quantity,
                    color_name_he: colorNameHe,
                    color_name_en: colorNameEn
                };
            });

            const response = await getPaymentForm(items, displayTotal, customerInfo, marketingConsent, {
                couponDiscount: discount || 0,
                deliveryFee
            });

            if (response.success) {
                if (response.paymentFormUrl) {
                    // Redirect to GreenInvoice payment form
                    console.log('Redirecting to payment form URL:', response.paymentFormUrl);
                    window.location.href = response.paymentFormUrl;
                } else if (response.paymentUrl) {
                    // Redirect to GreenInvoice payment page
                    console.log('Redirecting to payment URL:', response.paymentUrl);
                    window.location.href = response.paymentUrl;
                } else if (response.paymentFormHtml) {
                    setPaymentFormHtml(response.paymentFormHtml);
                } else if (response.iframeUrl) {
                    setIframeUrl(response.iframeUrl);
                } else {
                    setError(t.noPaymentFormReceived);
                }
            } else {
                setError(response.message || t.paymentFormCreateFailed);
            }
        } catch (error) {
            console.error('Payment form error:', error);
            setError(error.message || t.paymentFailed);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setCustomerInfo(prev => ({
            ...prev,
            [field]: value
        }));

        // Save to cookies for persistence
        updateField(field, value);

        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleInputBlur = (field) => {
        // Validate field when user leaves the input
        const value = customerInfo[field];
        const error = validateField(field, value);

        if (error) {
            setFieldErrors(prev => ({
                ...prev,
                [field]: error
            }));
        } else {
            // Clear error if field is now valid
            setFieldErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const submitFeedback = async () => {
        const msg = feedbackText.trim();
        if (msg.length < 2) return;
        if (feedbackTooLong) return;

        setFeedbackSubmitting(true);
        setFeedbackError(null);
        setFeedbackSubmitted(true); // hide immediately per requirement
        try {
            const clientId = getOrCreateFeedbackClientId();
            const res = await fetch(API_ENDPOINTS.feedback, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    message: msg,
                    language,
                    email: customerInfo?.email || null
                })
            });

            if (!res.ok) {
                // keep thank-you UX, but record error for debugging
                const data = await res.json().catch(() => ({}));
                setFeedbackError(data?.message || `HTTP ${res.status}`);
            } else {
                try {
                    localStorage.setItem('site_feedback_submitted', '1');
                } catch (_) { /* ignore */ }
            }
        } catch (e) {
            setFeedbackError(e?.message || t.networkError);
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    // Handle payment form submission (this will be called by the embedded form)
    useEffect(() => {
        // Listen for messages from the payment form iframe
        const handleMessage = (event) => {
            // Verify the message is from GreenInvoice/CardCom
            if (event.origin !== 'https://api.greeninvoice.co.il' &&
                event.origin !== 'https://www.greeninvoice.co.il') {
                return;
            }

            const { type, status, formId, documentId } = event.data;

            if (type === 'payment_status') {
                console.log('Payment status update received:', { status, formId, documentId });

                if (status === 'completed' || status === 'approved') {
                    // Payment successful - navigate to success page
                    navigate('/payment/success', {
                        state: {
                            orderId: Date.now(),
                            amount: displayTotal,
                            currency: 'ILS',
                            documentId: documentId
                        }
                    });
                } else if (status === 'failed' || status === 'declined') {
                    // Payment failed
                    setError(t.paymentFailed);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [navigate, displayTotal, t.paymentFailed]);

    // If we have a payment form, show it
    if (paymentFormHtml || iframeUrl) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr', mb: 3 }}>
                        {t.securePayment}
                    </Typography>

                    {paymentFormHtml ? (
                        // Render HTML form directly
                        <Box
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(paymentFormHtml) }}
                            sx={{
                                width: '100%',
                                minHeight: '500px',
                                border: '1px solid #ddd',
                                borderRadius: 2,
                                p: 2
                            }}
                        />
                    ) : iframeUrl ? (
                        // Embed iframe
                        <Box sx={{
                            width: '100%',
                            height: '600px',
                            border: '1px solid #ddd',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                            <iframe
                                src={iframeUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                title={t.cardcomPaymentFormTitle}
                                style={{ border: 'none' }}
                                allow="payment"
                            />
                        </Box>
                    ) : null}

                    {/* Security & Trust Section */}
                    <Box sx={{
                        mt: 6,
                        textAlign: 'center',
                        p: 3,
                        backgroundColor: 'rgba(245, 240, 227, 0.3)',
                        borderRadius: 3,
                        border: '1px solid rgba(229, 90, 61, 0.1)'
                    }}>
                        <Typography variant="body1" sx={{
                            direction: isHebrew ? 'rtl' : 'ltr',
                            color: 'rgba(229, 90, 61, 1)',
                            fontWeight: 600,
                            mb: 1
                        }}>
                            🔒 {t.securePayment}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{
                            direction: isHebrew ? 'rtl' : 'ltr',
                            lineHeight: 1.6
                        }}>
                            {t.securePaymentDescription}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setPaymentFormHtml(null);
                                setIframeUrl(null);
                            }}
                            sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                        >
                            {t.cancel}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            {/* Progress Indicator */}
            <Box sx={{ mt: 8, mb: 6, textAlign: 'center' }}>
                <Typography variant="h3" sx={{
                    color: 'rgba(229, 90, 61, 1)',
                    fontWeight: 600,
                    mb: 0,
                    direction: isHebrew ? 'rtl' : 'ltr'
                }}>
                    {t.completeYourOrder}
                </Typography>
                <Typography variant="h6" sx={{
                    color: 'text.secondary',
                    direction: isHebrew ? 'rtl' : 'ltr'
                }}>
                    {t.checkoutSubtitle}
                </Typography>
            </Box>

            <Paper elevation={8} sx={{
                maxWidth: { xs: '90%', md: '70%' },
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto',
                p: { xs: 3, md: 6 },
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                border: '1px solid rgba(229, 90, 61, 0.1)'
            }}>
                {/* Header Section */}
                <Box sx={{
                    textAlign: 'center',
                    mb: 5,
                    pb: 3,
                    borderBottom: '1px solid rgba(229, 90, 61, 0.1)'
                }}>
                    <Typography variant="h4" sx={{
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 0,
                        color: 'rgba(229, 90, 61, 1)',
                        fontWeight: 600
                    }}>
                        {t.customerInfo}
                    </Typography>
                    <Typography variant="body1" sx={{
                        color: 'text.secondary',
                        direction: isHebrew ? 'rtl' : 'ltr'
                    }}>
                        {t.checkoutCustomerSubtitle}
                    </Typography>
                </Box>

                {/* Field-specific errors are now displayed below each field */}

                {/* Personal Information Section */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 3,
                        color: 'rgba(229, 90, 61, 1)',
                        fontWeight: 600,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 1,
                        fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
                    }}>
                        <Box component="span" sx={{
                            width: { xs: 20, sm: 22, md: 24 },
                            height: { xs: 20, sm: 22, md: 24 },
                            borderRadius: '50%',
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                            fontWeight: 'bold'
                        }}>
                            1
                        </Box>
                        {t.personalInformation}
                    </Typography>

                    <Grid container spacing={2} sx={{
                        direction: isHebrew ? 'rtl' : 'ltr',
                        justifyContent: 'center'
                    }}>
                        <Grid item xs={12} md={6} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: { xs: '100%', md: '70%' }
                        }}>
                            <TextField
                                fullWidth
                                label={t.name}
                                placeholder={t.namePlaceholder}
                                value={customerInfo.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                onBlur={() => handleInputBlur('name')}
                                required
                                variant="outlined"
                                size="small"
                                error={!!fieldErrors.name}
                                inputProps={{
                                    maxLength: FIELD_MAX_LEN.name,
                                    style: { textAlign: isHebrew ? 'right' : 'left' }
                                }}
                                sx={{
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 0.5)'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 1)'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        textAlign: isHebrew ? 'right' : 'ltr'
                                    }
                                }}
                            />
                            {fieldErrors.name && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{
                                        mt: 0.5,
                                        width: '100%',
                                        textAlign: isHebrew ? 'right' : 'left',
                                        fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                    }}
                                >
                                    {fieldErrors.name}
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} md={6} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: { xs: '100%', md: '70%' }
                        }}>
                            <TextField
                                fullWidth
                                label={t.email}
                                placeholder={t.emailPlaceholder}
                                type="email"
                                value={customerInfo.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                onBlur={() => handleInputBlur('email')}
                                required
                                variant="outlined"
                                size="small"
                                error={!!fieldErrors.email}
                                inputProps={{
                                    maxLength: FIELD_MAX_LEN.email,
                                    style: { textAlign: isHebrew ? 'right' : 'left' }
                                }}
                                sx={{
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 0.5)'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 1)'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        textAlign: isHebrew ? 'right' : 'left'
                                    }
                                }}
                            />
                            {fieldErrors.email && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{
                                        mt: 0.5,
                                        width: '100%',
                                        textAlign: isHebrew ? 'right' : 'left',
                                        fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                    }}
                                >
                                    {fieldErrors.email}
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} md={6} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: { xs: '100%', md: '70%' }
                        }}>
                            <TextField
                                fullWidth
                                label={t.phone}
                                placeholder={t.phonePlaceholder}
                                value={customerInfo.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                onBlur={() => handleInputBlur('phone')}
                                required
                                variant="outlined"
                                size="small"
                                error={!!fieldErrors.phone}
                                inputProps={{
                                    maxLength: FIELD_MAX_LEN.phone,
                                    style: { textAlign: isHebrew ? 'right' : 'left' }
                                }}
                                sx={{
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 0.5)'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 1)'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        textAlign: isHebrew ? 'right' : 'left'
                                    }
                                }}
                            />
                            {fieldErrors.phone && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{
                                        mt: 0.5,
                                        width: '100%',
                                        textAlign: isHebrew ? 'right' : 'left',
                                        fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                    }}
                                >
                                    {fieldErrors.phone}
                                </Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} md={6} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: { xs: '100%', md: '70%' }
                        }}>
                            <TextField
                                fullWidth
                                label={t.dedicationLabel}
                                placeholder={t.dedicationPlaceholder}
                                value={customerInfo.dedication}
                                onChange={(e) => handleInputChange('dedication', e.target.value)}
                                onBlur={() => handleInputBlur('dedication')}
                                multiline
                                rows={1}
                                variant="outlined"
                                size="small"
                                inputProps={{
                                    maxLength: FIELD_MAX_LEN.dedication,
                                    style: { textAlign: isHebrew ? 'right' : 'left' }
                                }}
                                sx={{
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 0.5)'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'rgba(229, 90, 61, 1)'
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        textAlign: isHebrew ? 'right' : 'left'
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Delivery Section */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 3,
                        color: 'rgba(229, 90, 61, 1)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
                    }}>
                        <Box component="span" sx={{
                            width: { xs: 20, sm: 22, md: 24 },
                            height: { xs: 20, sm: 22, md: 24 },
                            borderRadius: '50%',
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                            fontWeight: 'bold'
                        }}>
                            2
                        </Box>
                        {t.whatAboutDelivery}
                    </Typography>

                    <Box sx={{ mb: 3, mt: 1.5 }}>
                        <Box sx={{ textAlign: 'center', px: { xs: 0.5, sm: 1 } }}>

                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 1.5,
                                mb: 1.5,
                                mt: 0.5
                            }}>
                                <Button
                                    variant={isHomeDelivery ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={toggleHomeDelivery}
                                    sx={{
                                        backgroundColor: isHomeDelivery ? '#d8472a' : 'transparent',
                                        color: isHomeDelivery ? 'white' : '#d8472a',
                                        borderColor: '#d8472a',
                                        '&:hover': {
                                            backgroundColor: isHomeDelivery ? 'rgba(229, 90, 61, 1)' : 'rgba(216, 71, 42, 0.1)',
                                            borderColor: '#b83a22'
                                        },
                                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                                        px: { xs: 2.5, md: 3 },
                                        py: { xs: 0.75, md: 0.875 },
                                        minHeight: 38
                                    }}
                                >
                                    {isHomeDelivery
                                        ? t.youHaveHomeDelivery
                                        : t.addHomeDelivery}
                                </Button>

                                {isHomeDelivery && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={removeHomeDelivery}
                                        sx={{
                                            color: '#666',
                                            borderColor: '#666',
                                            minWidth: '36px',
                                            width: '36px',
                                            height: '36px',
                                            p: 0,
                                            fontSize: '1rem',
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

                            {!qualifiesForFreeShipping && !isHomeDelivery && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 0.75,
                                        mt: 0.5,
                                        textAlign: 'center',
                                        direction: isHebrew ? 'rtl' : 'ltr',
                                        fontSize: { xs: '0.8rem', md: '0.9rem' }
                                    }}
                                >
                                    {t.freeDeliveryOver350}
                                </Typography>
                            )}

                            {!isHomeDelivery && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 0.75,
                                        mt: 0.5,
                                        textAlign: 'center',
                                        direction: isHebrew ? 'rtl' : 'ltr',
                                        fontSize: { xs: '0.8rem', md: '0.9rem' }
                                    }}
                                >
                                    {t.selfCollectionInfo}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {isHomeDelivery && (
                        <>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: 'rgb(21, 20, 20)',
                                    textAlign: 'center',
                                    mb: 0.5,
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    fontSize: { xs: '0.9rem', md: '1rem' },
                                    fontWeight: 'bold'
                                }}
                            >
                                {t.deliveryTime}
                            </Typography>

                            <Typography variant="body2" sx={{
                                color: 'text.secondary',
                                textAlign: 'center',
                                mb: 3,
                                direction: isHebrew ? 'rtl' : 'ltr',
                                fontStyle: 'italic'
                            }}>
                                {t.fillAddressForDelivery}
                            </Typography>

                            <Grid container spacing={2} sx={{
                                direction: isHebrew ? 'rtl' : 'ltr',
                                justifyContent: 'center'
                            }}>
                                <Grid item xs={12} md={6} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: { xs: '100%', md: '70%' }
                                }}>
                                    <TextField
                                        fullWidth
                                        label={t.street}
                                        placeholder={t.streetPlaceholder}
                                        value={customerInfo.street}
                                        onChange={(e) => handleInputChange('street', e.target.value)}
                                        onBlur={() => handleInputBlur('street')}
                                        required
                                        variant="outlined"
                                        size="small"
                                        error={!!fieldErrors.street}
                                        inputProps={{
                                            maxLength: FIELD_MAX_LEN.street,
                                            style: { textAlign: isHebrew ? 'right' : 'left' }
                                        }}
                                        sx={{
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 0.5)'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 1)'
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                textAlign: isHebrew ? 'right' : 'left'
                                            }
                                        }}
                                    />
                                    {fieldErrors.street && (
                                        <Typography
                                            variant="caption"
                                            color="error"
                                            sx={{
                                                mt: 0.5,
                                                width: '100%',
                                                textAlign: isHebrew ? 'right' : 'left',
                                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                            }}
                                        >
                                            {fieldErrors.street}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={3} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: { xs: '100%', md: '70%' }
                                }}>
                                    <TextField
                                        fullWidth
                                        label={t.houseNumber}
                                        placeholder={t.houseNumberPlaceholder}
                                        value={customerInfo.houseNumber}
                                        onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                                        onBlur={() => handleInputBlur('houseNumber')}
                                        required
                                        variant="outlined"
                                        size="small"
                                        error={!!fieldErrors.houseNumber}
                                        inputProps={{
                                            maxLength: FIELD_MAX_LEN.houseNumber,
                                            style: { textAlign: isHebrew ? 'right' : 'left' }
                                        }}
                                        sx={{
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 0.5)'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 1)'
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                textAlign: isHebrew ? 'right' : 'left'
                                            }
                                        }}
                                    />
                                    {fieldErrors.houseNumber && (
                                        <Typography
                                            variant="caption"
                                            color="error"
                                            sx={{
                                                mt: 0.5,
                                                width: '100%',
                                                textAlign: isHebrew ? 'right' : 'left',
                                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                            }}
                                        >
                                            {fieldErrors.houseNumber}
                                        </Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={3} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: { xs: '100%', md: '70%' }
                                }}>
                                    <TextField
                                        fullWidth
                                        label={t.apartmentNumberOptional}
                                        placeholder={t.apartmentNumberPlaceholder}
                                        value={customerInfo.apartmentNumber}
                                        onChange={(e) => handleInputChange('apartmentNumber', e.target.value)}
                                        onBlur={() => handleInputBlur('apartmentNumber')}
                                        variant="outlined"
                                        size="small"
                                        inputProps={{
                                            maxLength: FIELD_MAX_LEN.apartmentNumber,
                                            style: { textAlign: isHebrew ? 'right' : 'left' }
                                        }}
                                        sx={{
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 0.5)'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 1)'
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                textAlign: isHebrew ? 'right' : 'left'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: { xs: '100%', md: '70%' }
                                }}>
                                    <TextField
                                        fullWidth
                                        label={t.floorOptional}
                                        placeholder={t.floorPlaceholder}
                                        value={customerInfo.floor}
                                        onChange={(e) => handleInputChange('floor', e.target.value)}
                                        onBlur={() => handleInputBlur('floor')}
                                        variant="outlined"
                                        size="small"
                                        inputProps={{
                                            maxLength: FIELD_MAX_LEN.floor,
                                            style: { textAlign: isHebrew ? 'right' : 'left' }
                                        }}
                                        sx={{
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 0.5)'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 1)'
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                textAlign: isHebrew ? 'right' : 'left'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6} sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: { xs: '100%', md: '70%' }
                                }}>
                                    <TextField
                                        fullWidth
                                        label={t.city}
                                        placeholder={t.cityPlaceholder}
                                        value={customerInfo.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        onBlur={() => handleInputBlur('city')}
                                        required
                                        variant="outlined"
                                        size="small"
                                        error={!!fieldErrors.city}
                                        inputProps={{
                                            maxLength: FIELD_MAX_LEN.city,
                                            style: { textAlign: isHebrew ? 'right' : 'left' }
                                        }}
                                        sx={{
                                            direction: isHebrew ? 'rtl' : 'ltr',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 0.5)'
                                                },
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: 'rgba(229, 90, 61, 1)'
                                                }
                                            },
                                            '& .MuiInputLabel-root': {
                                                textAlign: isHebrew ? 'right' : 'left'
                                            }
                                        }}
                                    />
                                    {fieldErrors.city && (
                                        <Typography
                                            variant="caption"
                                            color="error"
                                            sx={{
                                                mt: 0.5,
                                                width: '100%',
                                                textAlign: isHebrew ? 'right' : 'left',
                                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                                            }}
                                        >
                                            {fieldErrors.city}
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Box>

                {/* Order Summary Section */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h5" sx={{
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 3,
                        color: 'rgba(229, 90, 61, 1)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
                    }}>
                        <Box component="span" sx={{
                            width: { xs: 20, sm: 22, md: 24 },
                            height: { xs: 20, sm: 22, md: 24 },
                            borderRadius: '50%',
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                            fontWeight: 'bold'
                        }}>
                            3
                        </Box>
                        {t.orderSummary}
                    </Typography>

                    <Box sx={{
                        p: 4,
                        pb: { xs: 3, sm: 4, md: 4 },
                        backgroundColor: 'rgba(245, 240, 227, 0.3)',
                        borderRadius: 3,
                        border: '1px solid rgba(229, 90, 61, 0.1)'
                    }}>
                        {checkoutCart.map((item, index) => (
                            <Box
                                key={item.uniqueId != null ? item.uniqueId : `${item.id}-${index}`}
                                sx={{
                                    display: 'flex',
                                    flexDirection: isHebrew ? 'row-reverse' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: 2,
                                    mb: 2,
                                    p: 2,
                                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    borderRadius: 2
                                }}
                            >
                                <Typography
                                    sx={{
                                        direction: isHebrew ? 'rtl' : 'ltr',
                                        textAlign: isHebrew ? 'right' : 'left',
                                        fontWeight: 500,
                                        flex: 1,
                                        minWidth: 0
                                    }}
                                >
                                    {getCartItemDisplayName(item, isHebrew)} × {item.quantity}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        textAlign: isHebrew ? 'left' : 'right',
                                        flexShrink: 0,
                                        direction: 'ltr'
                                    }}
                                >
                                    ₪{(Number(item.price || 0) * item.quantity).toFixed(2)}
                                </Typography>
                            </Box>
                        ))}

                        {discount > 0 && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: isHebrew ? 'row-reverse' : 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                                px: 2
                            }}>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr', color: 'success.main' }}>
                                    {t.discount}
                                </Typography>
                                <Typography sx={{ color: 'success.main', direction: 'ltr' }}>
                                    -₪{discount.toFixed(2)}
                                </Typography>
                            </Box>
                        )}

                        {deliveryFee > 0 && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: isHebrew ? 'row-reverse' : 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                                px: 2
                            }}>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                    {t.homeDelivery}
                                </Typography>
                                <Typography sx={{ direction: 'ltr' }}>
                                    ₪{deliveryFee.toFixed(2)}
                                </Typography>
                            </Box>
                        )}

                        {isHomeDelivery && qualifiesForFreeShipping && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: isHebrew ? 'row-reverse' : 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                                px: 2
                            }}>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                    {t.homeDelivery}
                                </Typography>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr', color: 'success.main' }}>
                                    {t.free}
                                </Typography>
                            </Box>
                        )}

                        {!isHomeDelivery && (
                            <Box sx={{
                                display: 'flex',
                                flexDirection: isHebrew ? 'row-reverse' : 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                                px: 2
                            }}>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr', color: 'text.secondary' }}>
                                    {t.selfPickup}
                                </Typography>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr', color: 'text.secondary' }}>
                                    {t.noCharge}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{
                            display: 'flex',
                            flexDirection: isHebrew ? 'row-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            pt: { xs: 1, sm: 2, md: 3 },
                            pb: 0,
                            borderRadius: 2
                        }}>
                            <Typography variant="h6" sx={{
                                direction: isHebrew ? 'rtl' : 'ltr',
                                textAlign: isHebrew ? 'right' : 'left',
                                fontWeight: 700,
                                color: 'rgba(229, 90, 61, 1)',
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                            }}>
                                {t.totalToPay}
                            </Typography>
                            <Typography variant="h6" sx={{
                                direction: 'ltr',
                                textAlign: isHebrew ? 'left' : 'right',
                                fontWeight: 700,
                                color: 'rgba(229, 90, 61, 1)',
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                            }}>
                                ₪{displayTotal.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Terms and Conditions Section */}
                <Box sx={{ mb: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                sx={{
                                    p: 0,
                                    color: 'rgba(229, 90, 61, 1)',
                                    '&.Mui-checked': {
                                        color: 'rgba(229, 90, 61, 1)',
                                    },
                                    '& .MuiSvgIcon-root': {
                                        fontSize: 18,
                                    }
                                }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{
                                direction: isHebrew ? 'rtl' : 'ltr',
                                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                                color: 'text.primary'
                            }}>
                                {t.termsAgreementPrefix}
                                <Button
                                    component="a"
                                    href="/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        color: 'rgba(229, 90, 61, 1)',
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '4px',
                                        fontSize: 'inherit',
                                        fontWeight: 'inherit',
                                        p: 0,
                                        minWidth: 'auto',
                                        textTransform: 'none',
                                        '&:hover': {
                                            textDecoration: 'underline',
                                            textUnderlineOffset: '4px',
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                >
                                    {t.termsAgreementLinkText}
                                </Button>
                            </Typography>
                        }
                        labelPlacement={isHebrew ? 'start' : 'end'}
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            mx: 'auto',
                            maxWidth: { xs: '90%', sm: '80%', md: '70%' },
                            flexDirection: isHebrew ? 'row-reverse' : 'row',
                            gap: 0.5,
                            '& .MuiFormControlLabel-label': {
                                marginLeft: isHebrew ? 0 : '0px',
                                marginRight: isHebrew ? '0px' : 0
                            }
                        }}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={marketingConsent}
                                onChange={(e) => setMarketingConsent(e.target.checked)}
                                sx={{
                                    p: 0,
                                    mt: '0px',
                                    alignSelf: 'flex-start',
                                    color: 'rgba(229, 90, 61, 1)',
                                    '&.Mui-checked': {
                                        color: 'rgba(229, 90, 61, 1)',
                                    },
                                    '& .MuiSvgIcon-root': {
                                        fontSize: 18,
                                    }
                                }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{
                                direction: isHebrew ? 'rtl' : 'ltr',
                                fontSize: { xs: '0.98rem', sm: '1.02rem', md: '1.12rem' },
                                color: 'text.primary',
                                lineHeight: 1.2,
                                p: 0
                            }}>
                                {t.marketingConsentLabel}
                            </Typography>
                        }
                        labelPlacement={isHebrew ? 'start' : 'end'}
                        sx={{
                            mt: 1,
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            mx: 'auto',
                            maxWidth: { xs: '90%', sm: '80%', md: '70%' },
                            flexDirection: isHebrew ? 'row-reverse' : 'row',
                            gap: { xs: 0, sm: 0.5, md: 0.5 },
                            '& .MuiFormControlLabel-label': {
                                margin: 0,
                                marginTop: 0,
                                marginLeft: 0,
                                marginRight: 0,
                                minWidth: 0,
                                width: 'fit-content',
                                display: 'inline-block',
                            }
                        }}
                    />
                </Box>

                {/* Site Feedback (below Terms checkbox) */}
                <Box sx={{
                    mt: 2,
                    mx: 'auto',
                    maxWidth: { xs: '92%', sm: '85%', md: '70%' },
                    textAlign: isHebrew ? 'right' : 'left',
                    direction: isHebrew ? 'rtl' : 'ltr'
                }}>
                    {!feedbackSubmitted ? (
                        <>
                            <Box
                                sx={{
                                    position: 'relative',
                                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                                    borderRadius: 2,
                                    border: '1px solid rgba(0, 0, 0, 0.23)',
                                    px: 2,
                                    pt: 1.5,
                                    pb: 1.5,
                                    '&:hover': {
                                        borderColor: 'rgb(229, 90, 61)'
                                    },
                                    '&:focus-within': {
                                        borderColor: 'rgb(229, 90, 61)'
                                    },
                                    transition: 'border-color 0.2s ease'
                                }}
                            >
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        textAlign: isHebrew ? 'right' : 'left',
                                        mb: 1
                                    }}
                                >
                                    {t.siteFeedbackTitle}
                                </Typography>

                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder={t.siteFeedbackPlaceholder}
                                    variant="standard"
                                    inputProps={{ maxLength: FIELD_MAX_LEN.feedback }}
                                    InputProps={{ disableUnderline: true }}
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontSize: '1rem'
                                        }
                                    }}
                                />

                                <Typography
                                    variant="caption"
                                    sx={{
                                        mt: 0.75,
                                        display: 'block',
                                        color: feedbackTooLong ? 'error.main' : 'text.secondary',
                                        direction: isHebrew ? 'rtl' : 'ltr',
                                        textAlign: isHebrew ? 'right' : 'left'
                                    }}
                                >
                                    {t.siteFeedbackLimit} · {feedbackCharCount} {t.siteFeedbackCountUnit}
                                </Typography>

                                <IconButton
                                    onClick={submitFeedback}
                                    disabled={feedbackSubmitting || feedbackText.trim().length < 2 || feedbackTooLong}
                                    aria-label={t.siteFeedbackSubmitAriaLabel}
                                    sx={{
                                        position: 'absolute',
                                        top: 'auto',
                                        bottom: 12,
                                        left: isHebrew ? 15 : 'auto',
                                        right: isHebrew ? 'auto' : 15,
                                        border: '1px solid rgba(229, 90, 61, 1)',
                                        color: 'rgba(199, 61, 34, 1)',
                                        width: 36,
                                        height: 36,
                                        '&:hover': { borderColor: 'rgba(199, 61, 34, 1)', backgroundColor: 'rgb(199, 61, 34, 1)', color: 'white' },
                                        '&:disabled': { color: 'rgba(208, 79, 54, 0.42)', borderColor: 'rgba(208, 79, 54, 0.42)' }
                                    }}
                                >
                                    {isHebrew ? <ArrowBackIosNew sx={{ fontSize: 18 }} /> : <ArrowForwardIos sx={{ fontSize: 18 }} />}
                                </IconButton>
                            </Box>
                        </>
                    ) : (
                        <Box
                            sx={{
                                px: 5,
                                py: 1,
                                width: 'fit-content',
                                margin: '25px auto 0 auto',
                                borderRadius: 2,
                                border: '1px solid rgb(229, 90, 61)',
                                color: 'rgb(229, 90, 61)',
                            }}
                        >
                            <Typography sx={{
                                fontWeight: 600,
                                color: 'success.main',
                                textAlign: 'center',
                                lineHeight: { xs: '1.2', sm: '1.2', md: '1.2' },
                                direction: isHebrew ? 'rtl' : 'ltr'
                            }}>
                                {t.siteFeedbackThankYou}
                            </Typography>
                        </Box>
                    )}

                    {/* Feedback error (if save failed) */}
                    {!!feedbackError && (
                        <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                            {feedbackError}
                        </Typography>
                    )}
                </Box>

                {/* Action Buttons Section */}
                <Box sx={{
                    mt: 6,
                    textAlign: 'center',
                    display: 'flex',
                    gap: 3,
                    justifyContent: 'center',
                    flexDirection: { xs: 'column', sm: 'row' }
                }}>


                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleGetPaymentForm}
                        disabled={isLoading || !termsAccepted}
                        sx={{
                            background: 'linear-gradient(135deg, rgba(229, 90, 61, 1) 0%, rgba(199, 61, 34, 1) 100%)',
                            color: 'white',
                            px: 6,
                            py: 1.5,
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            borderRadius: 2,
                            boxShadow: '0 8px 25px rgba(229, 90, 61, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, rgba(199, 61, 34, 1) 0%, rgba(229, 90, 61, 1) 100%)',
                                transform: 'translateY(-3px)',
                                boxShadow: '0 12px 35px rgba(229, 90, 61, 0.4)'
                            },
                            '&:disabled': {
                                background: 'rgba(229, 90, 61, 0.5)',
                                transform: 'none',
                                boxShadow: 'none'
                            },
                            transition: 'all 0.3s ease',
                            minWidth: { xs: '100%', sm: '200px' }
                        }}
                    >
                        {isLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={20} color="inherit" />
                                <span>{t.processing}</span>
                            </Box>
                        ) : (
                            `${t.payNow} ₪${displayTotal.toFixed(2)}`
                        )}
                    </Button>
                    <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/cart')}
                        sx={{
                            borderColor: 'rgba(229, 90, 61, 1)',
                            color: 'rgba(229, 90, 61, 1)',
                            px: 4,
                            py: 1.5,
                            fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                            fontWeight: 600,
                            borderRadius: 2,
                            borderWidth: 1,
                            '&:hover': {
                                borderColor: 'rgba(199, 61, 34, 1)',
                                backgroundColor: 'transparent',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                            minWidth: { xs: '50%', sm: '160px' },
                            maxWidth: { xs: '50%', sm: '160px' },
                            alignSelf: 'center'
                        }}
                    >
                        {t.backToCart}
                    </Button>
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.securePaymentCardcom}
                    </Typography>
                </Box>
            </Paper>
        </Container >
    );
}
