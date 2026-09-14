import React, { useMemo } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GiftBookOptions from './GiftBookOptions';

/**
 * One carousel for all gift slots on a line.
 * Button stays "Select"; progress sits above it; picks listed with remove (X).
 */
export default function GiftMultiSlotPicker({
    books = [],
    slots = [],
    selectionsMap = {},
    onAssignBook,
    onClearSlot,
    selectLabel,
    progressLabel,
    large = true
}) {
    const selectedEntries = useMemo(() => {
        return (slots || [])
            .map((s) => {
                const id = selectionsMap[s.slotIndex] ?? selectionsMap[String(s.slotIndex)] ?? '';
                if (id == null || id === '') return null;
                const book = (books || []).find((b) => String(b.id) === String(id));
                return {
                    slotIndex: s.slotIndex,
                    bookId: id,
                    title: book?.title || String(id)
                };
            })
            .filter(Boolean);
    }, [slots, selectionsMap, books]);

    const selectedIds = selectedEntries.map((e) => e.bookId);
    const selectedCount = selectedEntries.length;
    const total = (slots || []).length;
    const slotsFull = selectedCount >= total && total > 0;

    const progressText =
        typeof progressLabel === 'function'
            ? progressLabel(selectedCount, total)
            : `${selectedCount} of ${total} selected`;

    const handleSelect = (bookId) => {
        if (slotsFull || typeof onAssignBook !== 'function') return;
        onAssignBook(bookId, { selectedCount, total });
    };

    return (
        <Box sx={{ width: '100%' }}>
            <GiftBookOptions
                books={books}
                selectedIds={selectedIds}
                large={large}
                selectLabel={selectLabel}
                selectDisabled={slotsFull}
                beforeSelectButton={
                    <Typography
                        sx={{
                            color: '#d8472a',
                            fontWeight: 700,
                            fontSize: { xs: '0.85rem', sm: '0.92rem' },
                            textAlign: 'center',
                            lineHeight: 1.3,
                            mt: 0.25,
                            mb: 0.25
                        }}
                    >
                        {progressText}
                    </Typography>
                }
                onSelect={handleSelect}
            />

            {selectedEntries.length ? (
                <Box
                    sx={{
                        mt: 1,
                        mb: { xs: 0.5, sm: 0 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        width: '100%'
                    }}
                >
                    {selectedEntries.map((entry) => (
                        <Box
                            key={`slot-${entry.slotIndex}`}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.25,
                                maxWidth: '100%',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1.5,
                                backgroundColor: 'rgba(0, 33, 68, 0.05)'
                            }}
                        >
                            <Typography
                                sx={{
                                    color: '#002144',
                                    fontWeight: 600,
                                    fontSize: { xs: '0.82rem', sm: '0.88rem' },
                                    textAlign: 'center',
                                    lineHeight: 1.3,
                                    maxWidth: 220
                                }}
                            >
                                {entry.title}
                            </Typography>
                            <IconButton
                                type="button"
                                size="small"
                                aria-label="remove gift selection"
                                disableRipple
                                onClick={() =>
                                    onClearSlot && onClearSlot(entry.slotIndex)
                                }
                                sx={{
                                    color: '#d8472a',
                                    p: 0.35,
                                    WebkitTapHighlightColor: 'transparent',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        color: '#c03d24'
                                    }
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            ) : null}
        </Box>
    );
}

/** Assign bookId to the first empty slot. Returns null when all slots are full. */
export function assignBookToNextSlot(slots, selectionsMap, bookId) {
    const map = selectionsMap && typeof selectionsMap === 'object' ? selectionsMap : {};
    const empty = (slots || []).find((s) => {
        const val = map[s.slotIndex] ?? map[String(s.slotIndex)];
        return val == null || val === '';
    });
    if (!empty) return null;
    return { slotIndex: empty.slotIndex, complete: false };
}
