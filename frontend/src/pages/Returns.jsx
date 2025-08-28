import React from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function Returns() {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];



    return (
        <Box sx={{ py: 4, minHeight: '100vh', backgroundColor: 'rgb(245, 240, 227)', mt: 8 }}>
            <Container maxWidth="md">
                <Paper elevation={0} sx={{
                    p: 4,
                    backgroundColor: 'white',
                    direction: isHebrew ? 'rtl' : 'ltr',
                    textAlign: isHebrew ? 'right' : 'left'
                }}>
                    <Typography variant="h3" component="h1" gutterBottom sx={{
                        color: 'rgba(229, 90, 61, 1)',
                        fontWeight: 600,
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: 'center',
                        mb: 4
                    }}>
                        {t.returnsTitle || 'Returns and Refunds Policy'}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        {t.returnPeriod}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.returnPeriodText}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        {t.eligibleItems}
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <CheckCircleIcon sx={{ color: 'green' }} />
                            </ListItemIcon>
                            <ListItemText primary={t.notOpened} sx={{ direction: isHebrew ? 'rtl' : 'ltr' }} />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <CheckCircleIcon sx={{ color: 'green' }} />
                            </ListItemIcon>
                            <ListItemText primary={t.wrapperNotOpened} sx={{ direction: isHebrew ? 'rtl' : 'ltr' }} />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <CheckCircleIcon sx={{ color: 'green' }} />
                            </ListItemIcon>
                            <ListItemText primary={t.notDamaged} sx={{ direction: isHebrew ? 'rtl' : 'ltr' }} />
                        </ListItem>

                    </List>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        {t.nonEligibleItems}
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <CancelIcon sx={{ color: 'red' }} />
                            </ListItemIcon>
                            <ListItemText primary={t.openedOrDamaged} sx={{ direction: isHebrew ? 'rtl' : 'ltr' }} />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <CancelIcon sx={{ color: 'red' }} />
                            </ListItemIcon>
                            <ListItemText primary={t.over14Days} sx={{ direction: isHebrew ? 'rtl' : 'ltr' }} />
                        </ListItem>

                    </List>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        {t.returnProcess}
                    </Typography>

                    <List>
                        <ListItem>
                            <ListItemText
                                primary={t.contactWithin14Days}
                                secondary={t.contactDetails}
                                sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary={t.packageSecurely}
                                sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary={t.shipToAddress}
                                secondary={t.address}
                                sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                            />
                        </ListItem>
                    </List>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        {t.refundTiming}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.refundTimingText}
                    </Typography>
                    <List>
                        <ListItem>
                            <ListItemIcon>
                                <CheckCircleIcon sx={{ color: 'green' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={t.refund5to7Days}
                                secondary={t.shippingNotIncluded}
                                sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <CheckCircleIcon sx={{ color: 'green' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={t.refundSameMethod}
                                sx={{ direction: isHebrew ? 'rtl' : 'ltr' }}
                            />
                        </ListItem>
                    </List>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        {t.damagedItems}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.damagedItemsText}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.damagedItemsNote}
                    </Typography>

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)', mt: 4 }}>
                        {t.shippingCosts}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.shippingCostsText}
                    </Typography>

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h5" gutterBottom sx={{ color: 'rgba(229, 90, 61, 1)' }}>
                        {t.contactUs}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {t.contactUsText}
                    </Typography>
                    <Typography variant="body1" paragraph sx={{ ml: 2 }}>
                        Email: {t.returnsEmail}<br />
                        {isHebrew ? 'טלפון' : 'Phone'}: {t.returnsPhone}<br />
                        {isHebrew ? 'כתובת' : 'Address'}: {t.returnsAddress}
                    </Typography>

                </Paper>
            </Container>
        </Box>
    );
}
