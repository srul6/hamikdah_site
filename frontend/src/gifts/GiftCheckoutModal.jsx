import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { useCart } from '../contexts/CartContext';
import NewsletterBannerImage from '../newsletter/NewsletterBannerImage';
import { useGifts } from './GiftContext';
import { giftBookImageSrc } from './GiftBookOptions';
import GiftOrnamentLabel from './GiftOrnamentLabel';
import GiftMultiSlotPicker from './GiftMultiSlotPicker';
import { buildSlots, findMissingGiftSelections } from '../utils/giftSlots';
import { markGiftsSeenOnCart } from '../utils/cookieManager';

function selectedProgressLabel(t, n, total) {
    return (t.giftSelectedProgress || '{n} of {total} selected')
        .replace('{n}', String(n))
        .replace('{total}', String(total));
}

/**
 * Assign bookId to the first empty combined slot that allows that book.
 */
function assignToNextAllowedSlot(targets, flatMap, bookId) {
    const id = String(bookId);
    return (
        (targets || []).find((t) => {
            const val = flatMap[t.flatIndex] ?? flatMap[String(t.flatIndex)];
            if (val != null && val !== '') return false;
            return t.allowedIds.has(id);
        }) || null
    );
}

/**
 * Checkout-only gift banner.
 * When multiple products grant gifts, all choice slots merge into one picker
 * (cart / unlock UI stay per-product).
 */
