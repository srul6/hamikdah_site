import React, { useState } from 'react';
import {
    Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, TextField, Box, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { createCardcomPayment } from '../api/cardcom';

export default function CartPage({ cart, onRemove, onUpdateQuantity }) {
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        setIsCheckoutOpen(true);
    };

    const handlePayment = async () => {
        if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
            alert('Please fill in all required fields');
            return;
        }

        setIsProcessing(true);
        try {
            const items = cart.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                mainImage: item.mainImage
            }));

            const response = await createCardcomPayment(items, total, customerInfo);

            if (response.success) {
                // Redirect to Cardcom payment page
                window.location.href = response.paymentUrl;
            } else {
                alert('Payment initialization failed. Please try again.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleInputChange = (field, value) => {
        setCustomerInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <Box sx={{ backgroundColor: 'rgba(245, 240, 227, 0.9)' }}>
            <Container maxWidth="lg" sx={{ py: 12, px: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography
                    variant="h2"
                    sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        color: '#1d1d1f',
                        mt: 10,
                        mb: 4,
                        fontSize: { xs: '1.5rem', md: '2rem' },
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
                    {cart.length === 0 ? '😢 כרגע סל הקניות שלך ריק ' : 'סל הקניות שלך'}
                </Typography>

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
                                '&:hover': {
                                    border: '2px solid rgba(199, 61, 34, 1)'
                                }
                            }}
                        >
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'rgba(245, 240, 227, 0.5)' }}>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>מוצר</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>מחיר</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>כמות</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>סך הכל</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>להסיר</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cart.map(item => (
                                        <TableRow key={item.id} sx={{
                                            '&:hover': { backgroundColor: 'rgba(245, 240, 227, 0.3)' },
                                            border: '2px solid white'
                                        }}>
                                            <TableCell>
                                                <Typography variant="body1" align="center" sx={{ fontWeight: 500, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>
                                                    {item.name}
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
                                            <Typography align="center" variant="h6" sx={{ fontWeight: 600, color: '#1d1d1f', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem', lg: '1.3rem' } }}>
                                                ₪{total.toFixed(2)} :סך הכל
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
                                    px: 6,
                                    py: 1.5,
                                    mb: 10,
                                    boxShadow: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    borderRadius: 1.5,
                                    transition: 'all 0.3s ease',
                                    border: '2px solid transparent',
                                    '&:hover': {
                                        backgroundColor: 'rgb(245, 240, 227)',
                                        color: 'rgba(229, 90, 61, 1)',
                                        border: '2px solid rgba(229, 90, 61, 1)',
                                        boxShadow: 'none',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                המשך לתשלום
                            </Button>
                        </Box>
                    </>
                )}
            </Container>

            {/* Customer Information Dialog */}
            <Dialog open={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Customer Information</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <MuiTextField
                            label="Full Name *"
                            value={customerInfo.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            fullWidth
                            required
                        />
                        <MuiTextField
                            label="Email *"
                            type="email"
                            value={customerInfo.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            fullWidth
                            required
                        />
                        <MuiTextField
                            label="Phone *"
                            value={customerInfo.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            fullWidth
                            required
                        />
                        <MuiTextField
                            label="Address"
                            value={customerInfo.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handlePayment}
                        variant="contained"
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Pay ₪' + total.toFixed(2)}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}