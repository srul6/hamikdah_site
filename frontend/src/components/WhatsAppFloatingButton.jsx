import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Fab, Tooltip, Typography, useMediaQuery, useTheme, keyframes } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NorthIcon from '@mui/icons-material/North';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { useNewsletter } from '../newsletter/NewsletterContext';
import { WHATSAPP_URL } from '../config';

const gentleBob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const arrowNudge = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
`;

/** Soft 8-point star (rounded tips + valleys), viewBox 0 0 100 100 */
const ROUNDED_STAR_PATH =
    'M44.84 9.75Q50.00 3.00 55.16 9.75L57.46 12.76Q62.63 19.51 71.05 18.39L74.81 17.89Q83.23 16.77 82.11 25.19L81.61 28.95Q80.49 37.37 87.24 42.54L90.25 44.84Q97.00 50.00 90.25 55.16L87.24 57.46Q80.49 62.63 81.61 71.05L82.11 74.81Q83.23 83.23 74.81 82.11L71.05 81.61Q62.63 80.49 57.46 87.24L55.16 90.25Q50.00 97.00 44.84 90.25L42.54 87.24Q37.37 80.49 28.95 81.61L25.19 82.11Q16.77 83.23 17.89 74.81L18.39 71.05Q19.51 62.63 12.76 57.46L9.75 55.16Q3.00 50.00 9.75 44.84L12.76 42.54Q19.51 37.37 18.39 28.95L17.89 25.19Q16.77 16.77 25.19 17.89L28.95 18.39Q37.37 19.51 42.54 12.76Z';

function GiftStarButton({ line1, line2, ariaLabel, isHebrew, onClick }) {
    return (
        <Box
            component="button"
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            sx={{
                appearance: 'none',
                WebkitAppearance: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                width: { xs: 78, sm: 86 },
                height: { xs: 78, sm: 86 },
                p: 0,
                m: 0,
                background: 'transparent',
                backgroundColor: 'transparent',
                color: '#d8472a',
                boxShadow: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${gentleBob} 2.8s ease-in-out infinite`,
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                '&:hover, &:active': {
                    background: 'transparent',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    color: '#f5f0e3',
                    '& .gift-star-shape': {
                        fill: '#d8472a',
                        stroke: '#d8472a'
                    }
                },
                '&:focus-visible': {
                    outline: '2px solid #d8472a',
                    outlineOffset: 3,
                    borderRadius: '50%'
                }
            }}
        >
            <Box
                component="svg"
                viewBox="0 0 100 100"
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            >
                <path
                    className="gift-star-shape"
                    d={ROUNDED_STAR_PATH}
                    fill="transparent"
                    stroke="#d8472a"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    style={{ transition: 'fill 0.15s ease, stroke 0.15s ease' }}
                />
            </Box>

            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0,
                    px: 1,
                    maxWidth: '78%',
                    color: 'inherit',
                    transition: 'color 0.15s ease'
                }}
            >
                <Typography
                    component="span"
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.62rem', sm: '0.68rem' },
                        lineHeight: 1.15,
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: 'center',
                        display: 'block',
                        color: 'inherit'
                    }}
                >
                    {line1}
                </Typography>
                <Typography
                    component="span"
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.62rem', sm: '0.68rem' },
                        lineHeight: 1.15,
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: 'center',
                        display: 'block',
                        color: 'inherit'
                    }}
                >
                    {line2}
                </Typography>
                <NorthIcon
                    aria-hidden
                    sx={{
                        fontSize: { xs: 13, sm: 14 },
                        mt: 0.15,
                        color: 'inherit',
                        animation: `${arrowNudge} 1.6s ease-in-out infinite`
                    }}
                />
            </Box>
        </Box>
    );
}

export default function WhatsAppFloatingButton() {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const { openGiftModal, isModalOpen, modalMode, subscribedThisSession } = useNewsletter();
    const { pathname } = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const isProductPage = pathname.startsWith('/product/');
    const giftModalOpen = isModalOpen && modalMode === 'gift';
    const hideFloating = isMobile && isProductPage;
    const showGiftTeaser = !giftModalOpen && !subscribedThisSession;

    if (hideFloating) return null;

    return (
        <>
            {showGiftTeaser && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 20, sm: 24 },
                        left: { xs: 16, sm: 24 },
                        right: 'auto',
                        zIndex: 1200
                    }}
                >
                    <GiftStarButton
                        line1={t.newsletterGiftTeaserLine1}
                        line2={t.newsletterGiftTeaserLine2}
                        ariaLabel={t.newsletterGiftTeaser}
                        isHebrew={isHebrew}
                        onClick={openGiftModal}
                    />
                </Box>
            )}

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
                        right: { xs: 16, sm: 24 },
                        left: 'auto',
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
                            boxShadow: '0 6px 20px rgba(37, 211, 102, 0.55)'
                        }
                    }}
                >
                    <WhatsAppIcon sx={{ fontSize: { xs: 28, sm: 30 } }} />
                </Fab>
            </Tooltip>
        </>
    );
}
