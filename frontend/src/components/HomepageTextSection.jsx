import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { API_ENDPOINTS } from '../config';
import { getImageUrl } from '../utils/imageUtils';
import { buildHighlightedSegments } from '../utils/deterministicWordHighlights';

const SECTION_BG = 'rgb(224, 216, 199)';

/**
 * Exact original mobile bottom-edge wave (viewBox 0 0 1200 80).
 * 12 small, evenly spaced Bézier waves — do not alter these control points.
 */
const IMAGE_BOTTOM_WAVE_PATH =
    'M0,40 ' +
    'C25,40 25,20 50,20 ' +
    'C75,20 75,40 100,40 ' +
    'C125,40 125,20 150,20 ' +
    'C175,20 175,40 200,40 ' +
    'C225,40 225,20 250,20 ' +
    'C275,20 275,40 300,40 ' +
    'C325,40 325,20 350,20 ' +
    'C375,20 375,40 400,40 ' +
    'C425,40 425,20 450,20 ' +
    'C475,20 475,40 500,40 ' +
    'C525,40 525,20 550,20 ' +
    'C575,20 575,40 600,40 ' +
    'C625,40 625,20 650,20 ' +
    'C675,20 675,40 700,40 ' +
    'C725,40 725,20 750,20 ' +
    'C775,20 775,40 800,40 ' +
    'C825,40 825,20 850,20 ' +
    'C875,20 875,40 900,40 ' +
    'C925,40 925,20 950,20 ' +
    'C975,20 975,40 1000,40 ' +
    'C1025,40 1025,20 1050,20 ' +
    'C1075,20 1075,40 1100,40 ' +
    'C1125,40 1125,20 1150,20 ' +
    'C1175,20 1175,40 1200,40 ' +
    'L1200,80 L0,80 Z';

/**
 * Same Bézier control points as IMAGE_BOTTOM_WAVE_PATH, rotated 90° for a vertical
 * right-edge overlay (viewBox 0 0 80 1200). Mapping: (x, y) → (80 - y, x).
 * Fills from the wave to the right edge so the section background shows through.
 */
const IMAGE_RIGHT_WAVE_PATH = (() => {
    // Exact mobile wave points (excluding the bottom close), then rotate
    const mobileWave = [
        ['M', 0, 40],
        ['C', 25, 40, 25, 20, 50, 20],
        ['C', 75, 20, 75, 40, 100, 40],
        ['C', 125, 40, 125, 20, 150, 20],
        ['C', 175, 20, 175, 40, 200, 40],
        ['C', 225, 40, 225, 20, 250, 20],
        ['C', 275, 20, 275, 40, 300, 40],
        ['C', 325, 40, 325, 20, 350, 20],
        ['C', 375, 20, 375, 40, 400, 40],
        ['C', 425, 40, 425, 20, 450, 20],
        ['C', 475, 20, 475, 40, 500, 40],
        ['C', 525, 40, 525, 20, 550, 20],
        ['C', 575, 20, 575, 40, 600, 40],
        ['C', 625, 40, 625, 20, 650, 20],
        ['C', 675, 20, 675, 40, 700, 40],
        ['C', 725, 40, 725, 20, 750, 20],
        ['C', 775, 20, 775, 40, 800, 40],
        ['C', 825, 40, 825, 20, 850, 20],
        ['C', 875, 20, 875, 40, 900, 40],
        ['C', 925, 40, 925, 20, 950, 20],
        ['C', 975, 20, 975, 40, 1000, 40],
        ['C', 1025, 40, 1025, 20, 1050, 20],
        ['C', 1075, 20, 1075, 40, 1100, 40],
        ['C', 1125, 40, 1125, 20, 1150, 20],
        ['C', 1175, 20, 1175, 40, 1200, 40]
    ];

    const rot = (x, y) => [80 - y, x];
    const parts = [];

    for (const cmd of mobileWave) {
        if (cmd[0] === 'M') {
            const [x, y] = rot(cmd[1], cmd[2]);
            parts.push(`M${x},${y}`);
        } else if (cmd[0] === 'C') {
            const [c1x, c1y] = rot(cmd[1], cmd[2]);
            const [c2x, c2y] = rot(cmd[3], cmd[4]);
            const [ex, ey] = rot(cmd[5], cmd[6]);
            parts.push(`C${c1x},${c1y} ${c2x},${c2y} ${ex},${ey}`);
        }
    }

    // Close to the right edge of the 80×1200 strip (outside the image content)
    parts.push('L80,1200 L80,0 Z');
    return parts.join(' ');
})();

/** Desktop floor for short copy — compact, not viewport-driven. */
const DESKTOP_COMPACT_MIN_HEIGHT = 320;

