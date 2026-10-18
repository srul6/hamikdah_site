import React from 'react';
import { Box } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { getImageUrl } from '../utils/imageUtils';

const BORDER_COLOR = 'rgba(199, 61, 34, 1)';

/**
 * Bundle card/menu image: custom `bundle.image` if set, otherwise N equal
 * vertical panes from component homepage images (position order).
 * In Hebrew/RTL, position 0 is on the right.
 */
export default function BundleImage({ bundle, alt = '', className, sx }) {
  const { isHebrew } = useLanguage();
  const customImage = bundle?.image ? getImageUrl(bundle.image) : null;
  const name =
    alt ||
    (isHebrew ? bundle?.name_he : bundle?.name_en) ||
    '';

  const panes = (Array.isArray(bundle?.items) ? bundle.items : [])
    .slice()
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((item) => {
      const product = item?.product;
      return getImageUrl(product?.homepageImage || product?.homepageimage);
    })
    .filter(Boolean);

  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...sx
      }}
    >
      {customImage ? (
        <Box
          component="img"
          src={customImage}
          alt={name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block'
          }}
        />
      ) : panes.length === 0 ? (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(245, 240, 227, 0.9)'
          }}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            direction: isHebrew ? 'rtl' : 'ltr',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {panes.map((src, index) => (
            <Box
              key={`${src}-${index}`}
              sx={{
                flex: 1,
                minWidth: 0,
                height: '100%',
                position: 'relative',
                borderInlineStart:
                  index > 0 ? `1px solid ${BORDER_COLOR}` : 'none'
              }}
            >
              <Box
                component="img"
                src={src}
                alt={index === 0 ? name : ''}
                aria-hidden={index > 0}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block'
                }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
