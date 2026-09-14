import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControlLabel, Switch, Alert, CircularProgress,
  IconButton, Checkbox, ListItemText, OutlinedInput, Select, InputLabel, FormControl
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_ENDPOINTS } from '../config';
import ImageUploader from '../components/ImageUploader';

export default function GiftsTab() {
  const [books, setBooks] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookDialog, setBookDialog] = useState(false);
  const [promoDialog, setPromoDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editingPromo, setEditingPromo] = useState(null);
  const [bookForm, setBookForm] = useState({ title: '', imageUrls: [], active: true });
  const [promoForm, setPromoForm] = useState({
    productId: '',
    giftsPerUnit: '1',
    bookIds: [],
    active: true,
    startDate: '',
    endDate: ''
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [booksRes, promosRes, productsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.gifts}/admin/books`, { credentials: 'include' }),
        fetch(`${API_ENDPOINTS.gifts}/admin/promotions`, { credentials: 'include' }),
        fetch(API_ENDPOINTS.products)
      ]);
      const booksData = await booksRes.json();
      const promosData = await promosRes.json();
      const productsData = await productsRes.json();
      if (!booksRes.ok || !booksData.success) throw new Error('Failed to load books');
      if (!promosRes.ok || !promosData.success) throw new Error('Failed to load promotions');
      setBooks(booksData.books || []);
      setPromotions(promosData.promotions || []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (e) {
      setError(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveBook = async () => {
    setSaving(true);
    try {
      const url = editingBook
        ? `${API_ENDPOINTS.gifts}/admin/books/${editingBook.id}`
        : `${API_ENDPOINTS.gifts}/admin/books`;
      const res = await fetch(url, {
        method: editingBook ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
      setBookDialog(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const savePromo = async () => {
    setSaving(true);
    try {
      const payload = {
        productId: parseInt(promoForm.productId, 10),
        giftsPerUnit: parseInt(promoForm.giftsPerUnit, 10) || 1,
        bookIds: promoForm.bookIds,
        active: promoForm.active,
        startDate: promoForm.startDate || null,
        endDate: promoForm.endDate || null
      };
      const url = editingPromo
        ? `${API_ENDPOINTS.gifts}/admin/promotions/${editingPromo.id}`
        : `${API_ENDPOINTS.gifts}/admin/promotions`;
      const res = await fetch(url, {
        method: editingPromo ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
      setPromoDialog(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const productName = (id) => {
    const p = products.find((x) => String(x.id) === String(id));
    return p ? (p.name_he || p.name_en || `#${id}`) : `#${id}`;
  };

  if (loading) return <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Gift books</Typography>
        <Button startIcon={<AddIcon />} variant="contained" sx={{ backgroundColor: '#d8472a' }}
          onClick={() => {
            setEditingBook(null);
            setBookForm({ title: '', imageUrls: [], active: true });
            setBookDialog(true);
          }}>Add book</Button>
      </Box>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.title}</TableCell>
                <TableCell>{b.active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => {
                    setEditingBook(b);
                    setBookForm({
                      title: b.title,
                      imageUrls: b.imageUrls || b.image_urls || [],
                      active: !!b.active
                    });
                    setBookDialog(true);
                  }}><EditIcon /></IconButton>
                  <IconButton onClick={async () => {
                    if (!window.confirm('Delete book?')) return;
                    await fetch(`${API_ENDPOINTS.gifts}/admin/books/${b.id}`, {
                      method: 'DELETE', credentials: 'include'
                    });
                    await load();
                  }}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Gift promotions</Typography>
        <Button startIcon={<AddIcon />} variant="contained" sx={{ backgroundColor: '#d8472a' }}
          onClick={() => {
            setEditingPromo(null);
            setPromoForm({
              productId: products[0]?.id ? String(products[0].id) : '',
              giftsPerUnit: '1',
              bookIds: [],
              active: true,
              startDate: '',
              endDate: ''
            });
            setPromoDialog(true);
          }}>Add promotion</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Gifts / unit</TableCell>
              <TableCell>Books</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{productName(p.productId)}</TableCell>
                <TableCell>{p.giftsPerUnit}</TableCell>
                <TableCell>{(p.books || []).map((b) => b.title).join(', ') || '—'}</TableCell>
                <TableCell>{p.active ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => {
                    setEditingPromo(p);
                    setPromoForm({
                      productId: String(p.productId),
                      giftsPerUnit: String(p.giftsPerUnit),
                      bookIds: p.bookIds || (p.books || []).map((b) => b.id),
                      active: !!p.active,
                      startDate: p.startDate ? String(p.startDate).slice(0, 10) : '',
                      endDate: p.endDate ? String(p.endDate).slice(0, 10) : ''
                    });
                    setPromoDialog(true);
                  }}><EditIcon /></IconButton>
                  <IconButton onClick={async () => {
                    if (!window.confirm('Delete promotion?')) return;
                    await fetch(`${API_ENDPOINTS.gifts}/admin/promotions/${p.id}`, {
                      method: 'DELETE', credentials: 'include'
                    });
                    await load();
                  }}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={bookDialog} onClose={() => setBookDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBook ? 'Edit book' : 'New book'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Title" value={bookForm.title} fullWidth
            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
          <FormControlLabel control={<Switch checked={bookForm.active}
            onChange={(e) => setBookForm({ ...bookForm, active: e.target.checked })} />} label="Active" />
          <ImageUploader multiple folder="gifts" value={bookForm.imageUrls}
            onChange={(imgs) => setBookForm({
              ...bookForm,
              imageUrls: Array.isArray(imgs) ? imgs : []
            })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={saving || !bookForm.title.trim()}
            onClick={saveBook} sx={{ backgroundColor: '#d8472a' }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={promoDialog} onClose={() => setPromoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPromo ? 'Edit promotion' : 'New promotion'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField select label="Product" value={promoForm.productId} fullWidth
            onChange={(e) => setPromoForm({ ...promoForm, productId: e.target.value })}>
            {products.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.name_he || p.name_en || p.id}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Gifts per unit" type="number" value={promoForm.giftsPerUnit} fullWidth
            onChange={(e) => setPromoForm({ ...promoForm, giftsPerUnit: e.target.value })} />
          <FormControl fullWidth>
            <InputLabel>Books</InputLabel>
            <Select
              multiple
              value={promoForm.bookIds.map(String)}
              onChange={(e) => setPromoForm({
                ...promoForm,
                bookIds: e.target.value.map((v) => parseInt(v, 10))
              })}
              input={<OutlinedInput label="Books" />}
              renderValue={(selected) =>
                books.filter((b) => selected.includes(String(b.id))).map((b) => b.title).join(', ')
              }
            >
              {books.map((b) => (
                <MenuItem key={b.id} value={String(b.id)}>
                  <Checkbox checked={promoForm.bookIds.map(String).includes(String(b.id))} />
                  <ListItemText primary={b.title} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start" type="date" InputLabelProps={{ shrink: true }} fullWidth
              value={promoForm.startDate}
              onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })} />
            <TextField label="End" type="date" InputLabelProps={{ shrink: true }} fullWidth
              value={promoForm.endDate}
              onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })} />
          </Box>
          <FormControlLabel control={<Switch checked={promoForm.active}
            onChange={(e) => setPromoForm({ ...promoForm, active: e.target.checked })} />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={saving || !promoForm.productId}
            onClick={savePromo} sx={{ backgroundColor: '#d8472a' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
