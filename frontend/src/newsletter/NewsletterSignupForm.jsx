import React, { useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    TextField,
    Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';

/** Same practical email check as checkout (GreenInvoicePayment). */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
}

/** Same practical phone check as checkout (GreenInvoicePayment). */
function isValidPhone(phone) {
    const phoneRegex = /^(?:\+972|972|0)[\d\-\s]{7,10}$|^\+?[1-9]\d{6,14}$/;
    return phoneRegex.test(String(phone || '').replace(/[\s\-\(\)]/g, ''));
}

const orangeFieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: { xs: 'transparent', sm: 'rgba(245, 240, 227, 0.95)' },
        borderRadius: { xs: 0, sm: 2 },
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 0.45)',
            borderWidth: { xs: '0 0 2px 0', sm: '1px' },
            borderRadius: { xs: 0, sm: '8px' }
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 0.5)',
            borderWidth: { xs: '0 0 2px 0', sm: '1px' }
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 1)',
            borderWidth: { xs: '0 0 2px 0', sm: '2px' }
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 1)',
            borderWidth: { xs: '0 0 2px 0', sm: '1px' }
        },
        '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 1)',
            borderWidth: { xs: '0 0 2px 0', sm: '2px' }
        }
    },
    '& .MuiOutlinedInput-input': {
        px: { xs: 0.25, sm: 1.75 },
        // Sit the placeholder/text near the underline on mobile
        py: { xs: 0, sm: undefined },
        pb: { xs: '2px', sm: undefined }
    }
};

/** Full outlined field at all breakpoints (e.g. newsletter banner). */
const outlinedFieldSx = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(245, 240, 227, 0.95)',
        borderRadius: 2,
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 0.45)',
            borderWidth: '1px',
            borderRadius: '8px'
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 0.5)',
            borderWidth: '1px'
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 1)',
            borderWidth: '2px'
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 1)',
            borderWidth: '1px'
        },
        '&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(229, 90, 61, 1)',
            borderWidth: '2px'
        }
    },
    '& .MuiOutlinedInput-input': {
        px: 1.75
    }
};

/**
 * Shared newsletter form — mode: 'subscribe' | 'unsubscribe'
 * onSubscribed: optional; when provided and signup succeeds, parent handles success UI
 *   (form stays mounted only for already-subscribed / errors).
 */
