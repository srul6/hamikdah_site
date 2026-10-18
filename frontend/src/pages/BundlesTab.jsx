import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, Alert, CircularProgress, IconButton,
  Chip, MenuItem, Select, FormControl, InputLabel, OutlinedInput, Checkbox,
  ListItemText, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { API_ENDPOINTS } from '../config';
import ImageUploader from '../components/ImageUploader';
import { computeProductPricing, formatShekel } from '../utils/productPricing';

const PRICE_ABOVE_CURRENT_WARNING =
  'המחיר גבוה ממחיר הרכישה הנפרדת הנוכחי של המוצרים (בגלל הנחות מוצר)';

function emptyForm() {
  return {
    productIds: [],
    price: '',
    image: '',
    isActive: true,
    sortOrder: '0'
  };
}

function productLabel(p) {
  if (!p) return '';
  return p.name_he || p.name_en || `#${p.id}`;
}

/** Sum of component list (regular) prices — matches API regularPrice. */
function computeOriginalTotal(products, productIds) {
  let agorot = 0;
  for (const id of productIds) {
    const p = products.find((x) => Number(x.id) === Number(id));
    if (!p) continue;
    const pricing = computeProductPricing(p);
    agorot += Math.round(Number(pricing.regularPrice) * 100);
  }
  return agorot / 100;
}

/** Sum of component effective (discounted) prices — matches API currentComponentsPrice. */
function computeCurrentComponentsTotal(products, productIds) {
  let agorot = 0;
  for (const id of productIds) {
    const p = products.find((x) => Number(x.id) === Number(id));
    if (!p) continue;
    const pricing = computeProductPricing(p);
    agorot += Math.round(Number(pricing.finalPrice) * 100);
  }
  return agorot / 100;
}

function bundleHasCurrentPriceWarning(bundle) {
  const finalPrice = Number(bundle?.finalPrice ?? bundle?.price);
  const current = Number(bundle?.currentComponentsPrice);
  return (
    Number.isFinite(finalPrice) &&
    Number.isFinite(current) &&
    current > 0 &&
    finalPrice >= current
  );
}