export default function GiftCheckoutModal({ open, onComplete }) {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const { cart } = useCart();
    const { promotions, giftSelections, setSlotSelection, declineAllGifts } = useGifts();
    const [closeWhenComplete, setCloseWhenComplete] = useState(false);

    useEffect(() => {
        if (!open) setCloseWhenComplete(false);
    }, [open]);

    const eligibleItems = useMemo(
        () =>
            cart.filter((item) => {
                const promo = promotions.find((p) => String(p.productId) === String(item.id));
                if (!promo) return false;
                return (promo.books || promo.bookIds || []).length > 0;
            }),
        [cart, promotions]
    );

    const missing = useMemo(
        () => findMissingGiftSelections(cart, promotions, giftSelections),
        [cart, promotions, giftSelections]
    );
    const complete = missing.length === 0;

    useEffect(() => {
        if (!open || !closeWhenComplete || !complete) return;
        setCloseWhenComplete(false);
        if (typeof onComplete === 'function') onComplete();
    }, [open, closeWhenComplete, complete, onComplete]);

    /** Combined choice targets across all cart gift lines (checkout only). */
    const combined = useMemo(() => {
        const targets = [];
        const bookById = new Map();
        let autoOnlyBook = null;

        for (const item of eligibleItems) {
            const promo = promotions.find((p) => String(p.productId) === String(item.id));
            if (!promo) continue;
            const books = (promo.books || []).filter(Boolean);
            if (!books.length) continue;

            const uniqueId = String(item.uniqueId != null ? item.uniqueId : item.id);
            const slots = buildSlots({
                quantity: item.quantity,
                giftsPerUnit: promo.giftsPerUnit
            });

            if (books.length === 1) {
                autoOnlyBook = books[0];
                continue;
            }

            const allowedIds = new Set(books.map((b) => String(b.id)));
            for (const b of books) {
                if (b?.id != null) bookById.set(String(b.id), b);
            }
            for (const s of slots) {
                targets.push({
                    flatIndex: targets.length,
                    uniqueId,
                    slotIndex: s.slotIndex,
                    allowedIds
                });
            }
        }

        const flatMap = {};
        for (const target of targets) {
            const map = giftSelections[target.uniqueId] || {};
            const val = map[target.slotIndex] ?? map[String(target.slotIndex)] ?? '';
            if (val != null && val !== '') {
                flatMap[target.flatIndex] = val;
            }
        }

        return {
            targets,
            flatSlots: targets.map((t) => ({ slotIndex: t.flatIndex })),
            flatMap,
            books: Array.from(bookById.values()),
            needsChoice: targets.length > 0,
            totalChoices: targets.length,
            autoOnlyBook: targets.length === 0 ? autoOnlyBook : null
        };
    }, [eligibleItems, promotions, giftSelections]);

    const needsChoice = combined.needsChoice;
    const isDoubleGift = combined.totalChoices === 2;
    const headingTitle = isDoubleGift
        ? t.giftCartTitleDouble
        : needsChoice
          ? t.giftCartTitle
          : t.giftCartTitle;
    const bodyText = isDoubleGift
        ? t.giftCartBodyDouble
        : needsChoice
          ? t.giftCartBodyMulti
          : t.giftCartBody;
    const heroSrc =
        !needsChoice && combined.autoOnlyBook
            ? giftBookImageSrc(combined.autoOnlyBook)
            : '';

    const finish = () => {
        markGiftsSeenOnCart();
        if (typeof onComplete === 'function') onComplete();
    };

    const handleDecline = () => {
        declineAllGifts();
        finish();
    };

    const handleDismiss = () => {
        // X closes without forcing a gift pick (same as declining for this visit).
        if (!complete) declineAllGifts();
        finish();
    };

    return (
        <Dialog
            open={open}
            onClose={handleDismiss}
            maxWidth={false}
            fullWidth={false}
            scroll="body"
            dir={isHebrew ? 'rtl' : 'ltr'}
            PaperProps={{
                sx: {
                    width: {
                        xs: 'min(92vw, 360px)',
                        sm: needsChoice ? 420 : 380
                    },
                    maxWidth: needsChoice ? 420 : 380,
                    borderRadius: 3,
                    backgroundColor: '#f5f0e3',
                    p: 0,
                    m: 2,
                    overflow: 'hidden',
                    position: 'relative'
                }
            }}
        >
            <IconButton
                onClick={handleDismiss}
                aria-label="close"
                sx={{
                    position: 'absolute',
                    top: 8,
                    ...(isHebrew ? { left: 8 } : { right: 8 }),
                    color: '#d8472a',
                    zIndex: 2,
                    backgroundColor: 'transparent',
                    '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#c03d24'
                    }
                }}
            >
                <CloseIcon />
            </IconButton>

            {heroSrc ? (
                <Box sx={{ position: 'relative' }}>
                    <Box
                        sx={{
                            width: '78%',
                            maxWidth: 280,
                            mx: 'auto',
                            pt: { xs: 2, sm: 2.5 },
                            pb: 0.5
                        }}
                    >
                        <NewsletterBannerImage
                            key={heroSrc}
                            src={heroSrc}
                            backgroundColor="#f5f0e3"
                        />
                    </Box>
                </Box>
            ) : null}

            <DialogTitle
                sx={{
                    position: 'relative',
                    pt: heroSrc ? { xs: 2, sm: 2.5 } : { xs: 3, sm: 3.5 },
                    pb: 1.5,
                    px: { xs: 2, sm: 2.5 },
                    color: '#002144',
                    fontWeight: 700,
                    fontSize: { xs: '1.35rem', sm: '1.5rem' },
                    lineHeight: 1.3,
                    textAlign: 'center'
                }}
            >
                {headingTitle}
            </DialogTitle>

            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    justifyContent: 'flex-start',
                    pt: 0.5,
                    pb: 2.5,
                    px: { xs: 2, sm: 2.5 },
                    overflow: 'visible'
                }}
            >
                <Typography
                    sx={{
                        color: '#444',
                        lineHeight: 1.25,
                        fontSize: '0.98rem',
                        textAlign: 'center',
                        maxWidth: 300,
                        mb: needsChoice ? 1.5 : 0.5
                    }}
                >
                    {bodyText}
                </Typography>

                {needsChoice ? (
                    <Box sx={{ width: '100%', mb: 1 }}>
                        <GiftOrnamentLabel sx={{ mb: 1.25 }}>
                            {t.giftChooseTitle}
                        </GiftOrnamentLabel>
                        <GiftMultiSlotPicker
                            books={combined.books}
                            slots={combined.flatSlots}
                            selectionsMap={combined.flatMap}
                            large
                            selectLabel={t.giftSelectBook}
                            progressLabel={(n, total) =>
                                selectedProgressLabel(t, n, total)
                            }
                            onAssignBook={(bookId) => {
                                const target = assignToNextAllowedSlot(
                                    combined.targets,
                                    combined.flatMap,
                                    bookId
                                );
                                if (!target) return;
                                setSlotSelection(
                                    target.uniqueId,
                                    target.slotIndex,
                                    bookId
                                );
                                setCloseWhenComplete(true);
                            }}
                            onClearSlot={(flatIndex) => {
                                const target = combined.targets.find(
                                    (t) => t.flatIndex === flatIndex
                                );
                                if (!target) return;
                                setSlotSelection(
                                    target.uniqueId,
                                    target.slotIndex,
                                    ''
                                );
                                setCloseWhenComplete(false);
                            }}
                        />
                    </Box>
                ) : (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={finish}
                        sx={{
                            mt: 2,
                            backgroundColor: '#d8472a',
                            color: '#f5f0e3',
                            fontWeight: 700,
                            py: 1.1,
                            borderRadius: 2,
                            '&:hover': { backgroundColor: '#c03d24' }
                        }}
                    >
                        {t.giftContinueCheckout}
                    </Button>
                )}

                {!complete ? (
                    <Box
                        component="button"
                        type="button"
                        onClick={handleDecline}
                        sx={{
                            mt: needsChoice ? 1.5 : 1.75,
                            color: '#555',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontFamily: 'inherit',
                            textDecoration: 'underline',
                            textUnderlineOffset: '3px',
                            '&:hover': {
                                color: '#002144',
                                backgroundColor: 'transparent'
                            }
                        }}
                    >
                        {t.giftDeclineGift}
                    </Box>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
