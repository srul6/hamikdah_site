import React from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Link,
    IconButton,
    Divider,
    Button
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { language, isHebrew } = useLanguage();
    const t = translations['EN']; // Always use English translations for footer

    // Hebrew text for Terms and Returns
    const termsText = isHebrew ? 'תנאי שימוש' : t.termsOfService;
    const returnsText = isHebrew ? 'החזרות' : t.returns;

    return (
        <Box
            sx={{
                backgroundColor: 'rgba(229, 90, 61, 1)',
                borderTop: '1px solid #e0e0e0',
                py: 4,
                mt: 'auto',
                direction: 'ltr', // Always LTR for English
                textAlign: 'left' // Always left-aligned for English
            }}
        >
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* Company Information */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                color: 'rgb(245, 240, 227)',
                                mb: 2
                            }}
                        >
                            {t.storeName}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                lineHeight: 1.6,
                                mb: 2
                            }}
                        >
                            {t.storeDescription}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            <Button
                                component="a"
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=gilmanor8@gmail.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<EmailIcon />}
                                sx={{
                                    color: 'rgb(245, 240, 227)',
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    minWidth: 'auto',
                                    backgroundColor: 'transparent',
                                    border: '1px solid transparent',
                                    alignSelf: 'flex-start',
                                    '&:hover': {
                                        backgroundColor: 'rgba(245, 240, 227, 0.1)',
                                        border: '1px solid rgb(245, 240, 227)',
                                        color: 'rgb(245, 240, 227)'
                                    }
                                }}
                            >
                                gilmanor8@gmail.com
                            </Button>
                            <Button
                                component="a"
                                href="tel:+972532405276"
                                startIcon={<PhoneIcon />}
                                sx={{
                                    color: 'rgb(245, 240, 227)',
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    minWidth: 'auto',
                                    backgroundColor: 'transparent',
                                    border: '1px solid transparent',
                                    alignSelf: 'flex-start',
                                    '&:hover': {
                                        backgroundColor: 'rgba(245, 240, 227, 0.1)',
                                        border: '1px solid rgb(245, 240, 227)',
                                        color: 'rgb(245, 240, 227)'
                                    }
                                }}
                            >
                                053-2405276
                            </Button>
                            <Button
                                component="a"
                                href="https://maps.google.com/?q=Aliya+7+Netivot+Israel"
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<LocationOnIcon />}
                                sx={{
                                    color: 'rgb(245, 240, 227)',
                                    textTransform: 'none',
                                    fontSize: '0.875rem',
                                    minWidth: 'auto',
                                    backgroundColor: 'transparent',
                                    border: '1px solid transparent',
                                    alignSelf: 'flex-start',
                                    '&:hover': {
                                        backgroundColor: 'rgba(245, 240, 227, 0.1)',
                                        border: '1px solid rgb(245, 240, 227)',
                                        color: 'rgb(245, 240, 227)'
                                    }
                                }}
                            >
                                עליה 7 נתיבות                            </Button>
                        </Box>
                    </Grid>

                    {/* Social Media */}
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: 'rgb(245, 240, 227)',
                                mb: 0
                            }}
                        >
                            {t.followUs}
                        </Typography>

                        {/* Social Media Icons */}
                        <Box sx={{ display: 'flex', gap: 0 }}>
                            <IconButton
                                component="a"
                                href="https://www.facebook.com/share/1CGo7JT8ka/"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    color: 'rgb(245, 240, 227)',
                                    '&:hover': {
                                        color: '#1877f2',
                                        backgroundColor: 'rgba(24, 119, 242, 0.1)'
                                    }
                                }}
                            >
                                <FacebookIcon />
                            </IconButton>
                            <IconButton
                                component="a"
                                href="https://www.instagram.com/b_mikdash/profilecard/?igsh=enMwZ21yZ3h4MGpt"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    color: 'rgb(245, 240, 227)',
                                    '&:hover': {
                                        color: '#e4405f',
                                        backgroundColor: 'rgba(228, 64, 95, 0.1)'
                                    }
                                }}
                            >
                                <InstagramIcon />
                            </IconButton>
                        </Box>
                    </Grid>
                </Grid>

                {/* Divider */}
                <Divider sx={{ my: 3, borderColor: '#e0e0e0' }} />

                {/* Bottom Section */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2
                    }}
                >
                    {/* Copyright */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'rgb(245, 240, 227)',
                            textAlign: { xs: 'center', md: 'left' }
                        }}
                    >
                        © {currentYear} {t.allRightsReserved}
                    </Typography>

                    {/* Legal Links */}
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 3,
                            flexWrap: 'wrap',
                            justifyContent: { xs: 'center', md: 'flex-end' }
                        }}
                    >
                        <Link
                            component={RouterLink}
                            to="/terms"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    color: '#0071e3'
                                }
                            }}
                        >
                            {termsText}
                        </Link>
                        <Link
                            component={RouterLink}
                            to="/returns"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    color: '#0071e3'
                                }
                            }}
                        >
                            {returnsText}
                        </Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
} 