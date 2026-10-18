import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { API_ENDPOINTS } from '../config';
import ImageUploader from '../components/ImageUploader';

function emptyForm() {
  return {
    titleHe: '',
    titleEn: '',
    bodyHe: '',
    bodyEn: '',
    imageUrl: '',
    imageDescriptionHe: '',
    imageDescriptionEn: '',
    imageCopyrightHe: '',
    imageCopyrightEn: '',
    active: true
  };
}

function formFromSection(section) {
  if (!section) return emptyForm();
  return {
    titleHe: section.titleHe || section.title_he || '',
    titleEn: section.titleEn || section.title_en || '',
    bodyHe: section.bodyHe || section.body_he || '',
    bodyEn: section.bodyEn || section.body_en || '',
    imageUrl: section.imageUrl || section.image_url || '',
    imageDescriptionHe: section.imageDescriptionHe || section.image_description_he || '',
    imageDescriptionEn: section.imageDescriptionEn || section.image_description_en || '',
    imageCopyrightHe: section.imageCopyrightHe || section.image_copyright_he || '',
    imageCopyrightEn: section.imageCopyrightEn || section.image_copyright_en || '',
    active: section.active !== false
  };
}

export default function HomepageTextTab() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_ENDPOINTS.homepageText}/admin`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        throw new Error('Please log in again to manage homepage text');
      }
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setForm(formFromSection(data.section));
    } catch (e) {
      setError(e.message || 'Failed to load homepage text');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess('');
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_ENDPOINTS.homepageText}/admin`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleHe: form.titleHe,
          titleEn: form.titleEn,
          bodyHe: form.bodyHe,
          bodyEn: form.bodyEn,
          imageUrl: form.imageUrl || '',
          imageDescriptionHe: form.imageDescriptionHe || '',
          imageDescriptionEn: form.imageDescriptionEn || '',
          imageCopyrightHe: form.imageCopyrightHe || '',
          imageCopyrightEn: form.imageCopyrightEn || '',
          active: form.active
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Save failed');
      setForm(formFromSection(data.section));
      setSuccess('Homepage text saved. Empty body text hides the section on the site.');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const bodyEmpty = !String(form.bodyHe || '').trim() && !String(form.bodyEn || '').trim();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Homepage text
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Optional section shown on the homepage just above the comments. Clear the body text (or turn Active off) to hide it completely. The image, description, and copyright are optional.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={save}
          disabled={saving || loading}
          sx={{ backgroundColor: '#d8472a', '&:hover': { backgroundColor: '#c03d24' } }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      ) : null}
      {!loading && bodyEmpty ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Both Hebrew and English body fields are empty — the section will not appear on the homepage.
        </Alert>
      ) : null}
      {!loading && !form.active ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Active is off — the section is hidden on the homepage even if text is present.
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={(e) => setField('active', e.target.checked)}
                color="primary"
              />
            }
            label="Active (show on homepage when body text is set)"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <ImageUploader
              label="Section image (optional)"
              value={form.imageUrl}
              onChange={(url) => setField('imageUrl', url || '')}
              helperText="Shown to the left of the text on desktop. Delete to remove. Leave empty for text-only layout."
              folder="homepage"
            />
            <TextField
              label="Image description (Hebrew)"
              value={form.imageDescriptionHe}
              onChange={(e) => setField('imageDescriptionHe', e.target.value)}
              fullWidth
              inputProps={{ dir: 'rtl' }}
              helperText="Shown directly below the image. Leave empty to hide."
            />
            <TextField
              label="Image description (English)"
              value={form.imageDescriptionEn}
              onChange={(e) => setField('imageDescriptionEn', e.target.value)}
              fullWidth
              helperText="Shown directly below the image. Leave empty to hide."
            />
            <TextField
              label="Image copyright (Hebrew)"
              value={form.imageCopyrightHe}
              onChange={(e) => setField('imageCopyrightHe', e.target.value)}
              fullWidth
              inputProps={{ dir: 'rtl' }}
              helperText="Photographer credit or copyright, below the description. Leave empty to hide."
            />
            <TextField
              label="Image copyright (English)"
              value={form.imageCopyrightEn}
              onChange={(e) => setField('imageCopyrightEn', e.target.value)}
              fullWidth
              helperText="Photographer credit or copyright, below the description. Leave empty to hide."
            />

            <TextField
              label="Title (Hebrew)"
              value={form.titleHe}
              onChange={(e) => setField('titleHe', e.target.value)}
              fullWidth
              inputProps={{ dir: 'rtl' }}
            />
            <TextField
              label="Body (Hebrew)"
              value={form.bodyHe}
              onChange={(e) => setField('bodyHe', e.target.value)}
              fullWidth
              multiline
              minRows={4}
              inputProps={{ dir: 'rtl' }}
              helperText="Required for the Hebrew site. Leave empty to hide the section in Hebrew. Selected words are highlighted automatically."
            />
            <TextField
              label="Title (English)"
              value={form.titleEn}
              onChange={(e) => setField('titleEn', e.target.value)}
              fullWidth
            />
            <TextField
              label="Body (English)"
              value={form.bodyEn}
              onChange={(e) => setField('bodyEn', e.target.value)}
              fullWidth
              multiline
              minRows={4}
              helperText="Required for the English site. Leave empty to hide the section in English."
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}
