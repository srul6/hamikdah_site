import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, Alert, CircularProgress, IconButton, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_ENDPOINTS } from '../config';

function emptyLink() {
  return { url: '', labelHe: '', labelEn: '' };
}

function emptyForm() {
  return {
    questionHe: '',
    questionEn: '',
    answerHe: '',
    answerEn: '',
    links: [],
    sortOrder: '0',
    active: true
  };
}

export default function FaqsTab() {
  const [items, setItems] = useState([]);
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
      const res = await fetch(`${API_ENDPOINTS.faq}/admin/all`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error('Please log in again to manage FAQ');
      }
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e.message || 'Failed to load FAQ');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      questionHe: item.questionHe || item.question_he || '',
      questionEn: item.questionEn || item.question_en || '',
      answerHe: item.answerHe || item.answer_he || '',
      answerEn: item.answerEn || item.answer_en || '',
      links: Array.isArray(item.links)
        ? item.links.map((l) => ({
            url: l.url || '',
            labelHe: l.labelHe || l.label_he || '',
            labelEn: l.labelEn || l.label_en || ''
          }))
        : [],
      sortOrder: String(item.sortOrder ?? item.sort_order ?? 0),
      active: item.active !== false
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        questionHe: form.questionHe,
        questionEn: form.questionEn,
        answerHe: form.answerHe,
        answerEn: form.answerEn,
        links: form.links,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        active: form.active
      };
      const url = editing
        ? `${API_ENDPOINTS.faq}/admin/${editing.id}`
        : `${API_ENDPOINTS.faq}/admin`;
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
    if (!window.confirm('Delete this FAQ item?')) return;
    try {
      const res = await fetch(`${API_ENDPOINTS.faq}/admin/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      await load();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  const updateLink = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((l, i) => (i === index ? { ...l, ...patch } : l))
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          FAQ / Q&amp;A
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ backgroundColor: '#d8472a', '&:hover': { backgroundColor: '#c03d24' } }}
        >
          New question
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Question (HE)</TableCell>
                <TableCell>Question (EN)</TableCell>
                <TableCell>Links</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sortOrder ?? item.sort_order ?? 0}</TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    {item.questionHe || item.question_he}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    {item.questionEn || item.question_en}
                  </TableCell>
                  <TableCell>
                    {(item.links || []).length ? (
                      <Chip size="small" label={`${item.links.length}`} />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{item.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => remove(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No FAQ items yet
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit FAQ item' : 'New FAQ item'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Question (Hebrew)"
            value={form.questionHe}
            onChange={(e) => setForm({ ...form, questionHe: e.target.value })}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Question (English)"
            value={form.questionEn}
            onChange={(e) => setForm({ ...form, questionEn: e.target.value })}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Answer (Hebrew)"
            value={form.answerHe}
            onChange={(e) => setForm({ ...form, answerHe: e.target.value })}
            fullWidth
            multiline
            minRows={3}
            helperText="Insert link placeholders like {{0}}, {{1}} where a link should appear"
          />
          <TextField
            label="Answer (English)"
            value={form.answerEn}
            onChange={(e) => setForm({ ...form, answerEn: e.target.value })}
            fullWidth
            multiline
            minRows={3}
            helperText="Same placeholders: {{0}} matches the first link below"
          />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography fontWeight={600}>Links in answer</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  setForm((prev) => ({ ...prev, links: [...prev.links, emptyLink()] }))
                }
              >
                Add link
              </Button>
            </Box>
            {form.links.map((link, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Placeholder: {`{{${index}}}`}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <TextField
                    label="URL"
                    value={link.url}
                    onChange={(e) => updateLink(index, { url: e.target.value })}
                    fullWidth
                    size="small"
                    placeholder="https://wa.me/972..."
                  />
                  <TextField
                    label="Link label (Hebrew)"
                    value={link.labelHe}
                    onChange={(e) => updateLink(index, { labelHe: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Link label (English)"
                    value={link.labelEn}
                    onChange={(e) => updateLink(index, { labelEn: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <Button
                    color="error"
                    size="small"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        links: prev.links.filter((_, i) => i !== index)
                      }))
                    }
                  >
                    Remove link
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>

          <TextField
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={{ backgroundColor: '#d8472a', '&:hover': { backgroundColor: '#c03d24' } }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
