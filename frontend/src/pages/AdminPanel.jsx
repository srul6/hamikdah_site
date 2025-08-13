import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, TextField, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    homepageimage: '',
    extraimages: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      extraimages: formData.extraimages.split(',').map(img => img.trim()).filter(img => img)
    };

    try {
      const url = editingProduct
        ? `http://localhost:5001/api/products/${editingProduct.id}`
        : 'http://localhost:5001/api/products';

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
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      homepageimage: product.homepageimage || '',
      extraimages: product.extraimages ? product.extraimages.join(', ') : ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/products/${productId}`, {
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
      name: '',
      description: '',
      price: '',
      homepageimage: '',
      extraimages: ''
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 600, color: '#1d1d1f' }}>
          Admin Panel
        </Typography>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {product.name}
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
                  {product.description}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0071e3' }}>
                  ₪{product.price}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {product.id}
                </Typography>
                {product.homepageimage && (
                  <Typography variant="caption" display="block" sx={{ mt: 1, wordBreak: 'break-all' }}>
                    Homepage: {product.homepageimage}
                  </Typography>
                )}
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
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
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