export default function BundlesTab() {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bundlesRes, productsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.bundles}/admin/all`, { credentials: 'include' }),
        fetch(API_ENDPOINTS.products)
      ]);
      const bundlesData = await bundlesRes.json();
      const productsData = await productsRes.json();
      if (!bundlesRes.ok || !bundlesData.success) {
        throw new Error(bundlesData.message || 'שגיאה בטעינת הבאנדלים');
      }
      setBundles(bundlesData.bundles || []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (e) {
      setError(e.message || 'שגיאה בטעינת הבאנדלים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      productIds: (b.items || []).map((item) => Number(item.product?.id)).filter(Boolean),
      price: String(b.finalPrice ?? b.price ?? ''),
      image: b.image || '',
      isActive: !!(b.isActive ?? b.is_active),
      sortOrder: String(b.sortOrder ?? b.sort_order ?? 0)
    });
    setDialogOpen(true);
  };

  const originalTotal = useMemo(
    () => computeOriginalTotal(products, form.productIds),
    [products, form.productIds]
  );
  const currentComponentsTotal = useMemo(
    () => computeCurrentComponentsTotal(products, form.productIds),
    [products, form.productIds]
  );

  const bundlePriceNum = Number(form.price);
  const savingsPercent =
    Number.isFinite(bundlePriceNum) &&
    bundlePriceNum > 0 &&
    originalTotal > 0 &&
    bundlePriceNum < originalTotal
      ? Math.round(((originalTotal - bundlePriceNum) / originalTotal) * 100)
      : 0;
  const showCurrentPriceWarning =
    form.productIds.length >= 2 &&
    Number.isFinite(bundlePriceNum) &&
    bundlePriceNum > 0 &&
    currentComponentsTotal > 0 &&
    bundlePriceNum >= currentComponentsTotal;

  const previewName = useMemo(() => {
    return form.productIds
      .map((id) => {
        const p = products.find((x) => Number(x.id) === Number(id));
        return productLabel(p);
      })
      .filter(Boolean)
      .join(' + ');
  }, [form.productIds, products]);

  const moveProduct = (index, direction) => {
    const next = [...form.productIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, productIds: next });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        productIds: form.productIds.map((id) => Number(id)),
        price: Number(form.price),
        image: form.image || null,
        is_active: form.isActive,
        sort_order: parseInt(form.sortOrder, 10) || 0
      };
      const url = editing
        ? `${API_ENDPOINTS.bundles}/${editing.id}`
        : API_ENDPOINTS.bundles;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'שמירה נכשלה');
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e.message || 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (bundle) => {
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.bundles}/${bundle.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !(bundle.isActive ?? bundle.is_active)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'עדכון נכשל');
      }
      await load();
    } catch (e) {
      setError(e.message || 'עדכון נכשל');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('למחוק את הבאנדל?')) return;
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.bundles}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'מחיקה נכשלה');
      }
      await load();
    } catch (e) {
      setError(e.message || 'מחיקה נכשלה');
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>באנדלים</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={openCreate}
          sx={{ backgroundColor: '#d8472a' }}
        >
          באנדל חדש
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
              <TableCell>שם</TableCell>
              <TableCell>מוצרים</TableCell>
              <TableCell>מחיר מקורי</TableCell>
              <TableCell>מחיר באנדל</TableCell>
              <TableCell>חיסכון</TableCell>
              <TableCell>זמינות</TableCell>
              <TableCell>פעיל</TableCell>
              <TableCell align="left">פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bundles.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.name_he || b.name_en || `(#${b.id})`}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(b.items || []).map((item) => (
                      <Chip
                        key={`${b.id}-${item.product?.id}`}
                        size="small"
                        label={productLabel(item.product)}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {formatShekel(b.regularPrice)}
                    {bundleHasCurrentPriceWarning(b) && (
                      <Tooltip title={PRICE_ABOVE_CURRENT_WARNING}>
                        <WarningAmberIcon
                          fontSize="small"
                          sx={{ color: 'warning.main' }}
                          aria-label={PRICE_ABOVE_CURRENT_WARNING}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{formatShekel(b.finalPrice ?? b.price)}</TableCell>
                <TableCell>
                  {b.hasDiscount ? `${b.savingsPercent ?? 0}%` : '—'}
                </TableCell>
                <TableCell>
                  {b.available ? 'זמין' : 'אזל מהמלאי'}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!(b.isActive ?? b.is_active)}
                    onChange={() => toggleActive(b)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="left">
                  <IconButton onClick={() => openEdit(b)} aria-label="עריכה">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => remove(b.id)} aria-label="מחיקה">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!bundles.length && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  אין באנדלים עדיין
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editing ? 'עריכת באנדל' : 'באנדל חדש'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }} dir="rtl">
          <FormControl fullWidth>
            <InputLabel id="bundle-products-label">מוצרים (2–4)</InputLabel>
            <Select
              labelId="bundle-products-label"
              multiple
              value={form.productIds}
              onChange={(e) => {
                const value = e.target.value;
                const ids = typeof value === 'string' ? value.split(',') : value;
                const limited = ids.map(Number).slice(0, 4);
                setForm({ ...form, productIds: limited });
              }}
              input={<OutlinedInput label="מוצרים (2–4)" />}
              renderValue={(selected) =>
                selected
                  .map((id) => productLabel(products.find((p) => Number(p.id) === Number(id))))
                  .join(' + ')
              }
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={Number(p.id)}>
                  <Checkbox checked={form.productIds.includes(Number(p.id))} />
                  <ListItemText primary={productLabel(p)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {form.productIds.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                סדר המוצרים בשם הבאנדל
              </Typography>
              {form.productIds.map((id, index) => (
                <Box
                  key={id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.03)'
                  }}
                >
                  <Typography variant="body2">
                    {index + 1}. {productLabel(products.find((p) => Number(p.id) === Number(id)))}
                  </Typography>
                  <Box>
                    <IconButton size="small" onClick={() => moveProduct(index, -1)} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => moveProduct(index, 1)}
                      disabled={index === form.productIds.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          <Alert severity="info" sx={{ py: 0.5 }}>
            שם אוטומטי: <strong>{previewName || '—'}</strong>
          </Alert>

          <TextField
            label="מחיר הבאנדל"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            fullWidth
            inputProps={{ min: 0, step: '0.01' }}
            helperText={
              form.productIds.length >= 2
                ? `סכום מקורי: ${formatShekel(originalTotal)}${
                    savingsPercent > 0 ? ` · חיסכון ${savingsPercent}%` : ''
                  }`
                : 'בחרו לפחות שני מוצרים'
            }
          />

          {showCurrentPriceWarning && (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              {PRICE_ABOVE_CURRENT_WARNING}
            </Alert>
          )}

          <TextField
            label="סדר תצוגה"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
            }
            label="פעיל"
          />

          <Typography variant="subtitle2">תמונת כרטיס (אופציונלי)</Typography>
          <ImageUploader
            folder="homepage"
            value={form.image || null}
            onChange={(url) => setForm({ ...form, image: url || '' })}
            helperText="השאירו ריק כדי לייצר אוטומטית את תמונת הכרטיס מתמונות המוצרים"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving || form.productIds.length < 2}
            sx={{ backgroundColor: '#d8472a' }}
          >
            {saving ? 'שומר…' : 'שמירה'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
