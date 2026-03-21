import React, { useEffect } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function AboutUs() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 8 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 8,
                    borderRadius: 2,
                    direction: isHebrew ? 'rtl' : 'ltr',
                    // Full width on mobile; narrower centered column from tablet/desktop up
                    maxWidth: { xs: '100%', sm: 720, md: 760 },
                    mx: { xs: 0, sm: 'auto' },
                }}
            >
                <Typography variant="h3" sx={{ fontWeight: 600, color: 'rgb(229, 90, 61)', mb: 2.5, textAlign: 'center', fontSize: { xs: '1.85rem', sm: '2.25rem', md: '2.75rem' }, lineHeight: 1.25 }}>
                    {isHebrew ? 'קצת עלינו' : 'About Us'}
                </Typography>

                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'rgb(229, 90, 61)', mb: 1, fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' }, lineHeight: 1.3 }}>
                        {isHebrew ? 'חנות המקדש' : 'Hamikdash Store'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1.25, lineHeight: 1.45, fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' } }}>
                        {isHebrew
                            ? 'חנות המקדש היא החנות המובילה למוצרים יהודיים אותנטיים וחפצי קודש. אנו מתמחים במכירת מוצרים איכותיים וייחודיים לבית הכנסת ולמשפחה היהודית.'
                            : 'Hamikdash Store is the leading store for authentic Jewish religious items and spiritual artifacts. We specialize in selling unique, high-quality products for the synagogue and the Jewish family.'
                        }
                    </Typography>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'rgb(229, 90, 61)', mb: 1, fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' }, lineHeight: 1.3 }}>
                        {isHebrew ? 'המשימה שלנו' : 'Our Mission'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1.25, lineHeight: 1.45, fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' } }}>
                        {isHebrew
                            ? 'משימתנו היא לספק מוצרים איכותיים ואמינים לקהילה היהודית, תוך שמירה על המסורת והערכים היהודיים. אנו מאמינים שכל מוצר שאנו מוכרים צריך לעמוד בסטנדרטים הגבוהים ביותר של איכות ואותנטיות.'
                            : 'Our mission is to provide quality and reliable products to the Jewish community while preserving Jewish tradition and values. We believe that every product we sell should meet the highest standards of quality and authenticity.'
                        }
                    </Typography>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'rgb(229, 90, 61)', mb: 1, fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' }, lineHeight: 1.3 }}>
                        {isHebrew ? 'הערכים שלנו' : 'Our Values'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1.25, lineHeight: 1.45, fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' } }}>
                        {isHebrew
                            ? 'אנו מחויבים לאיכות, אמינות ושירות לקוחות מעולה. כל מוצר שאנו מוכרים נבחר בקפידה כדי להבטיח שהוא עומד בסטנדרטים הגבוהים ביותר.'
                            : 'We are committed to quality, reliability, and excellent customer service. Every product we sell is carefully selected to ensure it meets the highest standards.'
                        }
                    </Typography>
                </Box>

                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'rgb(229, 90, 61)', mb: 1, fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' }, lineHeight: 1.3 }}>
                        {isHebrew ? 'צור קשר' : 'Contact Us'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.25, lineHeight: 1.4, fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' } }}>
                        {isHebrew ? 'אימייל:' : 'Email:'} gilmanor8@gmail.com
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.25, lineHeight: 1.4, fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' } }}>
                        {isHebrew ? 'טלפון:' : 'Phone:'} 053-2405276
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0, lineHeight: 1.4, fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' } }}>
                        {isHebrew ? 'כתובת:' : 'Address:'} {isHebrew ? 'עליה 7 נתיבות, ישראל' : '7 Aliya Street, Netivot, Israel'}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
