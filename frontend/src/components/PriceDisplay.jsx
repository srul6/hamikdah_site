import React from 'react';
import { Box } from '@mui/material';
import { formatShekel } from '../utils/productPricing';

export const DISCOUNT_STRIKE_COLOR = '#F28C28';

/**
 * Regular price, or — when discounted — the regular price struck through in orange
 * followed by the emphasized discounted price. Order follows the page direction (RTL in Hebrew).
 */
export default function PriceDisplay({
    pricing,
    regularPrice = pricing?.regularPrice,
    finalPrice = pricing?.finalPrice,
    format = formatShekel,
    fontSize,
    className,
    sx,
    regularSx,
    finalSx
}) {
    const regular = Number(regularPrice) || 0;
    const final = finalPrice == null ? regular : Number(finalPrice) || 0;
    const hasDiscount = regular > final;

    if (!hasDiscount) {
        return (
            <Box component="span" className={className} sx={{ fontSize, ...sx }}>
                {format(final)}
            </Box>
        );
    }

    return (
        <Box
            component="span"
            className={className}
            sx={{
                display: 'inline-flex',
                alignItems: 'baseline',
                flexWrap: 'wrap',
                columnGap: '0.4em',
                fontSize,
                ...sx
            }}
        >
            <Box
                component="span"
                sx={{
                    fontSize: '0.75em',
                    fontWeight: 400,
                    opacity: 0.75,
                    textDecoration: 'line-through',
                    textDecorationColor: DISCOUNT_STRIKE_COLOR,
                    textDecorationThickness: '2px',
                    whiteSpace: 'nowrap',
                    ...regularSx
                }}
            >
                {format(regular)}
            </Box>
            <Box
                component="span"
                sx={{
                    fontWeight: 700,
                    color: 'rgba(199, 61, 34, 1)',
                    whiteSpace: 'nowrap',
                    ...finalSx
                }}
            >
                {format(final)}
            </Box>
        </Box>
    );
}
