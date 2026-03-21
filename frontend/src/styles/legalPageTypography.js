/** Shared typography for Returns, Site Terms, Privacy, TOS — larger text, tighter line spacing */
export const legalTitleSx = {
    fontWeight: 600,
    mb: 2.5,
    lineHeight: 1.25,
    fontSize: { xs: '1.75rem', sm: '2.1rem', md: '2.5rem' },
};

export const legalSectionHeadingSx = {
    fontWeight: 600,
    mt: 2.5,
    mb: 1,
    lineHeight: 1.3,
    fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
};

export const legalBodySx = {
    fontSize: { xs: '1.05rem', sm: '1.125rem', md: '1.2rem' },
    lineHeight: 1.45,
    mb: 1.25,
};

export const legalBodySecondarySx = {
    ...legalBodySx,
    fontStyle: 'italic',
    color: 'text.secondary',
};

export const legalListSx = {
    ...legalBodySx,
    pl: { xs: 2.5, sm: 3 },
    '& li': { mb: 0.5, lineHeight: 1.45 },
};
