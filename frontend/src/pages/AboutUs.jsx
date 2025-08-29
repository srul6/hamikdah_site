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
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, direction: isHebrew ? 'rtl' : 'ltr' }}>
                <Typography variant="h3" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 4, textAlign: 'center' }}>
                    {isHebrew ? 'עלינו' : 'About Us'}
                </Typography>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#0071e3', mb: 2 }}>
                        {isHebrew ? 'חנות המקדש' : 'Hamikdash Store'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                        {isHebrew 
                            ? 'חנות המקדש היא החנות המובילה למוצרים יהודיים אותנטיים וחפצי קודש. אנו מתמחים במכירת מוצרים איכותיים וייחודיים לבית הכנסת ולמשפחה היהודית.'
                            : 'Hamikdash Store is the leading store for authentic Jewish religious items and spiritual artifacts. We specialize in selling unique, high-quality products for the synagogue and the Jewish family.'
                        }
                    </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#0071e3', mb: 2 }}>
                        {isHebrew ? 'המשימה שלנו' : 'Our Mission'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                        {isHebrew 
                            ? 'משימתנו היא לספק מוצרים איכותיים ואמינים לקהילה היהודית, תוך שמירה על המסורת והערכים היהודיים. אנו מאמינים שכל מוצר שאנו מוכרים צריך לעמוד בסטנדרטים הגבוהים ביותר של איכות ואותנטיות.'
                            : 'Our mission is to provide quality and reliable products to the Jewish community while preserving Jewish tradition and values. We believe that every product we sell should meet the highest standards of quality and authenticity.'
                        }
                    </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#0071e3', mb: 2 }}>
                        {isHebrew ? 'הערכים שלנו' : 'Our Values'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                        {isHebrew 
                            ? 'אנו מחויבים לאיכות, אמינות ושירות לקוחות מעולה. כל מוצר שאנו מוכרים נבחר בקפידה כדי להבטיח שהוא עומד בסטנדרטים הגבוהים ביותר.'
                            : 'We are committed to quality, reliability, and excellent customer service. Every product we sell is carefully selected to ensure it meets the highest standards.'
                        }
                    </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#0071e3', mb: 2 }}>
                        {isHebrew ? 'צור קשר' : 'Contact Us'}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.8 }}>
                        {isHebrew ? 'אימייל:' : 'Email:'} gilmanor8@gmail.com
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1, lineHeight: 1.8 }}>
                        {isHebrew ? 'טלפון:' : 'Phone:'} 053-2405276
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>
                        {isHebrew ? 'כתובת:' : 'Address:'} {isHebrew ? 'עליה 7 נתיבות, ישראל' : '7 Aliya Street, Netivot, Israel'}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
