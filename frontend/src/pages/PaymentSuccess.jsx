import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Typography, Box, Paper, Button, Alert,
    CircularProgress, Divider
} from '@mui/material';
import { CheckCircle, Receipt, Email } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { translations } from '../translations/translations';
import { clearCheckoutDeliveryPreferences } from '../utils/cookieManager';
import { trackPurchaseConversion } from '../consent/trackPurchaseConversion';
import { claimAdsConversion } from '../api/orders';
import { bootstrapConsent, hasConsent, CATEGORY_IDS } from '../consent';

const PURCHASE_DEDUP_PREFIX = 'gads_purchase_';

function wasPurchaseTrackedLocally(transactionId) {
    try {
        return Boolean(sessionStorage.getItem(`${PURCHASE_DEDUP_PREFIX}${transactionId}`));
    } catch {
        return false;
    }
}

function markPurchaseTrackedLocally(transactionId) {
    try {
        sessionStorage.setItem(`${PURCHASE_DEDUP_PREFIX}${transactionId}`, '1');
    } catch {
        // Ignore
    }
}

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState(null);
    const [error, setError] = useState(null);
    const { clearCart } = useCart();

    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            const state = location.state || {};
            const orderId = searchParams.get('orderId') || state.orderId;
            const amount = searchParams.get('amount') ?? state.amount;
            const currency = searchParams.get('currency') || state.currency || 'ILS';
            const documentId = searchParams.get('documentId') || state.documentId;

            if (!orderId) {
                setError('Payment details not found');
                setIsLoading(false);
                return;
            }

            const displayAmount = amount != null && amount !== ''
                ? parseFloat(amount)
                : null;

            setPaymentDetails({
                orderId,
                amount: displayAmount,
                currency,
                documentId
            });

            // Server is source of truth for paid status + conversion dedup.
            // sessionStorage is only an optimistic UX guard.
            // Claim only when advertising consent is granted — otherwise we'd burn
            // the server-side flag without firing Ads.
            try {
                if (!wasPurchaseTrackedLocally(String(orderId))) {
                    bootstrapConsent();
                    if (hasConsent(CATEGORY_IDS.ADVERTISING)) {
                        const claim = await claimAdsConversion(orderId);
                        if (!cancelled && claim && claim.alreadySent === false) {
                            trackPurchaseConversion({
                                value: claim.value,
                                currency: claim.currency,
                                transactionId: claim.transactionId
                            });
                            markPurchaseTrackedLocally(String(claim.transactionId));
                        } else if (!cancelled && claim && claim.alreadySent) {
                            markPurchaseTrackedLocally(String(orderId));
                        }
                    }
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    // eslint-disable-next-line no-console
                    console.warn('[Google Ads] Conversion claim/track threw:', err);
                }
            }

            try {
                clearCart();
                clearCheckoutDeliveryPreferences();
            } catch (_) {
                // Non-fatal
            }

            if (!cancelled) {
                setIsLoading(false);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [searchParams, location.state, clearCart]);

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewInvoice = () => {
        if (paymentDetails?.documentId) {
            // Open invoice in new tab (GreenInvoice will provide the URL)
            window.open(`https://www.greeninvoice.co.il/documents/${paymentDetails.documentId}`, '_blank');
        }
    };

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                    {t.processing}
                </Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={handleContinueShopping}
                        sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                    >
                        {isHebrew ? t.backToWebsite : t.continueShopping}
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ pt: 15, pb: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                {/* Success Icon */}
                <CheckCircle
                    sx={{
                        fontSize: 80,
                        color: 'success.main',
                        mb: 3
                    }}
                />

                {/* Success Message */}
                <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                        color: 'success.main',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 2
                    }}
                >
                    {t.paymentSuccess}
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        color: 'text.secondary',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 4
                    }}
                >
                    {t.thankYouPurchaseTitle}
                    <br />
                    {t.thankYouPurchaseDescription}
                    <br />
                    {t.thankYouPurchaseDescription2}
                </Typography>

                {/* Payment Details */}
                {paymentDetails && (
                    <Box sx={{
                        backgroundColor: 'rgba(245, 240, 227, 0.5)',
                        borderRadius: 2,
                        p: 3,
                        mb: 4,
                        textAlign: isHebrew ? 'right' : 'left'
                    }}>
                        <Typography variant="h6" gutterBottom sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                            {t.orderSummary}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexDirection: isHebrew ? 'row-reverse' : 'row' }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.orderId}:
                            </Typography>
                            <Typography fontWeight="bold">
                                {paymentDetails.orderId}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexDirection: isHebrew ? 'row-reverse' : 'row' }}>
                            <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.total}:
                            </Typography>
                            <Typography fontWeight="bold">
                                ₪{paymentDetails.amount.toFixed(2)}
                            </Typography>
                        </Box>

                        {paymentDetails.documentId && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexDirection: isHebrew ? 'row-reverse' : 'row' }}>
                                <Typography sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                    {t.invoiceNumber}:
                                </Typography>
                                <Typography fontWeight="bold">
                                    {paymentDetails.documentId}
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {!isHebrew && <Email color="action" />}
                            <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                                {t.invoiceEmailSentGeneric}
                            </Typography>
                            {isHebrew && <Email color="action" />}
                        </Box>
                    </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {paymentDetails?.documentId && (
                        <Button
                            variant="outlined"
                            startIcon={<Receipt />}
                            onClick={handleViewInvoice}
                            sx={{
                                direction: isHebrew ? 'rtl' : 'ltr',
                                '& .MuiButton-startIcon': {
                                    marginLeft: isHebrew ? '6px' : '-6px',
                                    marginRight: isHebrew ? '-6px' : '6px'
                                }
                            }}
                        >
                            {t.viewInvoice}
                        </Button>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleContinueShopping}
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            '&:hover': { backgroundColor: 'rgba(199, 61, 34, 1)' },
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {isHebrew ? t.backToWebsite : t.continueShopping}
                    </Button>
                </Box>

                {/* Additional Information */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.paymentSuccessNote}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
