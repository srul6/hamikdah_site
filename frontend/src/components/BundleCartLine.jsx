import React from 'react';
import { Box, Typography, Skeleton, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import BundleImage from './BundleImage';
import PriceDisplay from './PriceDisplay';
import { getBundlePath } from '../utils/bundleSlug';
import { getCartLinePricing } from '../utils/productPricing';
import { useLanguage } from '../contexts/LanguageContext';
import { useBundles } from '../contexts/BundlesContext';
import { translations } from '../translations/translations';

export function useBundleCartDisplay(item) {
  const { isHebrew } = useLanguage();
  const { bundles } = useBundles();
  const pending = !!item?._pendingHydration;
  const liveBundle =
    bundles.find((b) => String(b.id) === String(item?.bundleId)) || null;
  const imageBundle = liveBundle || {
    image: item?.image,
    items: item?.items,
    name_he: item?.name_he,
    name_en: item?.name_en
  };
  const name = isHebrew
    ? item?.name_he || item?.name_en || ''
    : item?.name_en || item?.name_he || '';
  const path =
    item?.slug || liveBundle?.slug
      ? getBundlePath(item?.slug ? item : liveBundle)
      : '#';
  const componentLines = (item?.components || [])
    .map((c) => {
      const cName = isHebrew ? c.name_he || c.name_en : c.name_en || c.name_he;
      const colorName = isHebrew
        ? c.colorName_he || c.colorName_en
        : c.colorName_en || c.colorName_he;
      if (!cName) return null;
      return colorName ? `${cName} - ${colorName}` : cName;
    })
    .filter(Boolean);

  return {
    pending,
    liveBundle,
    imageBundle,
    name,
    path,
    componentLines,
    pricing: getCartLinePricing(item),
    unavailable: item?.available === false
  };
}

/** Secondary lines under the bundle name. */
export function BundleCartComponentLines({ item, sx }) {
  const { language } = useLanguage();
  const t = translations[language];
  const { componentLines, unavailable, pending } = useBundleCartDisplay(item);
  if (pending) return null;
  return (
    <Box sx={sx}>
      {componentLines.map((line) => (
        <Typography
          key={line}
          variant="caption"
          sx={{ display: 'block', color: '#888', lineHeight: 1.35 }}
        >
          {line}
        </Typography>
      ))}
      {unavailable && (
        <Typography
          variant="caption"
          sx={{ display: 'block', color: '#d8472a', mt: 0.25, fontWeight: 600 }}
        >
          {t.bundleCartUnavailable}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Compact drawer row for a bundle cart line (thumbnail + name + lines + price slot).
 */
export default function BundleCartLine({
  item,
  quantityControls = null,
  removeControl = null
}) {
  const { isHebrew } = useLanguage();
  const { pending, imageBundle, name, path, pricing } = useBundleCartDisplay(item);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 2,
        gap: 2,
        direction: isHebrew ? 'rtl' : 'ltr',
        opacity: item?.available === false ? 0.75 : 1
      }}
    >
      <Box
        component={pending ? 'div' : Link}
        to={pending ? undefined : path}
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          overflow: 'hidden',
          flexShrink: 0,
          textDecoration: 'none',
          color: 'inherit'
        }}
      >
        {pending ? (
          <Skeleton variant="rectangular" width={40} height={40} />
        ) : (
          <BundleImage bundle={imageBundle} alt={name} />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {pending ? (
          <Skeleton width="80%" />
        ) : (
          <>
            <MuiLink
              component={Link}
              to={path}
              underline="hover"
              sx={{
                fontWeight: 600,
                color: '#1d1d1f',
                display: 'block',
                mb: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.875rem'
              }}
            >
              {name}
            </MuiLink>
            <BundleCartComponentLines item={item} />
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              <PriceDisplay pricing={pricing} />
            </Typography>
            {quantityControls}
          </>
        )}
      </Box>

      {removeControl}
    </Box>
  );
}

/** Payment / order-summary text block. */
export function BundleCartSummaryText({ item }) {
  const { language, isHebrew } = useLanguage();
  const t = translations[language];
  const { pending, name, componentLines, unavailable } = useBundleCartDisplay(item);

  if (pending) return <Skeleton width="70%" />;

  return (
    <Box sx={{ direction: isHebrew ? 'rtl' : 'ltr', textAlign: isHebrew ? 'right' : 'left' }}>
      <Typography sx={{ fontWeight: 500 }}>
        {name} × {item.quantity}
      </Typography>
      {componentLines.map((line) => (
        <Typography
          key={line}
          sx={{ display: 'block', mt: 0.25, fontSize: '0.85rem', color: '#666' }}
        >
          {line}
        </Typography>
      ))}
      {unavailable && (
        <Typography sx={{ display: 'block', mt: 0.5, fontSize: '0.85rem', color: '#d8472a' }}>
          {t.bundleCartUnavailable}
        </Typography>
      )}
    </Box>
  );
}