/**
 * Optional homepage text block managed via the admin panel.
 * Renders nothing (no spacing) when inactive or when the body for the current language is empty.
 * Desktop: text drives section height; image fills the left third and matches that height.
 * Mobile: full-bleed image on top with bottom wave (unchanged behavior).
 */
export default function HomepageTextSection() {
    const { isHebrew } = useLanguage();
    const [section, setSection] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(API_ENDPOINTS.homepageText);
                const data = await res.json().catch(() => ({}));
                if (!cancelled && data.success && data.section) {
                    setSection(data.section);
                }
            } catch (_) {
                /* hide section on fetch failure */
            } finally {
                if (!cancelled) setLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const title = useMemo(() => {
        if (!section) return '';
        return String(
            isHebrew
                ? section.titleHe || section.title_he || ''
                : section.titleEn || section.title_en || ''
        ).trim();
    }, [section, isHebrew]);

    const body = useMemo(() => {
        if (!section) return '';
        return String(
            isHebrew
                ? section.bodyHe || section.body_he || ''
                : section.bodyEn || section.body_en || ''
        ).trim();
    }, [section, isHebrew]);

    const imageSrc = useMemo(() => {
        if (!section) return '';
        return getImageUrl(section.imageUrl || section.image_url || '');
    }, [section]);

    const imageDescription = useMemo(() => {
        if (!section) return '';
        return String(
            isHebrew
                ? section.imageDescriptionHe || section.image_description_he || ''
                : section.imageDescriptionEn || section.image_description_en || ''
        ).trim();
    }, [section, isHebrew]);

    const imageCopyright = useMemo(() => {
        if (!section) return '';
        return String(
            isHebrew
                ? section.imageCopyrightHe || section.image_copyright_he || ''
                : section.imageCopyrightEn || section.image_copyright_en || ''
        ).trim();
    }, [section, isHebrew]);

    const bodySegments = useMemo(() => buildHighlightedSegments(body), [body]);

    if (!loaded || !section || !body) return null;

    const hasImage = Boolean(imageSrc);
    const textDir = isHebrew ? 'rtl' : 'ltr';
    const captionAlign = isHebrew ? 'right' : 'left';
    const hasCaptions = Boolean(imageDescription || imageCopyright);

    const captionBlock = (variant) => {
        if (!hasCaptions) return null;
        const isOverlay = variant === 'overlay';
        return (
            <Box
                sx={
                    isOverlay
                        ? {
                            display: { xs: 'none', md: 'block' },
                            position: 'absolute',
                            left: 0,
                            right: '8%',
                            bottom: 0,
                            zIndex: 1,
                            boxSizing: 'border-box',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            px: 2.5,
                            py: 1.5,
                            background:
                                'linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))'
                        }
                        : {
                            display: { xs: 'block', md: 'none' },
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            flexShrink: 0,
                            pt: 1.25,
                            px: 2
                        }
                }
            >
                {imageDescription ? (
                    <Typography
                        component="p"
                        sx={{
                            m: 0,
                            color: isOverlay ? 'rgba(255,255,255,0.92)' : 'rgba(29, 29, 31, 0.55)',
                            fontWeight: 400,
                            fontSize: isOverlay
                                ? '0.85rem'
                                : { xs: '0.8rem', sm: '0.85rem' },
                            lineHeight: 1.4,
                            textAlign: captionAlign,
                            direction: textDir,
                            maxWidth: '100%'
                        }}
                    >
                        {imageDescription}
                    </Typography>
                ) : null}
                {imageCopyright ? (
                    <Typography
                        component="p"
                        sx={{
                            m: 0,
                            mt: imageDescription ? 0.5 : 0,
                            color: isOverlay ? 'rgba(255,255,255,0.75)' : 'rgba(29, 29, 31, 0.45)',
                            fontWeight: 400,
                            fontSize: isOverlay
                                ? '0.75rem'
                                : { xs: '0.72rem', sm: '0.78rem' },
                            lineHeight: 1.4,
                            textAlign: captionAlign,
                            direction: textDir,
                            maxWidth: '100%'
                        }}
                    >
                        {imageCopyright}
                    </Typography>
                ) : null}
            </Box>
        );
    };

    return (
        <Box
            component="section"
            aria-label={title || (isHebrew ? 'עדכונים' : 'Announcement')}
            sx={{
                width: '100%',
                backgroundColor: SECTION_BG,
                // Height comes from content — no viewport-based stretch
                pt: { xs: hasImage ? 0 : 6, md: 0 },
                pb: { xs: 6, md: 0 },
                overflowX: 'hidden'
            }}
        >
            <Box
                sx={{
                    direction: 'ltr',
                    boxSizing: 'border-box',
                    // Mobile: stacked column. Desktop: equal halves; row height = text column height.
                    display: { xs: 'flex', md: hasImage ? 'grid' : 'block' },
                    flexDirection: { xs: 'column', md: 'row' },
                    gridTemplateColumns: { md: hasImage ? 'minmax(0, 1.25fr) minmax(0, 2fr)' : 'none' },
                    alignItems: 'stretch',
                    gap: { xs: 3.5, md: 0 },
                    px: 0
                }}
            >
                {hasImage ? (
                    <Box
                        sx={{
                            // Mobile: full-bleed. Desktop: left third of the section.
                            width: { xs: '100vw', md: '100%' },
                            maxWidth: { xs: '100vw', md: 'none' },
                            marginLeft: { xs: 'calc(50% - 50vw)', md: 0 },
                            order: { xs: -1, md: 0 },
                            minWidth: 0,
                            position: 'relative',
                            alignSelf: 'stretch',
                            display: 'flex',
                            flexDirection: 'column',
                            boxSizing: 'border-box'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                width: '100%',
                                lineHeight: 0,
                                // Mobile sizing only — desktop fills the grid cell (text-driven height)
                                height: { xs: '100vw', sm: '90vw', md: 'auto' },
                                minHeight: { xs: '100vw', md: 0 },
                                maxHeight: { xs: '100vh', md: 'none' },
                                flex: { xs: '0 0 auto', md: '1 1 auto' },
                                alignSelf: 'stretch',
                                '@media (min-width:900px)': {
                                    // Fill the row created by the text column
                                    position: 'absolute',
                                    inset: 0,
                                    height: 'auto',
                                    minHeight: 0,
                                    maxHeight: 'none'
                                }
                            }}
                        >
                            <Box
                                component="img"
                                src={imageSrc}
                                alt={imageDescription || title || (isHebrew ? 'תמונה' : 'Section image')}
                                sx={{
                                    display: 'block',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    position: 'absolute',
                                    inset: 0
                                }}
                            />
                            {/* Mobile: exact original bottom-edge Bézier wave */}
                            <Box
                                component="svg"
                                aria-hidden
                                viewBox="0 0 1200 80"
                                preserveAspectRatio="none"
                                sx={{
                                    display: { xs: 'block', md: 'none' },
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    bottom: '-1px',
                                    width: '100%',
                                    height: { xs: 36, sm: 44 },
                                    pointerEvents: 'none'
                                }}
                            >
                                <path d={IMAGE_BOTTOM_WAVE_PATH} fill={SECTION_BG} />
                            </Box>
                            {/* Desktop: same Bézier pattern rotated along the right edge */}
                            <Box
                                component="svg"
                                aria-hidden
                                viewBox="0 0 80 1200"
                                preserveAspectRatio="none"
                                sx={{
                                    display: { xs: 'none', md: 'block' },
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    right: '-1px',
                                    height: '100%',
                                    width: { md: 44, lg: 52 },
                                    pointerEvents: 'none'
                                }}
                            >
                                <path d={IMAGE_RIGHT_WAVE_PATH} fill={SECTION_BG} />
                            </Box>
                            {captionBlock('overlay')}
                        </Box>
                        {captionBlock('below')}
                    </Box>
                ) : null}

                <Box
                    sx={{
                        minWidth: 0,
                        textAlign: 'right',
                        direction: textDir,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        pt: { xs: 0, sm: 0, md: 15 },
                        pb: { xs: 5, sm: 5, md: 15 },
                        px: { xs: 5, sm: 5, md: 15 },
                        maxWidth: { md: hasImage ? 'none' : 1100 },
                        margin: { md: hasImage ? 0 : '0 auto' },
                        // Short copy: modest floor. Long copy: grows naturally with content.
                        minHeight: {
                            md: hasImage ? DESKTOP_COMPACT_MIN_HEIGHT : 'auto'
                        }
                    }}
                >
                    {title ? (
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 600,
                                color: '#1d1d1f',
                                fontSize: { xs: '1.6rem', sm: '2.2rem', md: '2.4rem' },
                                mb: { xs: 1.5, md: 2 },
                                lineHeight: 1.15
                            }}
                        >
                            {title}
                        </Typography>
                    ) : null}
                    <Typography
                        variant="body1"
                        component="div"
                        sx={{
                            color: '#5c5c5c',
                            fontWeight: 400,
                            fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.3rem' },
                            lineHeight: 1.45,
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {bodySegments.map((segment, i) =>
                            segment.type === 'highlight' ? (
                                <Box
                                    key={`h-${i}`}
                                    component="span"
                                    sx={{
                                        color: '#d8472a',
                                        fontWeight: 600
                                    }}
                                >
                                    {segment.value}
                                </Box>
                            ) : (
                                <React.Fragment key={`t-${i}`}>{segment.value}</React.Fragment>
                            )
                        )}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
