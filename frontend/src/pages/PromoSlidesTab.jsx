import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControlLabel, Switch, Alert, CircularProgress,
  IconButton, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { API_ENDPOINTS } from '../config';
import ImageUploader from '../components/ImageUploader';
import { getImageUrl } from '../utils/imageUtils';
import { getProductPath } from '../utils/productSlug';
import { getBundlePath } from '../utils/bundleSlug';
import { HOME_SECTIONS } from '../config/homeSections';
import { PROMO_SLIDER_CONFIG } from '../components/PromoSlider';
import { fetchProducts } from '../api/products';
import { fetchBundles } from '../api/bundles';

const LINK_TYPES = [
  { value: 'none', label: 'ללא קישור' },
  { value: 'page', label: 'עמוד פנימי' },
  { value: 'section', label: 'סקציה בדף הבית' },
  { value: 'external', label: 'קישור חיצוני' }
];

function emptyForm() {
  return {
    image: '',
    imageMobile: '',
    altHe: '',
    altEn: '',
    linkType: 'none',
    linkTarget: '',
    openInNewTab: true,
    isActive: true
  };
}

function linkSummary(slide) {
  const type = slide.linkType || slide.link_type || 'none';
  const target = slide.linkTarget || slide.link_target || '';
  const label = LINK_TYPES.find((t) => t.value === type)?.label || type;
  if (type === 'none') return label;
  return `${label}: ${target || '—'}`;
}

const sizeHint = (() => {
  const d = PROMO_SLIDER_CONFIG.recommendedSize.desktop;
  const m = PROMO_SLIDER_CONFIG.recommendedSize.mobile;
  return `דסקטופ: כ-${d.w}×${d.h} פיקסלים, מובייל: כ-${m.w}×${m.h}. מרכז התמונה הוא האזור הבטוח ביותר כי התמונות נחתכות להתאמה.`;
})();

