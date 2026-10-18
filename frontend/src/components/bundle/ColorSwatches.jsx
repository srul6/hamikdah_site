import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';

/**
 * Color circles copied from ProductDetail (single / split / conic).
 * Shown only when colors.length > 1 (caller responsibility).
 * `compact` / `centered` are used by the bundles page only — product pages stay default.
 */
export default function ColorSwatches({
  colors = [],
  selectedColor,
  onSelect,
  compact = false,
  centered = false
}) {
  const { language, isHebrew } = useLanguage();
  const t = translations[language];
  const list = Array.isArray(colors) ? colors : [];

  if (list.length <= 1) return null;

  const swatchSize = compact
    ? { xs: 32, sm: 38, md: 36 }
    : { xs: 40, sm: 50, md: 56 };

  return (
    <Box sx={{ my: compact ? 1 : 2 }}>
      <Typography
        variant="h4"
        sx={{
          color: 'rgba(229, 90, 61, 1)',
          fontWeight: 600,
          textAlign: centered ? 'center' : (isHebrew ? 'right' : 'left'),
          fontSize: compact
            ? { xs: '1.15rem', sm: '1.25rem', md: '1.15rem' }
            : { xs: '1.5rem', sm: '1.7rem', md: '1.5rem' },
          mb: compact ? 1.25 : 2,
          direction: isHebrew ? 'rtl' : 'ltr'
        }}
      >
        {t.colors}
      </Typography>

      <Box
        role="radiogroup"
        aria-label={t.colors}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: compact ? 1.5 : 2,
          justifyContent: centered ? 'center' : 'flex-start',
          direction: isHebrew ? 'rtl' : 'ltr'
        }}
      >
        {list.map((color, index) => {
          const selected = selectedColor === color;
          const label = isHebrew
            ? (color.name_he || color.name_en || `${t.colors} ${index + 1}`)
            : (color.name_en || color.name_he || `${t.colors} ${index + 1}`);

          return (
            <Tooltip key={index} title={label} arrow>
              <Box
                role="radio"
                aria-checked={selected}
                aria-label={label}
                tabIndex={0}
                onClick={() => onSelect && onSelect(color)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect && onSelect(color);
                  }
                }}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  outline: 'none',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  },
                  '&:focus-visible': {
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: swatchSize,
                    height: swatchSize,
                    borderRadius: '50%',
                    border: selected
                      ? '1px solid rgba(229, 90, 61, 1)'
                      : '2px solid #e0e0e0',
                    boxShadow: selected
                      ? '0 4px 20px rgba(229, 90, 61, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor:
                      color.colorValues && color.colorValues.length === 1
                        ? color.colorValues[0]
                        : 'transparent',
                    background:
                      color.colorValues && color.colorValues.length > 1
                        ? color.colorValues.length === 2
                          ? `linear-gradient(90deg, ${color.colorValues[0]} 50%, ${color.colorValues[1]} 50%)`
                          : `conic-gradient(${color.colorValues
                              .map(
                                (c, i) =>
                                  `${c} ${i * (360 / color.colorValues.length)}deg ${(i + 1) * (360 / color.colorValues.length)}deg`
                              )
                              .join(', ')})`
                        : undefined
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
