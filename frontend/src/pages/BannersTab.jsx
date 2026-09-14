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
import { API_ENDPOINTS } from '../config';
import ImageUploader from '../components/ImageUploader';

const PLACEMENTS = [
  { value: 'site_entry', label: 'Site entry' },
  { value: 'homepage_section', label: 'Homepage section' },
  { value: 'cart', label: 'Cart' }
];

function emptyForm() {
  return {
    title: '',
    bodyText: '',
    buttonText: '',
    buttonLink: '',
    placement: 'site_entry',
    images: [],
    active: true,
    startDate: '',
    endDate: '',
    sortOrder: '0'
  };
}

export default function BannersTab() {
  const [banners, setBanners] = useState([]);
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
      const res = await fetch(`${API_ENDPOINTS.banners}/admin/all`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setBanners(data.banners || []);
    } catch (e) {
      setError(e.message || 'Failed to load banners');
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
      title: b.title || '',
      bodyText: b.bodyText || b.body_text || '',
      buttonText: b.buttonText || b.button_text || '',
      buttonLink: b.buttonLink || b.button_link || '',
      placement: b.placement,
      images: b.images || [],
      active: !!b.active,
      startDate: b.startDate ? String(b.startDate).slice(0, 10) : '',
      endDate: b.endDate ? String(b.endDate).slice(0, 10) : '',
      sortOrder: String(b.sortOrder ?? 0)
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        bodyText: form.bodyText,
        buttonText: form.buttonText,
        buttonLink: form.buttonLink,
        placement: form.placement,
        images: form.images,
        active: form.active,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        sortOrder: parseInt(form.sortOrder, 10) || 0
      };
      const url = editing
        ? `${API_ENDPOINTS.banners}/admin/${editing.id}`
        : `${API_ENDPOINTS.banners}/admin`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
      setDialogOpen(false);
      await load();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    await fetch(`${API_ENDPOINTS.banners}/admin/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    await load();
  };

  if (loading) return <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Banners</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}
          sx={{ backgroundColor: '#d8472a' }}>New banner</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Placement</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Order</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banners.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.title || '(no title)'}</TableCell>
                <TableCell><Chip size="small" label={b.placement} /></TableCell>
                <TableCell>{b.active ? 'Yes' : 'No'}</TableCell>
                <TableCell>{b.sortOrder}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(b)}><EditIcon /></IconButton>
                  <IconButton onClick={() => remove(b.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit banner' : 'New banner'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField select label="Placement" value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value })} fullWidth>
            {PLACEMENTS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
          </TextField>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Body" value={form.bodyText} multiline minRows={2}
            onChange={(e) => setForm({ ...form, bodyText: e.target.value })} fullWidth />
          <TextField label="Button text" value={form.buttonText}
            onChange={(e) => setForm({ ...form, buttonText: e.target.value })} fullWidth />
          <TextField label="Button link" value={form.buttonLink}
            onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} fullWidth
            helperText="Leave empty to hide button" />
          <TextField label="Sort order" type="number" value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }}
              value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth />
            <TextField label="End date" type="date" InputLabelProps={{ shrink: true }}
              value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth />
          </Box>
          <FormControlLabel control={<Switch checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })} />} label="Active" />
          <Typography variant="subtitle2">Images</Typography>
          <ImageUploader
            multiple
            folder="banners"
            value={form.images}
            onChange={(imgs) => setForm({ ...form, images: Array.isArray(imgs) ? imgs : [] })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}
            sx={{ backgroundColor: '#d8472a' }}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
