import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button, Paper, TextField,
    Grid, CircularProgress, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions
} from '@mui/material';
import { getPaymentForm } from '../api/greenInvoice';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function GreenInvoicePayment({ cart, onPaymentComplete, onClose }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentFormHtml, setPaymentFormHtml] = useState(null);
    const [iframeUrl, setIframeUrl] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zip: ''
    });

    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleGetPaymentForm = async () => {
        if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
            setError(t.fillRequiredFields);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const items = cart.map(item => ({
                id: item.id,
                name: item.name,
                name_he: item.name_he,
                name_en: item.name_en,
                price: item.price,
                quantity: item.quantity
            }));

            const response = await getPaymentForm(items, total, customerInfo);

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
                    setError('No payment form received from GreenInvoice');
                }
            } else {
                setError(response.message || 'Failed to create payment form');
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
                    // Payment successful
                    onPaymentComplete({
                        status: 'success',
                        formId,
                        documentId,
                        message: t.paymentSuccess
                    });
                } else if (status === 'failed' || status === 'declined') {
                    // Payment failed
                    setError(t.paymentFailed);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onPaymentComplete, t.paymentSuccess, t.paymentFailed]);

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
                            dangerouslySetInnerHTML={{ __html: paymentFormHtml }}
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
                                title="CardCom Payment Form"
                                style={{ border: 'none' }}
                                allow="payment"
                            />
                        </Box>
                    ) : null}

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.securePaymentCardcom}
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
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                    {t.customerInfo}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t.name}
                            value={customerInfo.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            required
                            sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t.email}
                            type="email"
                            value={customerInfo.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t.phone}
                            value={customerInfo.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            required
                            sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t.address}
                            value={customerInfo.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t.city}
                            value={customerInfo.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={t.zipCode}
                            value={customerInfo.zip}
                            onChange={(e) => handleInputChange('zip', e.target.value)}
                            sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                        />
                    </Grid>
                </Grid>

                {/* Order Summary */}
                <Box sx={{ mt: 4, p: 3, backgroundColor: 'rgba(245, 240, 227, 0.5)', borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.orderSummary}
                    </Typography>
                    {cart.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {isHebrew ? item.name_he : item.name_en} x {item.quantity}
                            </Typography>
                            <Typography>₪{(item.price * item.quantity).toFixed(2)}</Typography>
                        </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                        <Typography variant="h6" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.total}
                        </Typography>
                        <Typography variant="h6">₪{total.toFixed(2)}</Typography>
                    </Box>
                </Box>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleGetPaymentForm}
                        disabled={isLoading}
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' }
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} /> : `${t.pay} ₪${total.toFixed(2)}`}
                    </Button>
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.securePaymentCardcom}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
