import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Button, Paper, TextField,
    Grid, CircularProgress, Alert
} from '@mui/material';
import { createCardcomLowProfile } from '../api/cardcom';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function CardcomPayment({ cart, onPaymentComplete }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCreateLowProfile = async () => {
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

            const response = await createCardcomLowProfile(items, total, customerInfo);

            if (response.success && response.url) {
                // Redirect to Cardcom's payment page
                window.location.href = response.url;
            } else {
                setError(response.message || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError(t.paymentFailed);
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
                        onClick={handleCreateLowProfile}
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
                        {t.securePayment}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
