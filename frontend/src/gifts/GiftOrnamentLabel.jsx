import React from 'react';
import { Box, Typography } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

function Ornament() {
    return (
        <AutoAwesomeIcon
            aria-hidden
            sx={{
                color: '#d8472a',
                fontSize: { xs: 14, sm: 16 },
                flexShrink: 0,
                opacity: 0.9
            }}
        />
    );
}

/** Centered label with decorative sparkles on both sides (newsletter-banner style). */
export default function GiftOrnamentLabel({ children, sx = {}, typographySx = {} }) {
    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                ...sx
            }}
        >
            <Ornament />
            <Typography
                component="span"
                sx={{
                    fontWeight: 700,
                    color: '#002144',
                    fontSize: { xs: '0.95rem', sm: '1.05rem' },
                    lineHeight: 1.3,
                    textAlign: 'center',
                    ...typographySx
                }}
            >
                {children}
            </Typography>
            <Ornament />
        </Box>
    );
}
