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
import { trackPurchase as trackMetaPurchase } from '../analytics/metaTracking';
import {
    trackGa4Purchase,
    hasGa4PurchaseBeenTracked,
    loadPendingGa4Purchase,
    clearPendingGa4Purchase
} from '../analytics/ga4Tracking';
import { claimAdsConversion, fetchPurchaseSummary } from '../api/orders';
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
    // Keep latest clearCart without putting it in effect deps (extra safety)
    const clearCartRef = useRef(clearCart);
    clearCartRef.current = clearCart;

    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    // Primitive URL params — stable deps (avoid searchParams / location.state object identity)
    const state = location.state || {};
    const orderId = searchParams.get('orderId') || state.orderId || null;
    const amountParam = searchParams.get('amount') ?? state.amount ?? null;
    const currency = searchParams.get('currency') || state.currency || 'ILS';
    const documentId = searchParams.get('documentId') || state.documentId || null;

    // 1. Mount diagnostics (runs once per component instance)
    if (mountRef.current == null) {
        paymentSuccessMountSeq += 1;
        mountRef.current = {
            mountSeq: paymentSuccessMountSeq,
            isFirstRender: true,
            mountAt: new Date().toISOString()
        };
        console.info(`${ADS_LOG} PaymentSuccess mounted`, {
            mountSeq: mountRef.current.mountSeq,
            orderId,
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

        console.info(`${req.tag} useEffect run`, {
            effectRun,
            mountSeq: mountRef.current?.mountSeq,
            isFirstRender,
            dependencies: {
                orderId,
                amountParam,
                currency,
                documentId
            },
            url: typeof window !== 'undefined' ? window.location.href : null,
            timestamp: new Date().toISOString()
        });

        const run = async () => {
            console.info(`${req.tag} Parsed payment params`, {
                orderId,
                amount: amountParam,
                currency,
                documentId
            });

            if (!orderId) {
                console.warn(`${req.tag} Stopping — missing orderId`);
                if (!cancelled) {
                    setError('Payment details not found');
                    setIsLoading(false);
                }
                return;
            }

            const displayAmount = amountParam != null && amountParam !== ''
                ? parseFloat(amountParam)
                : null;

            if (!cancelled) {
                setPaymentDetails({
                    orderId,
                    amount: displayAmount,
                    currency,
                    documentId
                });
            }

            // Ads/Meta and GA4 purchase run independently (different consent categories).
            // Run in parallel so webhook retries do not stack sequentially.
            const adsAndMetaTask = (async () => {
                try {
                    const locallyTracked = wasPurchaseTrackedLocally(String(orderId));
                    console.info(`${req.tag} sessionStorage check wasPurchaseTrackedLocally`, {
                        orderId: String(orderId),
                        alreadyTrackedLocally: locallyTracked
                    });

                    if (!locallyTracked) {
                        const consent = bootstrapConsent();
                        const advertisingGranted = hasConsent(CATEGORY_IDS.ADVERTISING);
                        console.info(`${req.tag} Consent loaded`, {
                            consent: consent || getConsent(),
                            advertisingGranted
                        });

                        if (advertisingGranted) {
                            console.info(`${req.tag} Before claimAdsConversion`, {
                                orderId,
                                timestamp: new Date().toISOString()
                            });

                            const claim = await claimAdsConversion(orderId, { requestId: req });

                            console.info(`${req.tag} After claimAdsConversion`, {
                                claim,
                                alreadySent: claim?.alreadySent ?? null,
                                transactionId: claim?.transactionId ?? null,
                                value: claim?.value ?? null,
                                currency: claim?.currency ?? null,
                                cancelled
                            });

                            if (claim && claim.alreadySent === false) {
                                const conversionPayload = {
                                    value: claim.value,
                                    currency: claim.currency,
                                    transactionId: claim.transactionId
                                };
                                console.info(`${req.tag} Before trackPurchaseConversion`, {
                                    payload: conversionPayload,
                                    effectCancelled: cancelled
                                });

                                trackPurchaseConversion(conversionPayload, { requestId: req });
                                markPurchaseTrackedLocally(String(claim.transactionId));

                                try {
                                    trackMetaPurchase({
                                        orderId: claim.transactionId || orderId,
                                        value: claim.value,
                                        currency: claim.currency || currency
                                    });
                                } catch (metaErr) {
                                    console.warn(`${req.tag} Meta Purchase tracking threw:`, metaErr);
                                }

                                console.info(`${req.tag} Marked transaction in sessionStorage`, {
                                    transactionId: String(claim.transactionId)
                                });
                            } else if (claim && claim.alreadySent) {
                                markPurchaseTrackedLocally(String(orderId));
                                console.info(`${req.tag} Claim alreadySent — marked orderId locally, skipped gtag`, {
                                    orderId: String(orderId)
                                });

                                try {
                                    trackMetaPurchase({
                                        orderId,
                                        value: displayAmount,
                                        currency
                                    });
                                } catch (metaErr) {
                                    console.warn(`${req.tag} Meta Purchase tracking threw:`, metaErr);
                                }
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
            })();

            const ga4PurchaseTask = (async () => {
                try {
                    bootstrapConsent();
                    const analyticsGranted = hasConsent(CATEGORY_IDS.ANALYTICS);
                    if (!analyticsGranted) {
                        console.info(`${req.tag} Skipping GA4 purchase — analytics consent not granted`);
                        return;
                    }
                    if (hasGa4PurchaseBeenTracked(String(orderId))) {
                        console.info(`${req.tag} Skipping GA4 purchase — already tracked`, {
                            orderId: String(orderId)
                        });
                        return;
                    }

                    let summary = null;
                    try {
                        summary = await fetchPurchaseSummary(orderId);
                    } catch (summaryErr) {
                        console.warn(`${req.tag} GA4 purchase-summary fetch threw:`, summaryErr);
                    }

                    const pending = loadPendingGa4Purchase(orderId);
                    const transactionId = summary?.transactionId
                        || pending?.transaction_id
                        || String(orderId);
                    const purchaseValue = summary?.value != null
                        ? summary.value
                        : (pending?.value != null ? pending.value : displayAmount);
                    const purchaseCurrency = summary?.currency
                        || pending?.currency
                        || currency
                        || 'ILS';
                    const purchaseItems = (summary?.items && summary.items.length)
                        ? summary.items
                        : (pending?.items || []);

                    const canFire = Boolean(summary?.transactionId)
                        || (pending && purchaseValue != null && !Number.isNaN(Number(purchaseValue)));

                    if (canFire && purchaseValue != null && !Number.isNaN(Number(purchaseValue))) {
                        trackGa4Purchase({
                            transactionId,
                            value: purchaseValue,
                            currency: purchaseCurrency,
                            items: purchaseItems
                        });
                        clearPendingGa4Purchase(orderId);
                        console.info(`${req.tag} GA4 purchase dispatched`, {
                            transactionId,
                            value: purchaseValue,
                            currency: purchaseCurrency,
                            itemCount: purchaseItems.length,
                            source: summary ? 'purchase-summary' : 'pending-checkout'
                        });
                    } else {
                        console.info(`${req.tag} Skipping GA4 purchase — no paid summary or pending items`, {
                            orderId: String(orderId),
                            hasSummary: Boolean(summary),
                            hasPending: Boolean(pending)
                        });
                    }
                } catch (ga4Err) {
                    console.warn(`${req.tag} GA4 purchase tracking threw:`, ga4Err);
                }
            })();

            await Promise.all([adsAndMetaTask, ga4PurchaseTask]);

            try {
                clearCartRef.current();
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
        // Intentionally primitive deps only — clearCart is via ref (was causing infinite loop)
    }, [orderId, amountParam, currency, documentId]);

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewInvoice = () => {
        if (paymentDetails?.documentId) {
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
                <Box
                    sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: { xs: -7, sm: -7 },
                        width: { xs: 300, sm: 400 },
                        height: { xs: 300, sm: 400 }
                    }}
                >
                    <Box
                        component="img"
                        src={`${process.env.PUBLIC_URL || ''}/confetti.png`}
                        alt=""
                        aria-hidden
                        sx={{
                            position: 'absolute',
                            // Negative top moves confetti up behind the checkmark
                            top: { xs: -52, sm: -16 },
                            left: 0,
                            right: 0,
                            bottom: 'auto',
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            zIndex: 0,
                            opacity: 0.95
                        }}
                    />
                    <CheckCircle
                        sx={{
                            position: 'relative',
                            zIndex: 1,
                            fontSize: 80,
                            color: 'success.main',
                            filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.85))'
                        }}
                    />
                </Box>

                <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                        color: 'success.main',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 5
                    }}
                >
                    {t.paymentSuccess}
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        color: 'text.secondary',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        mb: 5
                    }}
                >
                    {t.thankYouPurchaseTitle}
                    <br />
                    {t.thankYouPurchaseDescription}
                    <br />
                    {t.thankYouPurchaseDescription2}
                </Typography>

                {paymentDetails && (
                    <Box sx={{
                        backgroundColor: 'rgba(245, 240, 227, 0.5)',
                        borderRadius: 2,
                        p: 3,
                        mb: 10,
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
                                ₪{paymentDetails.amount != null && !Number.isNaN(paymentDetails.amount)
                                    ? paymentDetails.amount.toFixed(2)
                                    : '—'}
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

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>

                    <Button
                        variant="contained"
                        onClick={handleContinueShopping}
                        size='large'
                        sx={{
                            backgroundColor: 'rgba(229, 90, 61, 1)',
                            // Keep border width constant so hover doesn't resize the button
                            border: '1px solid transparent',
                            boxSizing: 'border-box',
                            '&:hover': {
                                backgroundColor: 'rgba(253, 252, 252, 0.9)',
                                color: 'rgba(229, 90, 61, 1)',
                                border: '1px solid rgba(229, 90, 61, 0.9)'
                            },
                            direction: isHebrew ? 'rtl' : 'ltr'
                        }}
                    >
                        {isHebrew ? t.backToWebsite : t.continueShopping}
                    </Button>
                </Box>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}>
                        {t.paymentSuccessNote}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
