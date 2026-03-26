import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_ENDPOINTS } from '../config';

const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed (₪)' }
];

function emptyFormState() {
  const today = new Date().toISOString().split('T')[0];
  const inOneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return {
    code: '',
    discount: '',
    type: 'percentage',
    minAmount: '0',
    maxDiscount: '',
    validFrom: today,
    validUntil: inOneYear,
    maxUsage: '100',
    isActive: true
  };
}

function validateCouponForm(form) {
  const errors = {};
  const code = String(form.code || '').trim().toUpperCase();
  if (!code) errors.code = 'Code is required';
  else if (code.length > 64) errors.code = 'Code is too long';

  const discount = parseFloat(form.discount);
  if (Number.isNaN(discount) || discount <= 0) errors.discount = 'Enter a valid discount greater than 0';
  else if (form.type === 'percentage' && discount > 100) errors.discount = 'Percentage cannot exceed 100';

  const minAmount = parseFloat(form.minAmount);
  if (Number.isNaN(minAmount) || minAmount < 0) errors.minAmount = 'Minimum amount must be 0 or greater';

  let maxDiscount = form.maxDiscount === '' || form.maxDiscount === null ? null : parseFloat(form.maxDiscount);
  if (maxDiscount !== null && (Number.isNaN(maxDiscount) || maxDiscount < 0)) {
    errors.maxDiscount = 'Enter a valid cap or leave empty';
  }

  if (!form.validFrom) errors.validFrom = 'Start date is required';
  if (!form.validUntil) errors.validUntil = 'End date is required';
  if (form.validFrom && form.validUntil && form.validFrom > form.validUntil) {
    errors.validUntil = 'End date must be on or after start date';
  }

  const maxUsage = parseInt(form.maxUsage, 10);
  if (Number.isNaN(maxUsage) || maxUsage < 1) errors.maxUsage = 'Max usage must be at least 1';

  return { errors, code, discount, minAmount, maxDiscount, maxUsage };
}

