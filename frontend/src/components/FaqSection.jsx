import React, { useState } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { WHATSAPP_URL } from '../config';

export default function FaqSection() {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];
    const [expanded, setExpanded] = useState(false);

    const handleChange = (panel) => (_event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const items = [
        { id: 'q1', question: t.faqQ1Question, answer: t.faqQ1Answer },
        { id: 'q2', question: t.faqQ2Question, answer: t.faqQ2Answer },
        { id: 'q3', question: t.faqQ3Question, answer: t.faqQ3Answer },
        { id: 'q4', question: t.faqQ4Question, answer: t.faqQ4Answer },
        { id: 'q5', question: t.faqQ5Question, answer: t.faqQ5Answer }
    ];

    const whatsAppLinkSx = {
        color: '#25D366',
        fontWeight: 600,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        '&:hover': {
            color: '#1ebe57'
        },
        '&:focus-visible': {
            outline: '2px solid rgba(229, 90, 61, 0.55)',
            outlineOffset: '2px',
            borderRadius: '2px'
        }
    };

    const renderAnswer = (item) => {
        if (item.id === 'q3') {
            return (
                <>
                    {t.faqQ3AnswerBefore}
                    <Box component="a" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" sx={whatsAppLinkSx}>
                        {t.faqQ3AnswerLink}
                    </Box>
                    {t.faqQ3AnswerAfter}
                </>
            );
        }
        if (item.id === 'q5') {
            return (
                <>
                    {t.faqQ5AnswerBefore}
                    <Box component="a" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" sx={whatsAppLinkSx}>
                        {t.faqQ5AnswerLink}
                    </Box>
                    {t.faqQ5AnswerAfter}
                </>
            );
        }
        return item.answer;
    };

    const contactBlockSx = {
        width: '100%',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'right',
        direction: 'rtl',
        gap: 0.35
    };

    const contactBlock = (
        <>
            <Typography
                sx={{
                    color: 'rgb(5, 38, 51)',
                    fontWeight: 400,
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    lineHeight: 1.35,
                    maxWidth: { md: '42ch' }
                }}
            >
                {t.faqContact}
            </Typography>

            <Button
                component="a"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<WhatsAppIcon />}
                sx={{
                    color: '#25D366',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '1.05rem', md: '1.15rem' },
                    px: 0,
                    py: 0,
                    minHeight: 0,
                    minWidth: 'auto',
                    lineHeight: 1.35,
                    backgroundColor: 'transparent',
                    justifyContent: 'flex-start',
                    alignSelf: 'flex-start',
                    '& .MuiButton-startIcon': {
                        marginLeft: '8px',
                        marginRight: 0
                    },
                    '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#1ebe57',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px'
                    },
                    '&:focus-visible': {
                        outline: '2px solid rgba(229, 90, 61, 0.55)',
                        outlineOffset: '4px',
                        borderRadius: 1
                    }
                }}
            >
                {t.faqWhatsAppCta}
            </Button>

            <Typography
                sx={{
                    color: 'rgba(229, 90, 61, 1)',
                    fontWeight: 600,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    lineHeight: 1.35
                }}
            >
                {t.faqReplyFast}
            </Typography>
        </>
    );

    return (
        <Box
            component="section"
            aria-labelledby="faq-heading"
            sx={{
                backgroundColor: '#f5f0e3',
                py: { xs: 5, md: 7 },
                px: { xs: 2, sm: 3, md: 4 },
                direction: isHebrew ? 'rtl' : 'ltr'
            }}
        >
            <Box
                className="faq-layout"
                sx={{
                    maxWidth: { xs: 'calc(100% - 32px)', md: 1120 },
                    width: '100%',
                    mx: 'auto',
                    // Keep grid LTR so column order stays predictable (accordion left, intro right)
                    direction: 'ltr',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
                    gap: { xs: 3, md: 5 },
                    alignItems: 'stretch',
                    justifyContent: 'center'
                }}
            >
                {/* Intro — desktop right column */}
                <Box
                    sx={{
                        order: { xs: 1, md: 2 },
                        textAlign: 'right',
                        direction: 'rtl',
                        pt: { md: 1 },
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        minHeight: { md: '100%' }
                    }}
                >
                    <Box sx={{ width: '100%', textAlign: 'right' }}>
                        <Typography
                            id="faq-heading"
                            variant="h3"
                            component="h2"
                            sx={{
                                fontWeight: 600,
                                color: 'rgb(5, 38, 51)',
                                fontSize: { xs: '2rem', sm: '2.4rem', md: '2.8rem' },
                                lineHeight: 1.15,
                                mb: 1.25
                            }}
                        >
                            {t.faqTitle}
                        </Typography>

                        <Typography
                            sx={{
                                color: '#86868b',
                                fontWeight: 400,
                                fontSize: { xs: '1.05rem', md: '1.2rem' },
                                lineHeight: 1.4,
                                mb: { xs: 3.5, md: 0 }
                            }}
                        >
                            {t.faqSubtitle}
                        </Typography>
                    </Box>

                    {/* Compact contact block — desktop only (inside intro column) */}
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            mt: 'auto',
                            pt: 2,
                            ...contactBlockSx
                        }}
                    >
                        {contactBlock}
                    </Box>
                </Box>

                {/* Accordion — nudged toward page center on desktop */}
                <Box
                    sx={{
                        order: { xs: 2, md: 1 },
                        justifySelf: { xs: 'stretch', md: 'end' },
                        width: { xs: '100%', md: '92%' },
                        maxWidth: { md: 540 },
                        backgroundColor: 'rgba(255, 255, 255, 0.55)',
                        border: '1px solid rgba(229, 90, 61, 0.18)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        boxShadow: '0 4px 24px rgba(5, 38, 51, 0.04)'
                    }}
                >
                    {items.map((item, index) => {
                        const isOpen = expanded === item.id;
                        return (
                            <Accordion
                                key={item.id}
                                disableGutters
                                elevation={0}
                                expanded={isOpen}
                                onChange={handleChange(item.id)}
                                sx={{
                                    backgroundColor: 'transparent',
                                    direction: isHebrew ? 'rtl' : 'ltr',
                                    borderBottom:
                                        index < items.length - 1
                                            ? '1px solid rgba(229, 90, 61, 0.14)'
                                            : 'none',
                                    '&:before': { display: 'none' },
                                    '&.Mui-expanded': {
                                        backgroundColor: 'rgba(229, 90, 61, 0.04)'
                                    }
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={
                                        <Box
                                            className="faq-expand-circle"
                                            sx={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                border: '1.5px solid rgba(229, 90, 61, 0.55)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'rgba(229, 90, 61, 1)',
                                                transition: 'background-color 0.2s ease, border-color 0.2s ease',
                                                backgroundColor: 'transparent'
                                            }}
                                        >
                                            {isOpen ? (
                                                <RemoveIcon sx={{ fontSize: 16 }} />
                                            ) : (
                                                <AddIcon sx={{ fontSize: 16 }} />
                                            )}
                                        </Box>
                                    }
                                    aria-controls={`${item.id}-content`}
                                    id={`${item.id}-header`}
                                    sx={{
                                        px: { xs: 2, md: 2.5 },
                                        py: { xs: 0.5, md: 0.75 },
                                        minHeight: { xs: 56, md: 64 },
                                        gap: 1.5,
                                        flexDirection: 'row',
                                        color: 'rgb(5, 38, 51)',
                                        transition: 'background-color 0.2s ease',
                                        '& .MuiAccordionSummary-content': {
                                            my: 1.25,
                                            marginRight: isHebrew ? 0 : undefined,
                                            marginLeft: isHebrew ? 0 : undefined
                                        },
                                        '& .MuiAccordionSummary-expandIconWrapper': {
                                            transform: 'none',
                                            color: 'inherit',
                                            marginLeft: isHebrew ? 0 : undefined,
                                            marginRight: isHebrew ? 0 : undefined,
                                            '&.Mui-expanded': {
                                                transform: 'none'
                                            }
                                        },
                                        // Collapsed hover: orange question + white plus circle
                                        '&:hover:not(.Mui-expanded)': {
                                            backgroundColor: 'transparent',
                                            '& .faq-question-text': {
                                                color: 'rgba(229, 90, 61, 1)'
                                            },
                                            '& .faq-expand-circle': {
                                                backgroundColor: '#fff',
                                                borderColor: 'rgba(229, 90, 61, 0.55)'
                                            }
                                        },
                                        // Expanded: always original colors (even while hovered)
                                        '&.Mui-expanded': {
                                            backgroundColor: 'transparent',
                                            '& .faq-question-text': {
                                                color: 'rgb(5, 38, 51)'
                                            },
                                            '& .faq-expand-circle': {
                                                backgroundColor: 'transparent',
                                                borderColor: 'rgba(229, 90, 61, 0.55)'
                                            }
                                        },
                                        '&.Mui-expanded:hover': {
                                            backgroundColor: 'transparent',
                                            '& .faq-question-text': {
                                                color: 'rgb(5, 38, 51)'
                                            },
                                            '& .faq-expand-circle': {
                                                backgroundColor: 'transparent'
                                            }
                                        },
                                        '&:focus-visible': {
                                            outline: '2px solid rgba(229, 90, 61, 0.55)',
                                            outlineOffset: '-2px'
                                        },
                                        '&.Mui-focusVisible': {
                                            backgroundColor: 'rgba(229, 90, 61, 0.06)'
                                        }
                                    }}
                                >
                                    <Typography
                                        component="span"
                                        className="faq-question-text"
                                        sx={{
                                            fontWeight: 600,
                                            color: 'rgb(5, 38, 51)',
                                            fontSize: { xs: '0.98rem', md: '1.05rem' },
                                            lineHeight: 1.4,
                                            textAlign: isHebrew ? 'right' : 'left',
                                            width: '100%',
                                            transition: 'color 0.2s ease'
                                        }}
                                    >
                                        {item.question}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails
                                    id={`${item.id}-content`}
                                    role="region"
                                    aria-labelledby={`${item.id}-header`}
                                    sx={{
                                        px: { xs: 2, md: 2.5 },
                                        pt: 0,
                                        pb: 2.25
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: '#5c6570',
                                            fontWeight: 400,
                                            fontSize: { xs: '0.95rem', md: '1rem' },
                                            lineHeight: 1.55,
                                            textAlign: isHebrew ? 'right' : 'left'
                                        }}
                                    >
                                        {renderAnswer(item)}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </Box>

                {/* Compact contact block — mobile only, under questions */}
                <Box
                    sx={{
                        display: { xs: 'flex', md: 'none' },
                        order: 3,
                        mt: 4,
                        ...contactBlockSx
                    }}
                >
                    {contactBlock}
                </Box>
            </Box>
        </Box>
    );
}
