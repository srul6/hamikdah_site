import React from 'react';
import { Box, Typography } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { buildSlots } from '../utils/giftSlots';
import { giftBookImageSrc } from './GiftBookOptions';
import GiftOrnamentLabel from './GiftOrnamentLabel';
import GiftMultiSlotPicker, { assignBookToNextSlot } from './GiftMultiSlotPicker';

/**
 * Shared visual gift UI for unlock dialog / selectors.
 * - 1 book: informational card with image + title
 * - 2+ books (any slot count): progress picker + selected titles with remove
 */
export default function GiftSelectionPanel({
    promo,
    cartUniqueId,
    quantity,
    selectionsMap = {},
    onSelectBook,
    compact = false,
    hideOuterChrome = false
}) {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    if (!promo) return null;

    const books = (promo.books || []).filter(Boolean);
    if (!books.length) return null;

    const slots = buildSlots({
        quantity,
        giftsPerUnit: promo.giftsPerUnit
    });

    const shellSx = hideOuterChrome
        ? { direction: isHebrew ? 'rtl' : 'ltr' }
        : {
            mt: compact ? 1 : 1.5,
            p: { xs: 1.5, sm: 2 },
            backgroundColor: 'rgba(245, 240, 227, 0.95)',
            borderRadius: 2,
            border: '1px solid rgba(216, 71, 42, 0.35)',
            direction: isHebrew ? 'rtl' : 'ltr'
        };

    if (books.length === 1) {
        const only = books[0];
        const img = giftBookImageSrc(only);
        return (
            <Box sx={shellSx}>
                <Typography
                    sx={{
                        fontWeight: 700,
                        color: '#d8472a',
                        mb: 1.25,
                        fontSize: compact ? '0.9rem' : '0.98rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        justifyContent: 'center'
                    }}
                >
                    <CardGiftcardIcon sx={{ fontSize: 20 }} />
                    {t.giftFreeIncludedLabel || t.giftAutoAssigned}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                        sx={{
                            border: '1px solid rgba(0, 33, 68, 0.18)',
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 0.75,
                            maxWidth: 150,
                            backgroundColor: '#fff'
                        }}
                    >
                        <Box
                            sx={{
                                width: compact ? 100 : 140,
                                height: compact ? 100 : 140,
                                borderRadius: 1.5,
                                overflow: 'hidden',
                                backgroundColor: '#ebe4d4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            {img ? (
                                <Box
                                    component="img"
                                    src={img}
                                    alt={only.title || ''}
                                    sx={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        display: 'block'
                                    }}
                                />
                            ) : (
                                <CardGiftcardIcon sx={{ color: '#d8472a', fontSize: 36 }} />
                            )}
                        </Box>
                        <Typography
                            sx={{
                                fontWeight: 600,
                                fontSize: compact ? '0.8rem' : '0.88rem',
                                color: '#002144',
                                textAlign: 'center'
                            }}
                        >
                            {only.title}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    const progressLabel = (n, total) =>
        (t.giftSelectedProgress || '{n} of {total} selected')
            .replace('{n}', String(n))
            .replace('{total}', String(total));

    return (
        <Box sx={shellSx}>
            <GiftOrnamentLabel
                sx={{ mb: 1.25 }}
                typographySx={{
                    color: '#d8472a',
                    fontSize: compact ? '0.9rem' : '0.98rem'
                }}
            >
                {t.giftChooseTitle}
            </GiftOrnamentLabel>
            <GiftMultiSlotPicker
                books={books}
                slots={slots}
                selectionsMap={selectionsMap}
                large={!compact}
                selectLabel={t.giftSelectBook}
                progressLabel={progressLabel}
                onAssignBook={(bookId) => {
                    const next = assignBookToNextSlot(
                        slots,
                        selectionsMap,
                        bookId
                    );
                    if (!next || !onSelectBook) return;
                    onSelectBook(cartUniqueId, next.slotIndex, bookId);
                }}
                onClearSlot={(slotIndex) =>
                    onSelectBook && onSelectBook(cartUniqueId, slotIndex, '')
                }
            />
        </Box>
    );
}