export default function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(emptyFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggleBusyId, setToggleBusyId] = useState(null);

  const loadCoupons = useCallback(async () => {
    setListError('');
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.coupons, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError(data.message || 'Failed to load coupons');
        setCoupons([]);
        return;
      }
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      } else {
        setListError('Invalid response from server');
        setCoupons([]);
      }
    } catch (e) {
      console.error(e);
      setListError('Network error while loading coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const openCreate = () => {
    setEditingCoupon(null);
    setForm(emptyFormState());
    setFormErrors({});
    setSubmitError('');
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingCoupon(row);
    setForm({
      code: row.code || '',
      discount: String(row.discount ?? ''),
      type: row.type === 'fixed' ? 'fixed' : 'percentage',
      minAmount: String(row.minAmount ?? 0),
      maxDiscount: row.maxDiscount != null ? String(row.maxDiscount) : '',
      validFrom: row.validFrom || '',
      validUntil: row.validUntil || '',
      maxUsage: String(row.maxUsage ?? 100),
      isActive: !!row.isActive
    });
    setFormErrors({});
    setSubmitError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingCoupon(null);
    setSubmitError('');
    setFormErrors({});
  };

  const handleSubmit = async () => {
    const { errors, code, discount, minAmount, maxDiscount, maxUsage } = validateCouponForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    setSubmitError('');
    try {
      const maxDiscResolved =
        maxDiscount != null
          ? maxDiscount
          : form.type === 'percentage'
            ? 1_000_000
            : discount;

      const payload = {
        code,
        discount,
        type: form.type,
        minAmount,
        maxDiscount: maxDiscResolved,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        maxUsage,
        isActive: !!form.isActive
      };

      const url = editingCoupon
        ? `${API_ENDPOINTS.coupons}/${editingCoupon.id}`
        : API_ENDPOINTS.coupons;
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setSubmitError(data.message || 'Request failed');
        return;
      }
      setDialogOpen(false);
      setEditingCoupon(null);
      await loadCoupons();
    } catch (e) {
      console.error(e);
      setSubmitError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (row) => {
    setToggleBusyId(row.id);
    try {
      const res = await fetch(`${API_ENDPOINTS.coupons}/${row.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !row.isActive })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setListError(data.message || 'Failed to update coupon');
        return;
      }
      setCoupons((prev) =>
        prev.map((c) => (c.id === row.id ? { ...c, isActive: !row.isActive } : c))
      );
      setListError('');
    } catch (e) {
      console.error(e);
      setListError('Network error while updating coupon');
    } finally {
      setToggleBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.coupons}/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setListError(data.message || 'Failed to delete coupon');
        return;
      }
      setDeleteTarget(null);
      setListError('');
      await loadCoupons();
    } catch (e) {
      console.error(e);
      setListError('Network error while deleting coupon');
    } finally {
      setDeleting(false);
    }
  };

  const formatDiscountCell = (row) => {
    if (row.type === 'percentage') return `${row.discount}%`;
    return `₪${Number(row.discount).toFixed(2)}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Coupons
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{
            backgroundColor: '#0071e3',
            '&:hover': { backgroundColor: '#0077ed' }
          }}
        >
          Add Coupon
        </Button>
      </Box>

      {listError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setListError('')}>
          {listError}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflowX: 'auto'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#667eea' }} />
          </Box>
        ) : (
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#667eea' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Discount</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Min ₪</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Valid until</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Active</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Usage</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No coupons yet. Add one to get started.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((row) => (
                  <TableRow key={row.id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#fafafa' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{formatDiscountCell(row)}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.type === 'percentage' ? 'Percentage' : 'Fixed'}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          backgroundColor:
                            row.type === 'percentage'
                              ? 'rgba(102, 126, 234, 0.12)'
                              : 'rgba(0, 113, 227, 0.12)',
                          color: row.type === 'percentage' ? '#667eea' : '#0071e3'
                        }}
                      />
                    </TableCell>
                    <TableCell>₪{Number(row.minAmount).toFixed(2)}</TableCell>
                    <TableCell>{row.validUntil || '—'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!row.isActive}
                        onChange={() => handleToggleActive(row)}
                        disabled={toggleBusyId === row.id}
                        size="small"
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      {row.usageCount ?? 0} / {row.maxUsage ?? '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#667eea' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(row)}
                          sx={{ color: '#ff3b30' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Create / Edit */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCoupon ? 'Edit coupon' : 'New coupon'}</DialogTitle>
        <DialogContent dividers>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <TextField
              label="Code"
              required
              fullWidth
              value={form.code}
              disabled={!!editingCoupon}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              error={!!formErrors.code}
              helperText={formErrors.code || (editingCoupon ? 'Code cannot be changed' : 'Stored in uppercase')}
              inputProps={{ maxLength: 64 }}
            />
            <TextField
              label={form.type === 'percentage' ? 'Discount (%)' : 'Discount (₪)'}
              required
              fullWidth
              type="number"
              inputProps={{ min: 0, step: form.type === 'percentage' ? 1 : 0.01 }}
              value={form.discount}
              onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
              error={!!formErrors.discount}
              helperText={formErrors.discount}
            />
            <TextField
              select
              label="Type"
              required
              fullWidth
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {COUPON_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Minimum order amount (₪)"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={form.minAmount}
              onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))}
              error={!!formErrors.minAmount}
              helperText={formErrors.minAmount || '0 = no minimum'}
            />
            <TextField
              label="Max discount cap (₪)"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={form.maxDiscount}
              onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
              error={!!formErrors.maxDiscount}
              helperText={formErrors.maxDiscount || 'Leave empty to default to discount value'}
            />
            <TextField
              label="Valid from"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.validFrom}
              onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
              error={!!formErrors.validFrom}
              helperText={formErrors.validFrom}
            />
            <TextField
              label="Valid until"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={form.validUntil}
              onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
              error={!!formErrors.validUntil}
              helperText={formErrors.validUntil}
            />
            <TextField
              label="Max uses"
              fullWidth
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={form.maxUsage}
              onChange={(e) => setForm((f) => ({ ...f, maxUsage: e.target.value }))}
              error={!!formErrors.maxUsage}
              helperText={formErrors.maxUsage}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ backgroundColor: '#0071e3' }}>
            {saving ? <CircularProgress size={22} color="inherit" /> : editingCoupon ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete coupon?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently remove <strong>{deleteTarget?.code}</strong>. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={22} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
