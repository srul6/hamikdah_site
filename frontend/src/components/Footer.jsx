import React from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Link,
    IconButton,
    Divider
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <Box
            sx={{
                backgroundColor: 'rgba(229, 90, 61, 1)', // Changed to match global background
                borderTop: '1px solid #e0e0e0',
                py: 4,
                mt: 'auto'
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
                            Hamikdash Store
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                lineHeight: 1.6,
                                mb: 2
                            }}
                        >
                            Your trusted source for authentic Jewish religious items and spiritual artifacts.
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                mb: 1
                            }}
                        >
                            📧 info@hamikdash.com
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                mb: 1
                            }}
                        >
                            📞 +1 (555) 123-4567
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgb(245, 240, 227)'
                            }}
                        >
                            📍 123 Jewish Quarter, Jerusalem, Israel
                        </Typography>
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
                            Follow Us
                        </Typography>

                        {/* Social Media Icons */}
                        <Box sx={{ display: 'flex', gap: 0 }}>
                            <IconButton
                                component="a"
                                href="https://facebook.com/hamikdashstore"
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
                        © {currentYear} Hamikdash Store. All rights reserved.
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
                            href="/privacy"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    color: '#0071e3'
                                }
                            }}
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    color: '#0071e3'
                                }
                            }}
                        >
                            Terms of Service
                        </Link>
                        <Link
                            href="/shipping"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    color: '#0071e3'
                                }
                            }}
                        >
                            Shipping Info
                        </Link>
                        <Link
                            href="/returns"
                            sx={{
                                color: 'rgb(245, 240, 227)',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                '&:hover': {
                                    color: '#0071e3'
                                }
                            }}
                        >
                            Returns
                        </Link>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
} 