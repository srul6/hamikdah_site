import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

export default function TermsOfService() {
    const { isHebrew } = useLanguage();
    const t = translations[isHebrew ? 'HE' : 'EN'];

    return (
        <Container maxWidth="md" sx={{ py: 4, mt: 2 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
                    {t.termsTitle || 'Terms of Service'}
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    1. Acceptance of Terms
                </Typography>
                <Typography paragraph>
                    By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    2. Use License
                </Typography>
                <Typography paragraph>
                    Permission is granted to temporarily download one copy of the materials (information or software) on Hamikdash's website for personal, non-commercial transitory viewing only.
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    3. Disclaimer
                </Typography>
                <Typography paragraph>
                    The materials on Hamikdash's website are provided on an 'as is' basis. Hamikdash makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    4. Limitations
                </Typography>
                <Typography paragraph>
                    In no event shall Hamikdash or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Hamikdash's website.
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    5. Accuracy of Materials
                </Typography>
                <Typography paragraph>
                    The materials appearing on Hamikdash's website could include technical, typographical, or photographic errors. Hamikdash does not warrant that any of the materials on its website are accurate, complete or current.
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    6. Links
                </Typography>
                <Typography paragraph>
                    Hamikdash has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Hamikdash of the site.
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    7. Modifications
                </Typography>
                <Typography paragraph>
                    Hamikdash may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms of Service.
                </Typography>
                
                <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
                    8. Governing Law
                </Typography>
                <Typography paragraph>
                    These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                </Typography>
            </Paper>
        </Container>
    );
}
