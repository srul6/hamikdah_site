import React, { useEffect, useRef, useState } from 'react';
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
import { bootstrapConsent, getConsent, hasConsent, CATEGORY_IDS } from '../consent';

const PURCHASE_DEDUP_PREFIX = 'gads_purchase_';
const ADS_LOG = '[Ads Conversion]';

let paymentSuccessMountSeq = 0;
let paymentSuccessEffectSeq = 0;
let adsFlowRequestSeq = 0;

function nextAdsRequestId() {
    adsFlowRequestSeq += 1;
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `local-${Date.now()}-${adsFlowRequestSeq}`;
    return { seq: adsFlowRequestSeq, uuid, tag: `${ADS_LOG}[Request #${adsFlowRequestSeq}][UUID=${uuid}]` };
}

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
    const mountRef = useRef(null);

    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    // 1. Mount diagnostics (runs once per component instance)
    if (mountRef.current == null) {
        paymentSuccessMountSeq += 1;
        mountRef.current = {
            mountSeq: paymentSuccessMountSeq,
            isFirstRender: true,
            mountAt: new Date().toISOString()
        };
        const orderIdAtMount = searchParams.get('orderId') || (location.state && location.state.orderId) || null;
        console.info(`${ADS_LOG} PaymentSuccess mounted`, {
            mountSeq: mountRef.current.mountSeq,
            orderId: orderIdAtMount,
            isFirstRender: true,
            url: typeof window !== 'undefined' ? window.location.href : null,
            timestamp: mountRef.current.mountAt
        });
    }

    useEffect(() => {
        let cancelled = false;
        paymentSuccessEffectSeq += 1;
        const effectRun = paymentSuccessEffectSeq;
        const req = nextAdsRequestId();
        const isFirstRender = mountRef.current?.isFirstRender === true;
        if (mountRef.current) {
            mountRef.current.isFirstRender = false;
        }

        // 2. Every useEffect execution
        console.info(`${req.tag} useEffect run`, {
            effectRun,
            mountSeq: mountRef.current?.mountSeq,
            isFirstRender,
            dependencies: {
                searchParams: searchParams.toString(),
                locationState: location.state || null,
                clearCartType: typeof clearCart
            },
            url: typeof window !== 'undefined' ? window.location.href : null,
            timestamp: new Date().toISOString()
        });

        const run = async () => {
            const state = location.state || {};
            const orderId = searchParams.get('orderId') || state.orderId;
            const amount = searchParams.get('amount') ?? state.amount;
            const currency = searchParams.get('currency') || state.currency || 'ILS';
            const documentId = searchParams.get('documentId') || state.documentId;

            console.info(`${req.tag} Parsed payment params`, {
                orderId,
                amount,
                currency,
                documentId
            });

            if (!orderId) {
                console.warn(`${req.tag} Stopping — missing orderId`);
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
                // 3. Before checking local sessionStorage
                const locallyTracked = wasPurchaseTrackedLocally(String(orderId));
                console.info(`${req.tag} sessionStorage check wasPurchaseTrackedLocally`, {
                    orderId: String(orderId),
                    alreadyTrackedLocally: locallyTracked
                });

                if (!locallyTracked) {
                    // 4. After loading consent
                    const consent = bootstrapConsent();
                    const advertisingGranted = hasConsent(CATEGORY_IDS.ADVERTISING);
                    console.info(`${req.tag} Consent loaded`, {
                        consent: consent || getConsent(),
                        advertisingGranted
                    });

                    if (advertisingGranted) {
                        // 5. Before claimAdsConversion
                        console.info(`${req.tag} Before claimAdsConversion`, {
                            orderId,
                            timestamp: new Date().toISOString()
                        });

                        const claim = await claimAdsConversion(orderId, { requestId: req });

                        // 6. After claimAdsConversion returns
                        console.info(`${req.tag} After claimAdsConversion`, {
                            claim,
                            alreadySent: claim?.alreadySent ?? null,
                            transactionId: claim?.transactionId ?? null,
                            value: claim?.value ?? null,
                            currency: claim?.currency ?? null,
                            cancelled
                        });

                        if (!cancelled && claim && claim.alreadySent === false) {
                            const conversionPayload = {
                                value: claim.value,
                                currency: claim.currency,
                                transactionId: claim.transactionId
                            };
                            // 7. Before trackPurchaseConversion
                            console.info(`${req.tag} Before trackPurchaseConversion`, {
                                payload: conversionPayload
                            });

                            trackPurchaseConversion(conversionPayload, { requestId: req });
                            markPurchaseTrackedLocally(String(claim.transactionId));

                            // 11. After marking locally
                            console.info(`${req.tag} Marked transaction in sessionStorage`, {
                                transactionId: String(claim.transactionId)
                            });
                        } else if (!cancelled && claim && claim.alreadySent) {
                            markPurchaseTrackedLocally(String(orderId));
                            console.info(`${req.tag} Claim alreadySent — marked orderId locally, skipped gtag`, {
                                orderId: String(orderId)
                            });
                        } else {
                            console.info(`${req.tag} Skipping trackPurchaseConversion`, {
                                cancelled,
                                claim
                            });
                        }
                    } else {
                        console.info(`${req.tag} Skipping claim — advertising consent not granted`);
                    }
                } else {
                    console.info(`${req.tag} Skipping claim — already tracked locally in sessionStorage`);
                }
            } catch (err) {
                console.warn(`${req.tag} Conversion claim/track threw:`, err);
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

            console.info(`${req.tag} PaymentSuccess flow finished`, {
                cancelled,
                isLoadingWillBe: cancelled ? 'unchanged' : false
            });
        };

        run();
        return () => {
            cancelled = true;
            console.info(`${req.tag} useEffect cleanup (cancelled=true)`, {
                effectRun,
                timestamp: new Date().toISOString()
            });
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
