import React from 'react';
import { useLocation } from 'react-router-dom';
import { Fab, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useLanguage } from '../contexts/LanguageContext';
import { WHATSAPP_URL } from '../config';

export default function WhatsAppFloatingButton() {
    const { isHebrew } = useLanguage();
    const { pathname } = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isProductPage = pathname.startsWith('/product/');

    if (isMobile && isProductPage) return null;

    return (
        <Tooltip title="WhatsApp" placement={isHebrew ? 'left' : 'right'}>
            <Fab
                component="a"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                sx={{
                    position: 'fixed',
                    bottom: { xs: 20, sm: 24 },
                    ...(isHebrew
                        ? { right: { xs: 16, sm: 24 }, left: 'auto' }
                        : { left: { xs: 16, sm: 24 }, right: 'auto' }),
                    zIndex: 1200,
                    backgroundColor: '#25D366',
                    color: '#fff',
                    width: { xs: 52, sm: 56 },
                    height: { xs: 52, sm: 56 },
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.45)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                    '&:hover': {
                        backgroundColor: '#1ebe57',
                        transform: 'translateY(-2px) scale(1.05)',
                        boxShadow: '0 6px 20px rgba(37, 211, 102, 0.55)',
                    },
                }}
            >
                <WhatsAppIcon sx={{ fontSize: { xs: 28, sm: 30 } }} />
            </Fab>
        </Tooltip>
    );
}