export default function PromoSlidesTab() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.promoSlides}/admin/all`, {
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error('יש להתחבר מחדש כדי לנהל מודעות');
      }
      if (!res.ok || !data.success) throw new Error(data.message || 'טעינה נכשלה');
      setSlides(Array.isArray(data.slides) ? data.slides : []);
    } catch (e) {
      setError(e.message || 'טעינת מודעות נכשלה');
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchProducts().then((p) => setProducts(Array.isArray(p) ? p : []));
    fetchBundles().then((b) => setBundles(Array.isArray(b) ? b : []));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (slide) => {
    setEditing(slide);
    setForm({
      image: slide.image || '',
      imageMobile: slide.imageMobile || slide.image_mobile || '',
      altHe: slide.altHe || slide.alt_he || '',
      altEn: slide.altEn || slide.alt_en || '',
      linkType: slide.linkType || slide.link_type || 'none',
      linkTarget: slide.linkTarget || slide.link_target || '',
      openInNewTab:
        slide.openInNewTab != null
          ? !!slide.openInNewTab
          : slide.open_in_new_tab != null
            ? !!slide.open_in_new_tab
            : true,
      isActive: slide.isActive !== false && slide.is_active !== false
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        image: form.image,
        imageMobile: form.imageMobile || null,
        altHe: form.altHe,
        altEn: form.altEn,
        linkType: form.linkType,
        linkTarget: form.linkType === 'none' ? null : form.linkTarget,
        openInNewTab: form.linkType === 'external' ? form.openInNewTab : false,
        isActive: form.isActive
      };
      const url = editing
        ? `${API_ENDPOINTS.promoSlides}/${editing.id}`
        : API_ENDPOINTS.promoSlides;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'שמירה נכשלה');
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e.message || 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('למחוק את המודעה?')) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.promoSlides}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'מחיקה נכשלה');
      await load();
    } catch (e) {
      setError(e.message || 'מחיקה נכשלה');
    }
  };

  const toggleActive = async (slide) => {
    const next = !(slide.isActive !== false && slide.is_active !== false);
    try {
      const res = await fetch(`${API_ENDPOINTS.promoSlides}/${slide.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: slide.image,
          imageMobile: slide.imageMobile || slide.image_mobile || null,
          altHe: slide.altHe || slide.alt_he || '',
          altEn: slide.altEn || slide.alt_en || '',
          linkType: slide.linkType || slide.link_type || 'none',
          linkTarget: slide.linkTarget || slide.link_target || null,
          openInNewTab: !!(slide.openInNewTab ?? slide.open_in_new_tab),
          isActive: next,
          sortOrder: slide.sortOrder ?? slide.sort_order ?? 0
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'עדכון נכשל');
      await load();
    } catch (e) {
      setError(e.message || 'עדכון נכשל');
    }
  };

  const move = async (index, direction) => {
    const next = [...slides];
    const j = index + direction;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    const ids = next.map((s) => s.id);
    setSlides(next);
    try {
      const res = await fetch(`${API_ENDPOINTS.promoSlides}/admin/reorder`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'שינוי סדר נכשל');
      if (Array.isArray(data.slides)) setSlides(data.slides);
      else await load();
    } catch (e) {
      setError(e.message || 'שינוי סדר נכשל');
      await load();
    }
  };

  const fillPageFromProduct = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) return;
    setForm((prev) => ({
      ...prev,
      linkType: 'page',
      linkTarget: getProductPath(product, products)
    }));
  };

  const fillPageFromBundle = (bundleId) => {
    const bundle = bundles.find((b) => String(b.id) === String(bundleId));
    if (!bundle) return;
    setForm((prev) => ({
      ...prev,
      linkType: 'page',
      linkTarget: getBundlePath(bundle)
    }));
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box dir="rtl" sx={{ textAlign: 'right' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          מודעות
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={openCreate}
          sx={{ backgroundColor: '#d8472a', '&:hover': { backgroundColor: '#c03d24' } }}
        >
          מודעה חדשה
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="right">תמונה</TableCell>
              <TableCell align="right">קישור</TableCell>
              <TableCell align="right">פעיל</TableCell>
              <TableCell align="right">סדר</TableCell>
              <TableCell align="left">פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  אין מודעות עדיין
                </TableCell>
              </TableRow>
            ) : (
              slides.map((slide, index) => {
                const active = slide.isActive !== false && slide.is_active !== false;
                const thumb = getImageUrl(slide.image);
                return (
                  <TableRow key={slide.id}>
                    <TableCell align="right">
                      {thumb ? (
                        <Box
                          component="img"
                          src={thumb}
                          alt=""
                          sx={{
                            width: 72,
                            height: 44,
                            objectFit: 'cover',
                            borderRadius: 1,
                            display: 'block'
                          }}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ maxWidth: 280 }}>
                      <Chip size="small" label={linkSummary(slide)} sx={{ maxWidth: '100%' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Switch
                        checked={active}
                        onChange={() => toggleActive(slide)}
                        size="small"
                        color="warning"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="העלה"
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === slides.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="הורד"
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                    <TableCell align="left">
                      <IconButton size="small" onClick={() => openEdit(slide)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => remove(slide.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        dir="rtl"
      >
        <DialogTitle>{editing ? 'עריכת מודעה' : 'מודעה חדשה'}</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <Typography variant="subtitle2">תמונת דסקטופ (חובה)</Typography>
          <ImageUploader
            folder="promo-slides"
            value={form.image || ''}
            onChange={(url) => {
              const next = Array.isArray(url) ? url[0] || '' : url || '';
              setForm((prev) => ({ ...prev, image: next }));
            }}
            helperText={sizeHint}
          />

          <Typography variant="subtitle2">תמונת מובייל (אופציונלי)</Typography>
          <ImageUploader
            folder="promo-slides"
            value={form.imageMobile || ''}
            onChange={(url) => {
              const next = Array.isArray(url) ? url[0] || '' : url || '';
              setForm((prev) => ({ ...prev, imageMobile: next }));
            }}
            helperText="אם ריק — תוצג תמונת הדסקטופ גם במובייל. מרכז התמונה נשמר בזמן חיתוך."
          />

          <TextField
            label="טקסט חלופי (עברית)"
            value={form.altHe}
            onChange={(e) => setForm({ ...form, altHe: e.target.value })}
            fullWidth
            inputProps={{ maxLength: 200 }}
          />
          <TextField
            label="Alt text (English)"
            value={form.altEn}
            onChange={(e) => setForm({ ...form, altEn: e.target.value })}
            fullWidth
            inputProps={{ maxLength: 200 }}
          />

          <TextField
            select
            label="סוג קישור"
            value={form.linkType}
            onChange={(e) =>
              setForm({
                ...form,
                linkType: e.target.value,
                linkTarget: e.target.value === 'none' ? '' : form.linkTarget
              })
            }
            fullWidth
          >
            {LINK_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          {form.linkType === 'page' && (
            <>
              <TextField
                label="נתיב פנימי"
                value={form.linkTarget}
                onChange={(e) => setForm({ ...form, linkTarget: e.target.value })}
                fullWidth
                placeholder="/product/..."
                helperText='חייב להתחיל ב־"/" (למשל /cart). שינוי שם מוצר בעתיד עלול לשנות את הקישור שלו.'
              />
              <TextField
                select
                label="מילוי ממוצר"
                value=""
                onChange={(e) => fillPageFromProduct(e.target.value)}
                fullWidth
              >
                <MenuItem value="" disabled>
                  בחרו מוצר…
                </MenuItem>
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name_he || p.name_en || `#${p.id}`}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="מילוי מבאנדל"
                value=""
                onChange={(e) => fillPageFromBundle(e.target.value)}
                fullWidth
              >
                <MenuItem value="" disabled>
                  בחרו באנדל…
                </MenuItem>
                {bundles.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.nameHe || b.name_he || b.nameEn || b.name_en || `#${b.id}`}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          {form.linkType === 'section' && (
            <TextField
              select
              label="סקציה בדף הבית"
              value={form.linkTarget}
              onChange={(e) => setForm({ ...form, linkTarget: e.target.value })}
              fullWidth
            >
              {HOME_SECTIONS.map((s) => (
                <MenuItem key={s.key} value={s.key}>
                  {s.label_he}
                </MenuItem>
              ))}
            </TextField>
          )}

          {form.linkType === 'external' && (
            <>
              <TextField
                label="כתובת URL"
                value={form.linkTarget}
                onChange={(e) => setForm({ ...form, linkTarget: e.target.value })}
                fullWidth
                placeholder="https://"
                helperText="רק http או https"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.openInNewTab}
                    onChange={(e) =>
                      setForm({ ...form, openInNewTab: e.target.checked })
                    }
                  />
                }
                label="פתיחה בלשונית חדשה"
              />
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
            }
            label="פעיל"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving || !form.image}
            sx={{ backgroundColor: '#d8472a' }}
          >
            {saving ? 'שומר…' : 'שמירה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
