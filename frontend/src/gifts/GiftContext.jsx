import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import {
    saveCartGiftsToCookie,
    getCartGiftsFromCookie,
    clearCartGiftsCookie,
    markGiftsSeenOnCart,
    getGiftsSeenOnCart,
    clearGiftsSeenOnCart,
    markGiftsDeclined,
    getGiftsDeclined,
    clearGiftsDeclined
} from '../utils/cookieManager';
import {
    applyAutoAssignments,
    findMissingGiftSelections,
    flattenGiftSelections
} from '../utils/giftSlots';
import GiftCheckoutModal from './GiftCheckoutModal';
import GiftLineSelectors from './GiftLineSelectors';

const GiftContext = createContext(null);

export function useGifts() {
    const ctx = useContext(GiftContext);
    if (!ctx) throw new Error('useGifts must be used within GiftProvider');
    return ctx;
}

export function GiftProvider({ children }) {
    const { cart } = useCart();
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const navigate = useNavigate();

    const [promotions, setPromotions] = useState([]);
    const [giftSelections, setGiftSelections] = useState(() => getCartGiftsFromCookie());
    const [unlockedNotice, setUnlockedNotice] = useState(null);
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [pendingCheckout, setPendingCheckout] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.gifts}/promotions`);
                const data = await res.json().catch(() => ({}));
                if (!cancelled && data.success && Array.isArray(data.promotions)) {
                    setPromotions(data.promotions);
                }
            } catch (_) {
                /* keep empty */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        // Do not re-auto-assign gifts after the shopper declined them.
        if (getGiftsDeclined()) return;
        setGiftSelections((prev) => applyAutoAssignments(cart, promotions, prev));
    }, [cart, promotions]);

    useEffect(() => {
        saveCartGiftsToCookie(giftSelections);
    }, [giftSelections]);

    const promotionForProduct = useCallback(
        (productId) => promotions.find((p) => String(p.productId) === String(productId)) || null,
        [promotions]
    );

    const setSlotSelection = useCallback((cartUniqueId, slotIndex, bookId) => {
        // Choosing a gift again cancels a prior “I don’t want a gift”.
        clearGiftsDeclined();
        setGiftSelections((prev) => ({
            ...prev,
            [String(cartUniqueId)]: {
                ...(prev[String(cartUniqueId)] || {}),
                [String(slotIndex)]: bookId
            }
        }));
    }, []);

    const notifyGiftUnlocked = useCallback(
        (product, selectedColor = null) => {
            const promo = promotionForProduct(product?.id);
            if (!promo) return;
            const books = promo.books || [];
            if (!books.length && !(promo.bookIds || []).length) return;

            const colorId = selectedColor
                ? selectedColor.name || selectedColor.name_en
                : null;
            const uniqueId = colorId ? `${product.id}-${colorId}` : String(product.id);

            setUnlockedNotice({
                productId: product.id,
                uniqueId,
                name: product.name_he || product.name_en || product.name,
                selectedColor
            });
        },
        [promotionForProduct]
    );

    const clearGiftSelections = useCallback(() => {
        setGiftSelections({});
        clearCartGiftsCookie();
        clearGiftsSeenOnCart();
        clearGiftsDeclined();
    }, []);

    /** Explicit opt-out: clear all picks and do not attach gifts to the order. */
    const declineAllGifts = useCallback(() => {
        setGiftSelections({});
        clearCartGiftsCookie();
        markGiftsDeclined();
        markGiftsSeenOnCart();
    }, []);

    useEffect(() => {
        if (!cart.length) {
            clearGiftSelections();
        }
    }, [cart.length, clearGiftSelections]);

    const getFlattenedSelections = useCallback(() => {
        if (getGiftsDeclined()) return [];
        const synced = applyAutoAssignments(cart, promotions, giftSelections);
        return flattenGiftSelections(synced, cart);
    }, [cart, promotions, giftSelections]);

    const missingSelections = useMemo(
        () => findMissingGiftSelections(cart, promotions, giftSelections),
        [cart, promotions, giftSelections]
    );

    const ensureGiftsBeforeCheckout = useCallback(
        (onReady, options = {}) => {
            const hasGiftItems = (cart || []).some((item) => {
                const promo = promotions.find((p) => String(p.productId) === String(item.id));
                if (!promo) return false;
                return (promo.books || promo.bookIds || []).length > 0;
            });

            // Checkout page only: show banner if gifts apply AND
            // shopper did not already handle gifts on the cart (or still missing a pick).
            if (options.showGiftBanner && hasGiftItems) {
                if (getGiftsDeclined()) {
                    if (typeof onReady === 'function') onReady();
                    return true;
                }
                const missing = findMissingGiftSelections(cart, promotions, giftSelections);
                const seenOnCart = getGiftsSeenOnCart();
                if (missing.length === 0 && seenOnCart) {
                    if (typeof onReady === 'function') onReady();
                    return true;
                }
                setPendingCheckout(() => onReady);
                setCheckoutModalOpen(true);
                return false;
            }

            if (typeof onReady === 'function') onReady();
            return true;
        },
        [cart, promotions, giftSelections]
    );

    const handleModalComplete = useCallback(() => {
        setCheckoutModalOpen(false);
        const cb = pendingCheckout;
        setPendingCheckout(null);
        if (typeof cb === 'function') cb();
    }, [pendingCheckout]);

    const unlockedCartItem = useMemo(() => {
        if (!unlockedNotice) return null;
        const fromCart = cart.find(
            (item) =>
                String(item.uniqueId != null ? item.uniqueId : item.id) ===
                String(unlockedNotice.uniqueId)
        );
        if (fromCart) return fromCart;
        return {
            id: unlockedNotice.productId,
            uniqueId: unlockedNotice.uniqueId,
            quantity: 1,
            name_he: unlockedNotice.name,
            name_en: unlockedNotice.name
        };
    }, [unlockedNotice, cart]);

    const unlockedPromo = unlockedNotice
        ? promotionForProduct(unlockedNotice.productId)
        : null;
    const unlockedNeedsChoice =
        (unlockedPromo?.books || unlockedPromo?.bookIds || []).length > 1;

    const value = useMemo(
        () => ({
            promotions,
            giftSelections,
            setSlotSelection,
            markGiftsSeenOnCart,
            promotionForProduct,
            notifyGiftUnlocked,
            ensureGiftsBeforeCheckout,
            getFlattenedSelections,
            missingSelections,
            clearGiftSelections,
            declineAllGifts
        }),
        [
            promotions,
            giftSelections,
            setSlotSelection,
            promotionForProduct,
            notifyGiftUnlocked,
            ensureGiftsBeforeCheckout,
            getFlattenedSelections,
            missingSelections,
            clearGiftSelections,
            declineAllGifts
        ]
    );

    return (
        <GiftContext.Provider value={value}>
            {children}

            <Dialog
                open={!!unlockedNotice && !!unlockedCartItem}
                onClose={() => setUnlockedNotice(null)}
                maxWidth={false}
                fullWidth={false}
                dir={isHebrew ? 'rtl' : 'ltr'}
                PaperProps={{
                    sx: {
                        width: { xs: 'min(92vw, 360px)', sm: 380 },
                        maxWidth: 380,
                        m: 2,
                        borderRadius: 3,
                        backgroundColor: '#f5f0e3',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#002144', pb: 1 }}>
                    {(t.giftUnlockedMessage || '').replace(
                        '{product}',
                        unlockedNotice?.name || ''
                    )}
                </DialogTitle>
                <DialogContent>
                    {unlockedCartItem ? (
                        <GiftLineSelectors item={unlockedCartItem} hideOuterChrome={false} />
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: 'wrap' }}>
                    <Button
                        onClick={() => setUnlockedNotice(null)}
                        sx={{
                            color: '#002144',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 33, 68, 0.06)',
                                color: '#002144'
                            }
                        }}
                    >
                        {t.giftSelectLater}
                    </Button>
                    {unlockedNeedsChoice ? (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setUnlockedNotice(null);
                                navigate('/cart');
                            }}
                            sx={{
                                backgroundColor: '#d8472a',
                                '&:hover': { backgroundColor: '#c03d24' }
                            }}
                        >
                            {t.giftSelectNow}
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => setUnlockedNotice(null)}
                            sx={{
                                backgroundColor: '#d8472a',
                                '&:hover': { backgroundColor: '#c03d24' }
                            }}
                        >
                            {t.giftGotIt || 'OK'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <GiftCheckoutModal open={checkoutModalOpen} onComplete={handleModalComplete} />
        </GiftContext.Provider>
    );
}
