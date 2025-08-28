import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function Returns() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 2 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                    {t.returnsTitle || 'Returns and Refunds Policy'}
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    1. Return Policy
                </Typography>
                <Typography paragraph>
                    We want you to be completely satisfied with your purchase. If you are not satisfied with your order, you may return it within 30 days of the delivery date for a full refund or exchange.
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    2. Return Conditions
                </Typography>
                <Typography paragraph>
                    To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    3. Return Process
                </Typography>
                <Typography paragraph>
                    To initiate a return, please contact our customer service team with your order number and reason for return. We will provide you with a return authorization number and shipping instructions.
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    4. Shipping Costs
                </Typography>
                <Typography paragraph>
                    Customers are responsible for return shipping costs unless the item was received damaged or incorrect. In such cases, we will cover the return shipping costs.
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    5. Refund Process
                </Typography>
                <Typography paragraph>
                    Once we receive your returned item, we will inspect it and notify you of the refund status. If approved, your refund will be processed and a credit will automatically be applied to your original method of payment within 5-7 business days.
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    6. Damaged or Defective Items
                </Typography>
                <Typography paragraph>
                    If you receive a damaged or defective item, please contact us immediately. We will arrange for a replacement or refund at no additional cost to you.
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    7. Non-Returnable Items
                </Typography>
                <Typography paragraph>
                    Certain items are non-returnable, including personalized or custom-made products, and items marked as final sale.
                </Typography>

                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    8. Contact Information
                </Typography>
                <Typography paragraph>
                    For questions about returns or refunds, please contact our customer service team at support@hamikdash.com or call us at +972-XX-XXX-XXXX.
                </Typography>
            </Paper>
        </Container>
    );
}
