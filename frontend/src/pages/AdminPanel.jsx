import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, TextField, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import { API_ENDPOINTS } from '../config';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name_he: '',
    name_en: '',
    description_he: '',
    description_en: '',
    price: '',
    quantity: '',
    homepageimage: '',
    extraimages: '',
    buildingTime: '',
    pieces: '',
    size: '',
    recommendedAge: '',
    children_playing: '',
    desktop_hero_images: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    // Check if user is already authenticated
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_ENDPOINTS.admin}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        const token = 'admin-token-' + Date.now();
        localStorage.setItem('adminToken', token);
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.products);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      name_he: formData.name_he,
      name_en: formData.name_en,
      description_he: formData.description_he,
      description_en: formData.description_en,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity) || 0,
      homepageimage: formData.homepageimage,
      extraimages: formData.extraimages.split(',').map(img => img.trim()).filter(img => img),
      buildingTime: formData.buildingTime ? parseInt(formData.buildingTime) : null,
      pieces: formData.pieces || null,
      size: formData.size || null,
      recommendedAge: formData.recommendedAge || null,
      children_playing: formData.children_playing
        ? formData.children_playing.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      desktop_hero_images: formData.desktop_hero_images
        ? formData.desktop_hero_images.split(',').map(s => s.trim()).filter(Boolean)
        : []
    };

    try {
      const url = editingProduct
        ? `${API_ENDPOINTS.products}/${editingProduct.id}`
        : API_ENDPOINTS.products;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      } else {
        alert('Error saving product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name_he: product.name_he || '',
      name_en: product.name_en || '',
      description_he: product.description_he || '',
      description_en: product.description_en || '',
      price: product.price.toString(),
      quantity: (product.quantity || 0).toString(),
      homepageimage: product.homepageimage || '',
      extraimages: product.extraimages ? product.extraimages.join(', ') : '',
      buildingTime: product.buildingTime ? product.buildingTime.toString() : '',
      pieces: product.pieces || '',
      size: product.size || '',
      recommendedAge: product.recommendedAge || '',
      children_playing: Array.isArray(product.children_playing) ? product.children_playing.join(', ') : '',
      desktop_hero_images: Array.isArray(product.desktop_hero_images) ? product.desktop_hero_images.join(', ') : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.products}/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchProducts();
          alert('Product deleted successfully!');
        } else {
          alert('Error deleting product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name_he: '',
      name_en: '',
      description_he: '',
      description_en: '',
      price: '',
      quantity: '',
      homepageimage: '',
      extraimages: '',
      buildingTime: '',
      pieces: '',
      size: '',
      recommendedAge: '',
      children_playing: '',
      desktop_hero_images: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LockIcon sx={{ fontSize: 48, color: '#0071e3', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1 }}>
              Admin Login
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your credentials to access the admin panel
            </Typography>
          </Box>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
              required
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              sx={{ mb: 3 }}
            />

            {loginError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {loginError}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#0071e3',
                '&:hover': { backgroundColor: '#0077ed' },
                py: 1.5
              }}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Container>
    );
  }

  // Show admin panel if authenticated
  return (
    <Container maxWidth="lg" sx={{ py: 8, mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
          Admin Panel
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{
              backgroundColor: '#0071e3',
              '&:hover': { backgroundColor: '#0077ed' }
            }}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            onClick={handleLogout}
            sx={{
              borderColor: '#ff3b30',
              color: '#ff3b30',
              '&:hover': {
                borderColor: '#ff3b30',
                backgroundColor: 'rgba(255, 59, 48, 0.1)'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Image Setup:</strong> Upload your images to Supabase Storage in the "product-images" bucket,
          then use the filename (e.g., "candle.jpg") in the form fields below.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} md={6} lg={4} key={product.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                {/* Product Image */}
                {product.homepageimage && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <img
                      src={product.homepageimage}
                      alt={product.name_he || product.name_en}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {product.name_he || product.name_en}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(product)}
                      sx={{ color: '#0071e3' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(product.id)}
                      sx={{ color: '#ff3b30' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {product.description_he || product.description_en}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0071e3' }}>
                    ₪{product.price}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: (product.quantity || 0) > 0 ? '#28a745' : '#dc3545',
                      fontWeight: 600
                    }}
                  >
                    Quantity: {product.quantity || 0}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  ID: {product.id}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Enter only the filename (e.g., "candle.jpg") for images uploaded to Supabase Storage in the "product-images" bucket.
              </Typography>
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Name (Hebrew)"
                  value={formData.name_he}
                  onChange={(e) => handleInputChange('name_he', e.target.value)}
                  required
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Product Name (English)"
                  value={formData.name_en}
                  onChange={(e) => handleInputChange('name_en', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description (Hebrew)"
                  multiline
                  rows={3}
                  value={formData.description_he}
                  onChange={(e) => handleInputChange('description_he', e.target.value)}
                  required
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description (English)"
                  multiline
                  rows={3}
                  value={formData.description_en}
                  onChange={(e) => handleInputChange('description_en', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity Available"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  required
                  helperText="Number of items in stock"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Homepage Image Filename"
                  value={formData.homepageimage}
                  onChange={(e) => handleInputChange('homepageimage', e.target.value)}
                  placeholder="e.g., candle.jpg"
                  helperText="Image shown on the main product listing page"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Extra Images (comma-separated filenames)"
                  value={formData.extraimages}
                  onChange={(e) => handleInputChange('extraimages', e.target.value)}
                  placeholder="e.g., image1.jpg, image2.jpg"
                  helperText="Additional images for the product gallery"
                />
              </Grid>
            </Grid>

            {/* Desktop Hero Images */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
              Desktop Hero Images
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Desktop Hero Images (comma-separated filenames)"
                  value={formData.desktop_hero_images}
                  onChange={(e) => handleInputChange('desktop_hero_images', e.target.value)}
                  placeholder="e.g., mikdash_web_screen.png, logo_mikdash_web_screen.png"
                  helperText="Two images for the desktop hero section (left and right squares)"
                />
              </Grid>
            </Grid>

            {/* Children Playing Media */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
              Children Playing Media
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Children Playing Media (comma-separated filenames)"
                  value={formData.children_playing}
                  onChange={(e) => handleInputChange('children_playing', e.target.value)}
                  placeholder="e.g., child1.jpg, child2.jpg, child3.mp4"
                  helperText="Images and videos to show in the children playing scroller"
                />
              </Grid>
            </Grid>

            {/* Product Features Section */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
              Product Features
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Building Time (hours)"
                  type="number"
                  value={formData.buildingTime}
                  onChange={(e) => handleInputChange('buildingTime', e.target.value)}
                  placeholder="e.g., 2"
                  helperText="Estimated building time in hours"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Pieces"
                  value={formData.pieces}
                  onChange={(e) => handleInputChange('pieces', e.target.value)}
                  placeholder="e.g., 800+"
                  helperText="Number of pieces in the kit"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Size"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder="e.g., 30×25×20 cm"
                  helperText="Product dimensions"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Recommended Age"
                  value={formData.recommendedAge}
                  onChange={(e) => handleInputChange('recommendedAge', e.target.value)}
                  placeholder="e.g., 10+"
                  helperText="Recommended age for the product"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
} 