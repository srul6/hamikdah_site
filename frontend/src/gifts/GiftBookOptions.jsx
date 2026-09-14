import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../utils/imageUtils';

const FRAME_COLOR = 'rgba(199, 61, 34, 1)';
const CARD_RADIUS = 12;

export function giftBookImageSrc(book) {
    const raw =
        book?.imageUrls?.[0] ||
        book?.image_urls?.[0] ||
        book?.imageUrl ||
        book?.image_url ||
        '';
    return getImageUrl(raw);
}

/**
 * One-book-at-a-time gift gallery with arrows, title, and Select button.
 * Orange border appears around the frame after the book is selected.
 */
export default function GiftBookOptions({
    books = [],
    selectedId = '',
    selectedIds = null,
    onSelect,
    selectLabel,
    selectDisabled = false,
    beforeSelectButton = null,
    large = true
}) {
    const { isHebrew } = useLanguage();
    const list = useMemo(() => (books || []).filter(Boolean), [books]);

    const selectedIndex = useMemo(() => {
        if (!selectedId || !list.length) return -1;
        return list.findIndex((b) => String(b.id) === String(selectedId));
    }, [list, selectedId]);

    const [index, setIndex] = useState(() =>
        selectedIndex >= 0 ? selectedIndex : 0
    );
    const [flashArrow, setFlashArrow] = useState(null); // 'prev' | 'next' | null

    // Keep carousel in sync when selection changes from outside
    useEffect(() => {
        if (selectedIndex >= 0) setIndex(selectedIndex);
    }, [selectedIndex]);

    // Clamp if book list shrinks
    useEffect(() => {
        if (!list.length) return;
        setIndex((i) => Math.min(Math.max(0, i), list.length - 1));
    }, [list.length]);

    if (!list.length) return null;

    const safeIndex = Math.min(Math.max(0, index), list.length - 1);
    const book = list[safeIndex];
    const src = giftBookImageSrc(book);
    const selectedIdSet = Array.isArray(selectedIds)
        ? selectedIds.map((id) => String(id))
        : null;
    const isSelected = selectedIdSet
        ? selectedIdSet.includes(String(book.id))
        : String(selectedId) === String(book.id);
    const canPrev = list.length > 1;
    const canNext = list.length > 1;

    const flash = (side) => {
        setFlashArrow(side);
        window.setTimeout(() => setFlashArrow(null), 160);
    };

    const goPrev = () => {
        if (!canPrev) return;
        flash('prev');
        setIndex((i) => (i - 1 + list.length) % list.length);
    };
    const goNext = () => {
        if (!canNext) return;
        flash('next');
        setIndex((i) => (i + 1) % list.length);
    };

    // In RTL, visual "next" is still chevron that points toward reading direction end
    const PrevIcon = isHebrew ? ChevronRightIcon : ChevronLeftIcon;
    const NextIcon = isHebrew ? ChevronLeftIcon : ChevronRightIcon;

    const imgMax = large
        ? { xs: 150, sm: 180, md: 200 }
        : { xs: 120, sm: 140, md: 160 };

    const arrowSx = (side) => ({
        color: flashArrow === side ? '#fff' : '#d8472a',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'color 0.12s ease',
        '&:hover': {
            backgroundColor: 'transparent',
            color: flashArrow === side ? '#fff' : '#d8472a'
        },
        '&:active': {
            backgroundColor: 'transparent'
        },
        '&.Mui-disabled': { color: 'rgba(0,33,68,0.2)' }
    });

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.25,
                boxSizing: 'border-box',
                WebkitTapHighlightColor: 'transparent'
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 0.5, sm: 1 }
                }}
            >
                <IconButton
                    type="button"
                    onClick={goPrev}
                    disableRipple
                    disableFocusRipple
                    disabled={!canPrev}
                    aria-label="previous book"
                    sx={arrowSx('prev')}
                >
                    <PrevIcon />
                </IconButton>

                <Box
                    sx={{
                        flex: '1 1 auto',
                        maxWidth: { xs: 180, sm: 220 },
                        borderRadius: `${CARD_RADIUS}px`,
                        border: isSelected
                            ? `1.5px solid ${FRAME_COLOR}`
                            : '1.5px solid rgba(0, 33, 68, 0.14)',
                        backgroundColor: '#fff',
                        p: { xs: 1, sm: 1.25 },
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s ease',
                        WebkitTapHighlightColor: 'transparent'
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            height: imgMax,
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            backgroundColor: '#ebe4d4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {src ? (
                            <Box
                                component="img"
                                src={src}
                                alt={book.title || ''}
                                draggable={false}
                                sx={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    display: 'block',
                                    userSelect: 'none',
                                    pointerEvents: 'none'
                                }}
                            />
                        ) : (
                            <CardGiftcardIcon sx={{ color: '#d8472a', fontSize: 48 }} />
                        )}
                    </Box>
                </Box>

                <IconButton
                    type="button"
                    onClick={goNext}
                    disableRipple
                    disableFocusRipple
                    disabled={!canNext}
                    aria-label="next book"
                    sx={arrowSx('next')}
                >
                    <NextIcon />
                </IconButton>
            </Box>

            <Typography
                sx={{
                    fontWeight: isSelected ? 700 : 600,
                    color: '#002144',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    lineHeight: 1.25,
                    textAlign: 'center',
                    px: 1
                }}
            >
                {book.title}
            </Typography>

            {list.length > 1 ? (
                <Typography
                    sx={{
                        fontSize: '0.75rem',
                        color: '#777',
                        mt: -0.5
                    }}
                >
                    {safeIndex + 1} / {list.length}
                </Typography>
            ) : null}

            {beforeSelectButton}

            {selectLabel ? (
                <Button
                    variant="contained"
                    disabled={selectDisabled}
                    onClick={() => onSelect && onSelect(book.id)}
                    sx={{
                        mt: 0.5,
                        mb: { xs: 1.5, sm: 0.5 },
                        minWidth: 140,
                        backgroundColor: '#d8472a',
                        color: '#f5f0e3',
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2.5,
                        WebkitTapHighlightColor: 'transparent',
                        '&:hover': { backgroundColor: '#c03d24' },
                        '&.Mui-disabled': {
                            backgroundColor: 'rgba(216, 71, 42, 0.4)',
                            color: 'rgba(245, 240, 227, 0.85)'
                        }
                    }}
                >
                    {selectLabel}
                </Button>
            ) : null}
        </Box>
    );
}