export default function NewsletterSignupForm({
    mode = 'subscribe',
    compact = false,
    requirePrivacyConsent = false,
    stackFields = false,
    /** Keep full outlined email field on mobile (banner); section uses underline. */
    outlinedField = false,
    onSuccess,
    onSubscribed,
    submitLabel,
    inputSx = {},
    buttonSx = {}
}) {
    const { language, isHebrew } = useLanguage();
    const t = translations[language];

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [nameError, setNameError] = useState('');
    const [privacyError, setPrivacyError] = useState('');
    const [formError, setFormError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [alreadySubscribedNotice, setAlreadySubscribedNotice] = useState(false);

    const inputHeight = compact ? 40 : 56;
    const privacyBlocksSubmit = mode === 'subscribe' && requirePrivacyConsent && !privacyAccepted;
    const fieldSx = outlinedField ? outlinedFieldSx : orangeFieldSx;
    const useUnderlineMobile = !outlinedField && !stackFields;
    const contentAlign = outlinedField ? 'center' : isHebrew ? 'right' : 'left';

    const validateEmailClient = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return t.fieldRequired || t.newsletterEmailRequired;
        if (trimmed.length > 254) return t.newsletterEmailTooLong;
        if (!isValidEmail(trimmed)) return t.invalidEmail;
        return '';
    };

    const validatePhoneClient = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return t.fieldRequired;
        if (trimmed.length > 25) return t.invalidPhone;
        if (!isValidPhone(trimmed)) return t.invalidPhone;
        return '';
    };

    const validateNameClient = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return t.fieldRequired;
        if (trimmed.length < 2) return t.nameMinLength;
        if (trimmed.length > 100) return t.fieldRequired;
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setPrivacyError('');
        setAlreadySubscribedNotice(false);

        const nextEmailError = validateEmailClient(email);
        setEmailError(nextEmailError);

        let nextPhoneError = '';
        let nextNameError = '';
        if (mode === 'subscribe') {
            nextPhoneError = validatePhoneClient(phone);
            nextNameError = validateNameClient(name);
            setPhoneError(nextPhoneError);
            setNameError(nextNameError);
        } else {
            setPhoneError('');
            setNameError('');
        }

        if (nextEmailError || nextPhoneError || nextNameError) {
            return;
        }

        if (privacyBlocksSubmit) {
            setPrivacyError(t.newsletterPrivacyRequired);
            return;
        }

        setLoading(true);
        try {
            const endpoint =
                mode === 'unsubscribe'
                    ? `${API_ENDPOINTS.newsletter}/unsubscribe`
                    : `${API_ENDPOINTS.newsletter}/subscribe`;

            const body =
                mode === 'unsubscribe'
                    ? { email: email.trim() }
                    : {
                        email: email.trim(),
                        phone: phone.trim(),
                        name: name.trim(),
                        company_url: honeypot,
                        language
                    };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                if (data.error === 'invalid_email') {
                    setEmailError(t.invalidEmail);
                } else if (data.error === 'invalid_phone') {
                    setPhoneError(t.invalidPhone);
                } else if (data.error === 'invalid_name') {
                    setNameError(t.nameMinLength);
                } else if (data.error === 'not_found') {
                    setFormError(t.newsletterEmailNotFound);
                } else {
                    setFormError(
                        data.message ||
                        (mode === 'unsubscribe' ? t.newsletterUnsubscribeError : t.newsletterSubmitError)
                    );
                }
                return;
            }

            if (mode === 'unsubscribe') {
                setDone(true);
                if (onSuccess) onSuccess({ status: 'unsubscribed' });
                return;
            }

            if (data.status === 'already_subscribed') {
                setAlreadySubscribedNotice(true);
                setEmail('');
                setPhone('');
                setName('');
                setPrivacyAccepted(false);
                if (onSuccess) onSuccess({ status: 'already_subscribed' });
                return;
            }

            // Fresh signup / pending refresh — email was sent
            if (onSubscribed) {
                onSubscribed();
            } else {
                setDone(true);
            }
            if (onSuccess) onSuccess({ status: 'subscribed' });
        } catch (_) {
            setFormError(mode === 'unsubscribe' ? t.newsletterUnsubscribeError : t.newsletterSubmitError);
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        if (mode === 'unsubscribe') {
            return (
                <Typography
                    sx={{
                        color: 'inherit',
                        fontWeight: 500,
                        fontSize: compact ? '0.95rem' : '1.05rem',
                        direction: isHebrew ? 'rtl' : 'ltr',
                        textAlign: contentAlign
                    }}
                >
                    {t.newsletterUnsubscribed}
                </Typography>
            );
        }

        return (
            <Box
                sx={{
                    width: '100%',
                    direction: isHebrew ? 'rtl' : 'ltr',
                    textAlign: contentAlign,
                    py: compact ? 1 : 2
                }}
            >
                <Typography
                    sx={{
                        color: '#d8472a',
                        fontWeight: 800,
                        fontSize: compact ? '1.15rem' : { xs: '1.35rem', sm: '1.55rem' },
                        mb: 1,
                        lineHeight: 1.25
                    }}
                >
                    {t.newsletterSubscribeSuccessTitle}
                </Typography>
                <Typography
                    sx={{
                        color: 'inherit',
                        fontWeight: 500,
                        fontSize: compact ? '0.95rem' : '1.08rem',
                        lineHeight: 1.45,
                        whiteSpace: 'pre-line'
                    }}
                >
                    {t.newsletterSubscribeSuccessBody}
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
                width: '100%',
                direction: isHebrew ? 'rtl' : 'ltr'
            }}
        >
            {alreadySubscribedNotice && (
                <Box
                    role="status"
                    sx={{
                        mb: 2,
                        px: { xs: 1.5, sm: 2 },
                        py: { xs: 1.25, sm: 1.5 },
                        border: '2px solid #d8472a',
                        borderRadius: 2,
                        backgroundColor: 'rgba(216, 71, 42, 0.08)',
                        textAlign: contentAlign
                    }}
                >
                    <Typography
                        sx={{
                            color: '#d8472a',
                            fontWeight: 700,
                            fontSize: compact ? '0.95rem' : { xs: '1rem', sm: '1.1rem' },
                            lineHeight: 1.4
                        }}
                    >
                        {t.newsletterAlreadySubscribed}
                    </Typography>
                </Box>
            )}

            {mode === 'subscribe' && (
                <Box
                    aria-hidden="true"
                    sx={{
                        position: 'absolute',
                        left: '-10000px',
                        top: 'auto',
                        width: 1,
                        height: 1,
                        overflow: 'hidden'
                    }}
                >
                    <label htmlFor="newsletter-company-url">Company</label>
                    <input
                        id="newsletter-company-url"
                        name="company_url"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(ev) => setHoneypot(ev.target.value)}
                    />
                </Box>
            )}

            {(() => {
                const textFieldSx = {
                    ...fieldSx,
                    ...inputSx,
                    '& .MuiOutlinedInput-root': {
                        ...fieldSx['& .MuiOutlinedInput-root'],
                        height: useUnderlineMobile
                            ? { xs: 34, sm: inputHeight }
                            : inputHeight,
                        alignItems: useUnderlineMobile
                            ? { xs: 'flex-end', sm: 'center' }
                            : 'center',
                        ...(inputSx['& .MuiOutlinedInput-root'] || {})
                    },
                    '& .MuiOutlinedInput-input': {
                        ...fieldSx['& .MuiOutlinedInput-input'],
                        textAlign: outlinedField
                            ? 'center'
                            : isHebrew
                              ? 'right'
                              : 'left'
                    }
                };

                const submitButton = (
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || privacyBlocksSubmit}
                        sx={{
                            backgroundColor: { xs: 'transparent', sm: '#d8472a' },
                            color: { xs: '#d8472a', sm: '#f5f0e3' },
                            border: {
                                xs: '1px solid #d8472a',
                                sm: '1px solid transparent'
                            },
                            fontWeight: 700,
                            borderRadius: 1,
                            height: inputHeight,
                            minHeight: inputHeight,
                            px: 2,
                            py: 0,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            minWidth: { xs: 110, sm: 140 },
                            width: 'auto',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            boxShadow: 'none',
                            alignSelf: 'flex-start',
                            '&:hover': {
                                backgroundColor: { xs: 'transparent', sm: '#c03d24' },
                                borderColor: { xs: '#c03d24', sm: 'transparent' },
                                color: { xs: '#c03d24', sm: '#f5f0e3' },
                                boxShadow: 'none'
                            },
                            '&.Mui-disabled': {
                                backgroundColor: {
                                    xs: 'transparent',
                                    sm: 'rgba(216, 71, 42, 0.45)'
                                },
                                color: {
                                    xs: 'rgba(216, 71, 42, 0.45)',
                                    sm: 'rgba(245, 240, 227, 0.9)'
                                },
                                borderColor: {
                                    xs: 'rgba(216, 71, 42, 0.45)',
                                    sm: 'transparent'
                                }
                            },
                            ...buttonSx
                        }}
                    >
                        {loading ? (
                            <CircularProgress
                                size={22}
                                sx={{ color: { xs: '#d8472a', sm: '#f5f0e3' } }}
                            />
                        ) : (
                            submitLabel ||
                            (mode === 'unsubscribe'
                                ? t.newsletterUnsubscribeSubmit
                                : t.newsletterSubmit)
                        )}
                    </Button>
                );

                const fieldError = (message) =>
                    message ? (
                        <Typography
                            variant="caption"
                            color="error"
                            sx={{
                                mt: 0.5,
                                display: 'block',
                                textAlign: contentAlign,
                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                            }}
                        >
                            {message}
                        </Typography>
                    ) : null;

                // Unsubscribe: email + button on one row (desktop), stacked only if needed
                if (mode === 'unsubscribe') {
                    return (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row-reverse' },
                                gap: { xs: 1.25, sm: 1.25 },
                                alignItems: { xs: 'stretch', sm: 'flex-start' },
                                direction: 'ltr'
                            }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                                <TextField
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(ev) => {
                                        setEmail(ev.target.value);
                                        if (emailError) setEmailError('');
                                    }}
                                    placeholder={t.newsletterEmailPlaceholder}
                                    inputProps={{
                                        maxLength: 254,
                                        'aria-label': t.newsletterEmailPlaceholder
                                    }}
                                    error={Boolean(emailError)}
                                    disabled={loading}
                                    size={compact ? 'small' : 'medium'}
                                    fullWidth
                                    sx={textFieldSx}
                                />
                                {fieldError(emailError)}
                            </Box>
                            {submitButton}
                        </Box>
                    );
                }

                // Subscribe: email → phone → name; button beside last field on desktop only
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: stackFields ? 1.25 : { xs: 1.5, sm: 1.25 },
                            width: '100%'
                        }}
                    >
                        <Box sx={{ width: '100%' }}>
                            <TextField
                                type="email"
                                name="email"
                                value={email}
                                onChange={(ev) => {
                                    setEmail(ev.target.value);
                                    if (emailError) setEmailError('');
                                    if (alreadySubscribedNotice) setAlreadySubscribedNotice(false);
                                }}
                                placeholder={t.newsletterEmailPlaceholder}
                                inputProps={{
                                    maxLength: 254,
                                    'aria-label': t.newsletterEmailPlaceholder
                                }}
                                error={Boolean(emailError)}
                                disabled={loading}
                                size={compact ? 'small' : 'medium'}
                                fullWidth
                                sx={textFieldSx}
                            />
                            {fieldError(emailError)}
                        </Box>

                        <Box sx={{ width: '100%' }}>
                            <TextField
                                type="tel"
                                name="phone"
                                value={phone}
                                onChange={(ev) => {
                                    setPhone(ev.target.value);
                                    if (phoneError) setPhoneError('');
                                }}
                                placeholder={t.phonePlaceholder || t.phone}
                                inputProps={{ maxLength: 25, 'aria-label': t.phone }}
                                error={Boolean(phoneError)}
                                disabled={loading}
                                size={compact ? 'small' : 'medium'}
                                fullWidth
                                sx={textFieldSx}
                            />
                            {fieldError(phoneError)}
                        </Box>

                        <Box
                            sx={{
                                width: '100%',
                                display: 'flex',
                                // Button beside the last field (desktop + mobile) — never
                                // a full-width control under the whole field stack.
                                flexDirection: 'row-reverse',
                                gap: 1.25,
                                alignItems: 'flex-start',
                                direction: 'ltr'
                            }}
                        >
                            <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                                <TextField
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(ev) => {
                                        setName(ev.target.value);
                                        if (nameError) setNameError('');
                                    }}
                                    placeholder={t.namePlaceholder || t.name}
                                    inputProps={{ maxLength: 100, 'aria-label': t.name }}
                                    error={Boolean(nameError)}
                                    disabled={loading}
                                    size={compact ? 'small' : 'medium'}
                                    fullWidth
                                    sx={textFieldSx}
                                />
                                {fieldError(nameError)}
                            </Box>
                            {submitButton}
                        </Box>
                    </Box>
                );
            })()}

            {mode === 'subscribe' && requirePrivacyConsent && (
                <Box
                    sx={{
                        mt: 1.5,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        direction: 'ltr',
                        alignItems: {
                            xs: isHebrew ? 'flex-end' : 'flex-start',
                            sm: 'center'
                        }
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 0.75,
                            m: 0
                        }}
                    >
                        <Typography
                            variant="body2"
                            component="label"
                            htmlFor="newsletter-privacy-consent"
                            sx={{
                                direction: isHebrew ? 'rtl' : 'ltr',
                                fontSize: { xs: '0.95rem', sm: '1rem' },
                                color: 'text.primary',
                                textAlign: isHebrew ? 'right' : 'left',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            {t.newsletterPrivacyPrefix}
                            <Button
                                component={RouterLink}
                                to="/privacy"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    color: 'rgba(229, 90, 61, 1)',
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '4px',
                                    fontSize: 'inherit',
                                    fontWeight: 'inherit',
                                    p: 0,
                                    minWidth: 'auto',
                                    textTransform: 'none',
                                    verticalAlign: 'baseline',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                        textUnderlineOffset: '4px',
                                        backgroundColor: 'transparent'
                                    }
                                }}
                            >
                                {t.newsletterPrivacyLinkText}
                            </Button>
                        </Typography>
                        <Checkbox
                            id="newsletter-privacy-consent"
                            checked={privacyAccepted}
                            onChange={(e) => {
                                setPrivacyAccepted(e.target.checked);
                                if (privacyError) setPrivacyError('');
                            }}
                            sx={{
                                p: 0,
                                color: 'rgba(229, 90, 61, 1)',
                                '&.Mui-checked': {
                                    color: 'rgba(229, 90, 61, 1)'
                                },
                                '& .MuiSvgIcon-root': {
                                    fontSize: 18
                                }
                            }}
                        />
                    </Box>
                    {privacyError ? (
                        <Typography
                            variant="caption"
                            color="error"
                            sx={{
                                mt: 0.5,
                                display: 'block',
                                direction: isHebrew ? 'rtl' : 'ltr',
                                textAlign: {
                                    xs: isHebrew ? 'right' : 'left',
                                    sm: 'center'
                                },
                                fontSize: { xs: '0.75rem', sm: '0.8rem' }
                            }}
                        >
                            {privacyError}
                        </Typography>
                    ) : null}
                </Box>
            )}

            {formError ? (
                <Typography
                    variant="caption"
                    color="error"
                    sx={{
                        mt: 0.5,
                        display: 'block',
                        textAlign: contentAlign,
                        fontSize: { xs: '0.75rem', sm: '0.8rem' }
                    }}
                >
                    {formError}
                </Typography>
            ) : null}
        </Box>
    );
}
