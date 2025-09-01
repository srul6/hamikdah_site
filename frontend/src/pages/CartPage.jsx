import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, TextField, Box, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField, Alert, Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import GreenInvoicePayment from './GreenInvoicePayment';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

export default function CartPage({ cart, onRemove, onUpdateQuantity }) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const navigate = useNavigate();

    // Scroll to top when cart page loads
    useEffect(() => {
        // Use setTimeout to ensure the component is fully rendered
        setTimeout(() => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        }, 100);
    }, []);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert(t.cartEmpty);
            return;
        }
        // Go directly to payment without collecting customer details
        setIsPaymentOpen(true);
    };

    const handlePaymentComplete = (paymentData) => {
        setIsPaymentOpen(false);
        console.log('Payment completed:', paymentData);

        if (paymentData.status === 'success') {
            setSuccess(paymentData.message);
            // Optionally clear cart or redirect
            // setCart([]);
            // navigate('/payment/success');
        } else {
            setError(paymentData.message || t.paymentFailed);
        }
    };

    const removeFromCart = (index) => {
        onRemove(cart[index].id);
    };

    const updateQuantity = (index, newQuantity) => {
        onUpdateQuantity(cart[index].id, newQuantity);
    };





    return (
        <Box sx={{ backgroundColor: 'rgba(245, 240, 227, 0.9)' }}>
            <Container maxWidth="lg" sx={{
                py: cart.length === 0 ? 12 : 4,
                px: { xs: 2, sm: 4, md: 8 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <Typography
                    variant="h2"
                    sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#1d1d1f',
                        mt: cart.length === 0 ? 10 : 2,
                        mb: 4,
                        fontSize: { xs: '1.5rem', md: '2rem' },
                        direction: isHebrew ? 'rtl' : 'ltr',
                        ...(cart.length === 0 && {
                            border: '2px solid rgba(229, 90, 61, 1)',
                            borderRadius: 1.5,
                            py: 3,
                            px: 4,
                            mb: 4,
                            display: 'inline-block',
                            minWidth: 'fit-content'
                        })
                    }}
                >
                    {cart.length === 0 ? t.emptyCart : t.yourCart}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {cart.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                    </Box>
                ) : (
                    <>
                        <TableContainer
                            component={Paper}
                            sx={{
                                boxShadow: 'none',
                                border: '2px solid rgba(229, 90, 61, 1)',
                                borderRadius: 2,
                                transition: 'border-color 0.3s ease',
                                width: { xs: '100%', sm: '100%', md: '100%' },
                                minWidth: { xs: '100%', sm: '100%', md: '100%' },
                                '&:hover': {
                                    border: '2px solid rgba(199, 61, 34, 1)'
                                }
                            }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'rgba(245, 240, 227, 0.5)' }}>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' }, direction: isHebrew ? 'rtl' : 'ltr' }}>{t.product}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' }, direction: isHebrew ? 'rtl' : 'ltr' }}>{t.price}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' }, direction: isHebrew ? 'rtl' : 'ltr' }}>{t.quantity}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' }, direction: isHebrew ? 'rtl' : 'ltr' }}>{t.total}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' }, direction: isHebrew ? 'rtl' : 'ltr' }}>{t.remove}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cart.map(item => (
                                        <TableRow key={item.id} sx={{
                                            '&:hover': { backgroundColor: 'rgba(245, 240, 227, 0.3)' },
                                            border: '2px solid white'
                                        }}>
                                            <TableCell>
                                                <Typography variant="body1" align="center" sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' }, direction: isHebrew ? 'rtl' : 'ltr' }}>
                                                    {isHebrew ? item.name_he : item.name_en}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1" align="center" sx={{ align: 'center', color: '#86868b', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>
                                                    ₪{(item.price || 0).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    inputProps={{ min: 1 }}
                                                    value={item.quantity}
                                                    onChange={e => onUpdateQuantity(item.id, Number(e.target.value))}
                                                    sx={{
                                                        width: { xs: 70, lg: 90 },
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 1,
                                                        },
                                                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(229, 90, 61, 1)'
                                                        },
                                                        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'rgba(229, 90, 61, 0.7)'
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            textAlign: 'center',
                                                            fontSize: { xs: '1rem', md: '1.1rem', lg: '1.2rem' }
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1" align="center" sx={{ align: 'center', fontWeight: 500, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>
                                                    ₪{(item.price * item.quantity).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    onClick={() => onRemove(item.id)}
                                                    sx={{
                                                        color: '#86868b',
                                                        '&:hover': {
                                                            color: 'rgba(229, 90, 61, 1)',
                                                            backgroundColor: 'rgba(255, 59, 48, 0.04)'
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{
                                        backgroundColor: 'rgba(245, 240, 227, 0.7)'
                                    }}>

                                        <TableCell colSpan={5}>
                                            <Typography align="center" variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' }, direction: isHebrew ? 'rtl' : 'ltr' }}>
                                                {isHebrew ? `${t.total}: ₪${total.toFixed(2)}` : `${t.total}: ₪${total.toFixed(2)}`}
                                            </Typography>
                                        </TableCell>

                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleCheckout}
                                sx={{
                                    backgroundColor: 'rgba(229, 90, 61, 1)',
                                    color: '#ffffff',
                                    px: { xs: 2, sm: 4, md: 6 },
                                    py: 1.5,
                                    mb: 10,
                                    boxShadow: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    borderRadius: 1.5,
                                    transition: 'all 0.3s ease',
                                    border: '2px solid transparent',
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    '&:hover': {
                                        backgroundColor: 'rgb(245, 240, 227)',
                                        color: 'rgba(229, 90, 61, 1)',
                                        border: '2px solid rgba(229, 90, 61, 1)',
                                        boxShadow: 'none',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                {t.proceedToPayment}
                            </Button>
                        </Box>
                    </>
                )}
            </Container>

            {/* GreenInvoice Payment Dialog */}
            <Dialog
                open={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '90vh',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogContent sx={{ p: 0, height: '100%' }}>
                    <GreenInvoicePayment
                        cart={cart}
                        onPaymentComplete={handlePaymentComplete}
                        onClose={() => setIsPaymentOpen(false)}
                    />
                </DialogContent>
            </Dialog>

        </Box>
    );
}