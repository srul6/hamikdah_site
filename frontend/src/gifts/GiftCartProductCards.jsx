import React, { useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { useGifts } from './GiftContext';
import { buildSlots } from '../utils/giftSlots';
import { giftBookImageSrc } from './GiftBookOptions';
import GiftOrnamentLabel from './GiftOrnamentLabel';
import GiftMultiSlotPicker, { assignBookToNextSlot } from './GiftMultiSlotPicker';

const giftChipSx = {
    position: 'absolute',
    top: 8,
    insetInlineStart: 8,
    zIndex: 2,
    backgroundColor: '#d8472a',
    color: '#fff',
    fontWeight: 700,
    '& .MuiChip-icon': { color: '#fff' }
};

function selectedProgressLabel(t, n, total) {
    return (t.giftSelectedProgress || '{n} of {total} selected')
        .replace('{n}', String(n))
        .replace('{total}', String(total));
}

/**
 * Gift line(s) on the cart page.
 * Single book: product-style card with side image.
 * Multiple books: centered text + large book picker (no side image).
 */
export default function GiftCartProductCards({ item }) {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const { promotionForProduct, giftSelections, setSlotSelection, markGiftsSeenOnCart } =
        useGifts();

    const promo = promotionForProduct(item.id);
    const books = (promo?.books || []).filter(Boolean);

    // Visiting cart with a gift marks gifts as handled (skip checkout banner if complete).
    useEffect(() => {
        if (promo && books.length) markGiftsSeenOnCart();
    }, [promo, books.length, markGiftsSeenOnCart]);

    if (!promo || !books.length) return null;

    const uniqueId = String(item.uniqueId != null ? item.uniqueId : item.id);
    const map = giftSelections[uniqueId] || {};
    const slots = buildSlots({
        quantity: item.quantity,
        giftsPerUnit: promo.giftsPerUnit
    });
    const multi = books.length > 1;
    const isDoubleGift = slots.length === 2;
    const headingTitle = isDoubleGift ? t.giftCartTitleDouble : t.giftCartTitle;
    const headingBody = isDoubleGift
        ? t.giftCartBodyDouble
        : multi
            ? t.giftCartBodyMulti
            : t.giftCartBody;

    if (multi) {
        return (
            <Card
                sx={{
                    mb: 2,
                    backgroundColor: 'rgba(245, 240, 227, 0.55)',
                    border: '1px dashed rgba(216, 71, 42, 0.75)',
                    boxShadow: 'none',
                    borderRadius: 2,
                    overflow: 'visible',
                    position: 'relative',
                    maxWidth: { xs: '250px', md: '400px' },
                    width: '100%',
                    mx: 'auto',
                    boxSizing: 'border-box'
                }}
            >
                <Chip
                    icon={<CardGiftcardIcon sx={{ fontSize: '16px !important' }} />}
                    label={t.giftFreeChip}
                    size="small"
                    sx={giftChipSx}
                />
                <CardContent
                    sx={{
                        p: { xs: 1.5, sm: 2.5 },
                        pt: { xs: 5.5, sm: 5.5 },
                        direction: isHebrew ? 'rtl' : 'ltr',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 1.25,
                        width: '100%',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        '&:last-child': { pb: { xs: 1.5, sm: 2.5 } }
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.05rem', sm: '1.25rem' },
                            color: '#002144',
                            lineHeight: 1.3,
                            mt: { xs: 1.25, sm: 0 }
                        }}
                    >
                        {headingTitle}
                    </Typography>
                    <Typography
                        sx={{
                            color: '#d8472a',
                            fontWeight: 600,
                            fontSize: { xs: '0.88rem', sm: '0.98rem' },
                            lineHeight: 1.35,
                            maxWidth: 340
                        }}
                    >
                        {headingBody}
                    </Typography>
                    <Box sx={{ width: '100%', mt: 0.5 }}>
                        <GiftOrnamentLabel sx={{ mb: 1 }}>
                            {t.giftChooseTitle}
                        </GiftOrnamentLabel>
                        <GiftMultiSlotPicker
                            books={books}
                            slots={slots}
                            selectionsMap={map}
                            large
                            selectLabel={t.giftSelectBook}
                            progressLabel={(n, total) => selectedProgressLabel(t, n, total)}
                            onAssignBook={(bookId) => {
                                const next = assignBookToNextSlot(slots, map, bookId);
                                if (!next) return;
                                setSlotSelection(uniqueId, next.slotIndex, bookId);
                            }}
                            onClearSlot={(slotIndex) =>
                                setSlotSelection(uniqueId, slotIndex, '')
                            }
                        />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    const only = books[0];
    return (
        <Card
            sx={{
                mb: 2,
                backgroundColor: 'rgba(245, 240, 227, 0.55)',
                border: '1px dashed rgba(216, 71, 42, 0.75)',
                boxShadow: 'none',
                borderRadius: 2,
                overflow: 'hidden',
                maxWidth: { xs: '250px', md: '400px' },
                width: '100%',
                mx: 'auto'
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: '100%'
                }}
            >
                <Box
                    sx={{
                        width: { xs: '100%', sm: '42%', md: '40%' },
                        flexShrink: 0,
                        position: 'relative'
                    }}
                >
                    <Box
                        sx={{
                            height: { xs: 220, sm: 260, md: 280 },
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ebe4d4',
                            p: 1.5
                        }}
                    >
                        {giftBookImageSrc(only) ? (
                            <Box
                                component="img"
                                src={giftBookImageSrc(only)}
                                alt={only.title || ''}
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    display: 'block'
                                }}
                            />
                        ) : (
                            <CardGiftcardIcon sx={{ color: '#d8472a', fontSize: 48 }} />
                        )}
                    </Box>
                    <Chip
                        icon={<CardGiftcardIcon sx={{ fontSize: '16px !important' }} />}
                        label={t.giftFreeChip}
                        size="small"
                        sx={giftChipSx}
                    />
                </Box>
                <CardContent
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 1.25,
                        p: 2.5,
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: 'center',
                        alignItems: 'center',
                        '&:last-child': { pb: 2.5 }
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.2rem' },
                            color: '#002144',
                            lineHeight: 1.25,
                            mt: { xs: 1.25, sm: 0 }
                        }}
                    >
                        {headingTitle}
                    </Typography>
                    <Typography
                        sx={{
                            color: '#d8472a',
                            fontWeight: 600,
                            fontSize: { xs: '0.85rem', sm: '0.95rem' },
                            lineHeight: 1.35
                        }}
                    >
                        {headingBody}
                    </Typography>
                </CardContent>
            </Box>
        </Card>
    );
}
