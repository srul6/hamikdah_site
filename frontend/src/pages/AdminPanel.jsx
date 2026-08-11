import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, TextField, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Alert, Paper,
  Tabs, Tab, MenuItem, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LockIcon from '@mui/icons-material/Lock';
import CommentIcon from '@mui/icons-material/Comment';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DownloadIcon from '@mui/icons-material/Download';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { API_ENDPOINTS } from '../config';
import CouponsTab from './CouponsTab';
import ImageUploader from '../components/ImageUploader';
import VideoUploader from '../components/VideoUploader';
import { fetchComments, createComment, updateComment, deleteComment } from '../api/comments';
import { fetchOrders, deleteOrder } from '../api/orders';
import { setCookie, getCookie, deleteCookie } from '../utils/cookieManager';
import * as XLSX from 'xlsx';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [lockUntil, setLockUntil] = useState(null);
  const [lockCountdown, setLockCountdown] = useState('');
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [comments, setComments] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderPage, setOrderPage] = useState(0);
  const [orderRowsPerPage, setOrderRowsPerPage] = useState(10);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
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
    height: '',
    length: '',
    width: '',
    recommendedAge: '',
    children_playing: [],
    desktop_hero_images: [],
    colors: []
  });

  const [commentFormData, setCommentFormData] = useState({
    name_he: '',
    name_en: '',
    text_he: '',
    text_en: '',
    type: 'text', // 'text', 'video', or 'image'
    videoUrl: '',
    imageUrl: '',
    rating: 5
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    checkSession();
  }, []);

  // Live countdown while account is locked
  useEffect(() => {
    if (!lockUntil) {
      setLockCountdown('');
      return;
    }
    const update = () => {
      const end = new Date(lockUntil).getTime();
      const now = Date.now();
      const ms = Math.max(0, end - now);
      if (ms <= 0) {
        setLockUntil(null);
        setLockCountdown('');
        return;
      }
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      setLockCountdown(min > 0 ? `${min} min ${sec} sec` : `${sec} sec`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [lockUntil]);

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.admin}/check-session`, {
        credentials: 'include' // Send HttpOnly cookies
      });
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchCommentsData();
      fetchOrdersData();
    }
  }, [isAuthenticated]);

  // Check session validity every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionValidity = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.admin}/check-session`, {
          credentials: 'include'
        });
        const data = await response.json();

        if (!data.authenticated) {
          // Session expired or invalid
          setIsAuthenticated(false);
          alert('הפעלה פגה תוקף. אנא התחבר שוב.');
        }
      } catch (error) {
        console.error('Session validation failed:', error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSessionValidity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchCommentsData = async () => {
    try {
      const commentsData = await fetchComments();
      setComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchOrdersData = async () => {
    try {
      const ordersData = await fetchOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      console.error('   Error message:', error.message);
      setOrders([]); // Set empty array on error
    }
  };

  const handleToggleShipped = async (orderId, currentShippedStatus) => {
    try {
      const newShippedStatus = !currentShippedStatus;

      const response = await fetch(`${API_ENDPOINTS.orders}/${orderId}/shipped`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isShipped: newShippedStatus })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, is_shipped: newShippedStatus }
              : order
          )
        );
      } else {
        alert('Failed to update shipping status');
      }
    } catch (error) {
      console.error('Error updating shipped status:', error);
      alert('Error updating shipping status');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_ENDPOINTS.admin}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Send and receive cookies
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setLoginError('');
        setLockUntil(null);
      } else {
        if (data.locked && data.lockedUntil) {
          setLockUntil(data.lockedUntil);
          if (data.remainingTime) setLockCountdown(data.remainingTime);
          setLoginError('');
        } else {
          setLockUntil(null);
          setLoginError(data.message || 'Invalid credentials');
        }
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Call server logout endpoint to clear HttpOnly cookie
      await fetch(`${API_ENDPOINTS.admin}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

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
      extraimages: Array.isArray(formData.extraimages) ? formData.extraimages : formData.extraimages.split(',').map(img => img.trim()).filter(img => img),
      buildingTime: formData.buildingTime ? parseInt(formData.buildingTime) : null,
      pieces: formData.pieces || null,
      height: formData.height || null,
      length: formData.length || null,
      width: formData.width || null,
      recommendedAge: formData.recommendedAge || null,
      children_playing: Array.isArray(formData.children_playing)
        ? formData.children_playing
        : formData.children_playing
          ? formData.children_playing.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      desktop_hero_images: Array.isArray(formData.desktop_hero_images)
        ? formData.desktop_hero_images
        : formData.desktop_hero_images
          ? formData.desktop_hero_images.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      colors: formData.colors || []
    };

    try {
      const url = editingProduct
        ? `${API_ENDPOINTS.products}/${editingProduct.id}`
        : API_ENDPOINTS.products;

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
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
      extraimages: Array.isArray(product.extraimages) ? product.extraimages : (product.extraimages || ''),
      buildingTime: product.buildingTime ? product.buildingTime.toString() : '',
      pieces: product.pieces || '',
      height: product.height || '',
      length: product.length || '',
      width: product.width || '',
      recommendedAge: product.recommendedAge || '',
      // API returns `childrenPlaying` / `desktopHeroImages`; older DB fields were `children_playing` / `desktop_hero_images`
      children_playing: normalizeMediaList(product.childrenPlaying ?? product.children_playing),
      desktop_hero_images: normalizeMediaList(product.desktopHeroImages ?? product.desktop_hero_images),
      colors: product.colors || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${API_ENDPOINTS.products}/${productId}`, {
          method: 'DELETE',
          credentials: 'include',
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
      height: '',
      length: '',
      width: '',
      recommendedAge: '',
      children_playing: [],
      desktop_hero_images: [],
      colors: []
    });
  };

  const normalizeMediaList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value !== 'string') return [];
    const s = value.trim();
    if (!s) return [];
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (_) {
        // ignore and fall back
      }
    }
    return s.split(',').map(x => x.trim()).filter(Boolean);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Color management functions
  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, {
        name_he: '',
        name_en: '',
        colorValues: [],
        mainImage: '',
        extraImages: []
      }]
    }));
  };

  const removeColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const updateColor = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) =>
        i === index ? { ...color, [field]: value } : color
      )
    }));
  };

  // Comment management functions
  const handleAddComment = () => {
    setEditingComment(null);
    setCommentFormData({
      name_he: '',
      name_en: '',
      text_he: '',
      text_en: '',
      type: 'text',
      videoUrl: '',
      rating: 5
    });
    setIsCommentDialogOpen(true);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setCommentFormData({
      name_he: comment.name_he || '',
      name_en: comment.name_en || '',
      text_he: comment.text_he || '',
      text_en: comment.text_en || '',
      type: comment.type || 'text',
      videoUrl: comment.video_url || comment.videoUrl || '', // Handle both field names
      imageUrl: comment.image_url || comment.imageUrl || '', // Handle both field names
      rating: comment.rating || 5
    });
    setIsCommentDialogOpen(true);
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId);
        fetchCommentsData();
        alert('Comment deleted successfully!');
      } catch (error) {
        alert('Error deleting comment');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convert camelCase to snake_case for database
      const commentData = {
        name_he: commentFormData.name_he,
        name_en: commentFormData.name_en,
        text_he: commentFormData.text_he,
        text_en: commentFormData.text_en,
        type: commentFormData.type,
        video_url: commentFormData.videoUrl, // Convert to snake_case
        image_url: commentFormData.imageUrl, // Convert to snake_case
        rating: commentFormData.rating
      };

      if (editingComment) {
        await updateComment(editingComment.id, commentData);
        alert('Comment updated successfully!');
      } else {
        await createComment(commentData);
        alert('Comment created successfully!');
      }

      setIsCommentDialogOpen(false);
      setEditingComment(null);
      fetchCommentsData();
    } catch (error) {
      alert('Error saving comment');
    }
  };

  const resetCommentForm = () => {
    setCommentFormData({
      name_he: '',
      name_en: '',
      text_he: '',
      text_en: '',
      type: 'text',
      videoUrl: '',
      imageUrl: '',
      rating: 5
    });
  };

  const handleExportToExcel = () => {
    try {
      // Filter only completed orders
      const completedOrders = orders.filter(order => order.status === 'completed');

      if (completedOrders.length === 0) {
        alert('אין הזמנות שהושלמו לייצוא');
        return;
      }

      // Prepare data for Excel - only specific fields
      const exportData = completedOrders.map(order => {
        // Get items details (without prices)
        const itemsText = Array.isArray(order.items)
          ? order.items.map(item =>
            `${item.name_he || item.name_en} (כמות: ${item.quantity || 1})`
          ).join('; ')
          : 'אין פריטים';

        // Format full address
        const fullAddress = `${order.customer_street || ''} ${order.customer_house_number || ''}${order.customer_apartment_number ? `, דירה ${order.customer_apartment_number}` : ''
          }${order.customer_floor ? `, קומה ${order.customer_floor}` : ''}, ${order.customer_city || ''}, ${order.customer_country || ''}`.trim();

        return {
          'שם לקוח': order.customer_name,
          'אימייל': order.customer_email,
          'טלפון': order.customer_phone || 'לא זמין',
          'כתובת מלאה': fullAddress,
          'פריטים': itemsText,
          'סכום': `₪${order.amount}`
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for the 6 columns
      ws['!cols'] = [
        { wch: 20 },  // שם לקוח
        { wch: 30 },  // אימייל
        { wch: 15 },  // טלפון
        { wch: 50 },  // כתובת מלאה
        { wch: 60 },  // פריטים
        { wch: 12 }   // סכום
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'הזמנות');

      // Generate filename with current date
      const filename = `completed_orders_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      alert(`${completedOrders.length} הזמנות שהושלמו יוצאו בהצלחה!`);
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error);
      alert('שגיאה בייצוא לאקסל. אנא נסה שוב.');
    }
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

            {lockUntil && (
              <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Account locked
                </Typography>
                <Typography variant="body2">
                  {lockCountdown
                    ? `Try again in: ${lockCountdown}`
                    : 'Checking…'}
                </Typography>
              </Alert>
            )}

            {loginError && !lockUntil && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {loginError}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!!lockUntil}
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
          {activeTab === 0 && (
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
          )}
          {activeTab === 1 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddComment}
              sx={{
                backgroundColor: '#0071e3',
                '&:hover': { backgroundColor: '#0077ed' }
              }}
            >
              Add Comment
            </Button>
          )}
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

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                color: '#667eea',
                transition: 'all 0.3s'
              }
            }
          }}
        >
          <Tab
            icon={<InventoryIcon />}
            label="Products"
            iconPosition="start"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px 8px 0 0',
              mx: 0.5
            }}
          />
          <Tab
            icon={<CommentIcon />}
            label="Comments"
            iconPosition="start"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px 8px 0 0',
              mx: 0.5
            }}
          />
          <Tab
            icon={<ShoppingBagIcon />}
            label="Orders"
            iconPosition="start"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px 8px 0 0',
              mx: 0.5
            }}
          />
          <Tab
            icon={<LocalOfferIcon />}
            label="Coupons"
            iconPosition="start"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px 8px 0 0',
              mx: 0.5
            }}
          />
        </Tabs>
      </Box>

      {/* Products Tab */}
      {activeTab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Products Management
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} md={6} lg={4} key={product.id}>
                <Card sx={{
                  height: '100%',
                  maxHeight: '450px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    {/* Product Image */}
                    {product.homepageimage && (
                      <Box sx={{
                        mb: 2,
                        textAlign: 'center',
                        height: '200px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        <img
                          src={product.homepageimage}
                          alt={product.name_he || product.name_en}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }}
                        />
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {product.name_he || product.name_en}
                        </Typography>
                        {product.colors && product.colors.length > 0 && (
                          <Typography variant="caption" sx={{ color: '#0071e3', fontWeight: 500 }}>
                            {product.colors.length} color{product.colors.length > 1 ? 's' : ''} available
                          </Typography>
                        )}
                      </Box>
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
        </>
      )}

      {/* Comments Tab */}
      {activeTab === 1 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Comments Management
            </Typography>
            <Chip
              label={`${comments.length} תגובות`}
              color="primary"
              sx={{ fontWeight: 600, fontSize: '0.9rem', px: 2, py: 2.5 }}
            />
          </Box>

          {comments.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
              <Typography variant="h6" color="text.secondary">
                אין תגובות עדיין. תגובות יופיעו כאן לאחר הוספתן.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ direction: 'rtl' }}>
              {comments.map((comment, index) => (
                <Paper
                  key={comment.id}
                  sx={{
                    mb: 2,
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: '#667eea'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  <Grid container spacing={3} alignItems="center">
                    {/* Comment Type */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        סוג
                      </Typography>
                      <Chip
                        label={
                          comment.type === 'video' ? 'וידאו' :
                            comment.type === 'image' ? 'תמונה' :
                              'טקסט'
                        }
                        color={comment.type === 'text' ? 'default' : 'primary'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>

                    {/* Customer Name */}
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        שם לקוח
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {comment.name_he || comment.name_en}
                      </Typography>
                    </Grid>

                    {/* Preview/Content */}
                    <Grid item xs={12} sm={5}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        תוכן
                      </Typography>
                      {comment.type === 'text' ? (
                        <Typography variant="body2" sx={{
                          color: 'text.secondary',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          "{comment.text_he || comment.text_en}"
                        </Typography>
                      ) : comment.type === 'video' ? (
                        <Typography variant="body2" color="text.secondary">
                          📹 {(comment.video_url || comment.videoUrl)?.split('/').pop() || 'אין וידאו'}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          🖼️ {(comment.image_url || comment.imageUrl)?.split('/').pop() || 'אין תמונה'}
                        </Typography>
                      )}
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} sm={2}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditComment(comment)}
                          sx={{
                            fontSize: '0.75rem',
                            px: 1.5,
                            py: 0.5
                          }}
                        >
                          ערוך
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 2 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Orders Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {orders.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportToExcel}
                  sx={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#218838'
                    }
                  }}
                >
                  ייצא לאקסל
                </Button>
              )}
              <Chip
                label={`${orders.length} הזמנות`}
                color="primary"
                sx={{ fontWeight: 600, fontSize: '0.9rem', px: 2, py: 2.5 }}
              />
            </Box>
          </Box>

          {orders.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
              <Typography variant="h6" color="text.secondary">
                No orders yet. Orders will appear here after successful payments.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{
              boxShadow: 2,
              borderRadius: 2,
              overflow: 'auto',
              direction: 'rtl',
              maxWidth: '100%',
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#555',
                }
              }
            }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#667eea' }}>
                    <TableCell align="right" sx={{
                      color: 'white',
                      fontWeight: 600,
                      backgroundColor: '#5568d3',
                      borderRight: '2px solid #4a5bc4'
                    }}>משלוח</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>ID</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>לקוח</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>אימייל</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>טלפון</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>כתובת</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>סכום</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>פריטים</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>תאריך</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>סטטוס</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>פעולות</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders
                    .slice(orderPage * orderRowsPerPage, orderPage * orderRowsPerPage + orderRowsPerPage)
                    .map((order) => (
                      <TableRow
                        key={order.id}
                        sx={{
                          backgroundColor: order.is_shipped ? 'rgba(0, 0, 0, 0.34)' : 'transparent',
                          '&:hover': {
                            backgroundColor: order.is_shipped ? '#d0d0d0' : '#f5f5f5'
                          },
                          '&:nth-of-type(even)': {
                            backgroundColor: order.is_shipped ? '#e0e0e0' : '#fafafa'
                          },
                          transition: 'background-color 0.3s ease'
                        }}
                      >
                        <TableCell align="right" sx={{
                          backgroundColor: order.is_shipped ? '#90caf9' : '#e3f2fd',
                          borderRight: '2px solid #90caf9',
                          '&:hover': {
                            backgroundColor: order.is_shipped ? '#a5d6a7' : '#bbdefb'
                          }
                        }}>
                          <Button
                            size="small"
                            variant={order.is_shipped ? 'contained' : 'outlined'}
                            color={order.is_shipped ? 'success' : 'primary'}
                            onClick={() => handleToggleShipped(order.id, order.is_shipped)}
                            sx={{
                              fontSize: '0.75rem',
                              px: 1.5,
                              py: 0.5,
                              fontWeight: 600,
                              minWidth: '100px'
                            }}
                          >
                            {order.is_shipped ? '✓ נשלח' : 'סמן כנשלח'}
                          </Button>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            #{order.id}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {order.customer_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {order.customer_email}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {order.customer_phone || 'לא זמין'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ maxWidth: 150, fontSize: '0.85rem' }}>
                            {order.customer_street} {order.customer_house_number}
                            {order.customer_city && `, ${order.customer_city}`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            ₪{order.amount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {Array.isArray(order.items) ? order.items.length : 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {order.purchase_timestamp
                              ? new Date(order.purchase_timestamp).toLocaleDateString('he-IL')
                              : new Date(order.created_at).toLocaleDateString('he-IL')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {order.purchase_timestamp
                              ? new Date(order.purchase_timestamp).toLocaleTimeString('he-IL')
                              : new Date(order.created_at).toLocaleTimeString('he-IL')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={order.status === 'completed' ? 'הושלם' : 'ממתין'}
                            color={order.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsOrderDialogOpen(true);
                              }}
                              sx={{
                                fontSize: '0.75rem',
                                px: 1.5,
                                py: 0.5
                              }}
                            >
                              פרטים
                            </Button>
                            <IconButton

                              size="small"
                              color="error"
                              onClick={async () => {
                                if (window.confirm('האם אתה בטוח שברצונך למחוק הזמנה זו?')) {
                                  try {
                                    await deleteOrder(order.id);
                                    fetchOrdersData();
                                    alert('ההזמנה נמחקה בהצלחה!');
                                  } catch (error) {
                                    alert('שגיאה במחיקת ההזמנה');
                                  }
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={orders.length}
                rowsPerPage={orderRowsPerPage}
                page={orderPage}
                onPageChange={(event, newPage) => setOrderPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setOrderRowsPerPage(parseInt(event.target.value, 10));
                  setOrderPage(0);
                }}
              />
            </TableContainer>
          )}
        </>
      )}

      {/* Coupons Tab */}
      {activeTab === 3 && <CouponsTab />}

      {/* Product Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{
          pb: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          px: 4,
          py: 3
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {editingProduct ? 'Update product information and settings' : 'Create a new product with all details'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{
            px: 4,
            py: 3,
            background: '#fafafa',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}>
            <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
              <Typography variant="body2">
                Drag & drop images directly into the upload areas or click to browse. Images will be automatically uploaded to cloud storage.
              </Typography>
            </Alert>

            {/* Basic Information Section */}
            <Box sx={{
              mb: 4,
              p: 3,
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <Typography variant="h5" sx={{
                fontWeight: 600,
                mb: 3,
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📝 Basic Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Product Name (Hebrew)"
                    value={formData.name_he}
                    onChange={(e) => handleInputChange('name_he', e.target.value)}
                    required
                    dir="rtl"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#fafafa',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'white',
                        }
                      }
                    }}
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
                {/* Show product images in Basic Information only when there are no color variations */}
                {(!formData.colors || formData.colors.length === 0) && (
                  <>
                    <Grid item xs={12}>
                      <ImageUploader
                        label="Homepage Image *"
                        value={formData.homepageimage}
                        onChange={(url) => handleInputChange('homepageimage', url)}
                        helperText="Main image shown on the product listing page (drag & drop or click to upload)"
                        folder="homepage"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <ImageUploader
                        label="Extra Images (Product Gallery)"
                        value={formData.extraimages}
                        onChange={(urls) => handleInputChange('extraimages', urls)}
                        helperText="Additional product images - drag & drop multiple images at once"
                        folder="gallery"
                        multiple={true}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>

            {/* Desktop Hero Images Section - only for product "המקדש" */}
            {formData.name_he && formData.name_he.trim() === 'המקדש' && (
              <Box sx={{
                mb: 4,
                p: 3,
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <Typography variant="h5" sx={{
                  fontWeight: 600,
                  mb: 3,
                  color: '#2c3e50',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  🖥️ Desktop Hero Images
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <ImageUploader
                      label="Desktop Hero Images (2 images)"
                      value={formData.desktop_hero_images}
                      onChange={(urls) => handleInputChange('desktop_hero_images', urls)}
                      helperText="Upload 2 images for the desktop hero section (left and right squares)"
                      folder="hero"
                      multiple={true}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Kids Playing Media — shown on all product pages when media is uploaded */}
            <Box sx={{
              mb: 4,
              p: 3,
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <Typography variant="h5" sx={{
                fontWeight: 600,
                mb: 1,
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                👶 Kids Playing / ילדים משחקים
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                Upload images or videos for the horizontal Kids Playing gallery on this product page.
                The progress bar fills as visitors scroll (RTL in Hebrew, LTR in English).
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <ImageUploader
                    label="Kids Playing Media"
                    value={formData.children_playing}
                    onChange={(urls) => handleInputChange('children_playing', urls)}
                    helperText="Multiple images and videos supported. Leave empty to hide the section."
                    folder="children"
                    multiple={true}
                    acceptVideos={true}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Color Variations Section */}
            <Box sx={{
              mb: 4,
              p: 3,
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <Typography variant="h5" sx={{
                fontWeight: 600,
                mb: 3,
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                🎨 Color Variations
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                      Product Colors
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add different color variations for this product. Each color can have its own main image and additional images.
                    </Typography>

                    {formData.colors && formData.colors.map((color, index) => (
                      <Card key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6">Color {index + 1}</Typography>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => removeColor(index)}
                          >
                            Remove Color
                          </Button>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Color Name (Hebrew)"
                              value={color.name_he || ''}
                              onChange={(e) => updateColor(index, 'name_he', e.target.value)}
                              dir="rtl"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Color Name (English)"
                              value={color.name_en || ''}
                              onChange={(e) => updateColor(index, 'name_en', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Color Values (comma-separated)"
                              value={color.colorValues ? color.colorValues.join(', ') : ''}
                              onChange={(e) => updateColor(index, 'colorValues', e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                              helperText="e.g., #ff0000, #00ff00 for multiple colors"
                              placeholder="#ff0000"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <ImageUploader
                              label="Main Image for this Color"
                              value={color.mainImage || ''}
                              onChange={(url) => updateColor(index, 'mainImage', url)}
                              helperText="Main image for this color variation"
                              folder="colors"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <ImageUploader
                              label="Additional Images for this Color"
                              value={color.extraImages || []}
                              onChange={(urls) => updateColor(index, 'extraImages', urls)}
                              helperText="Additional images for this color variation"
                              folder="colors"
                              multiple={true}
                            />
                          </Grid>
                        </Grid>
                      </Card>
                    ))}

                    <Button
                      variant="outlined"
                      onClick={addColor}
                      sx={{ mt: 1 }}
                    >
                      + Add Color Variation
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Product Features Section */}
            <Box sx={{
              mb: 4,
              p: 3,
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <Typography variant="h5" sx={{
                fontWeight: 600,
                mb: 3,
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                ⚙️ Product Features
              </Typography>
              <Grid container spacing={3}>
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
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Height (גובה)"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    placeholder="e.g., 30 cm"
                    helperText="Product height"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Length (אורך)"
                    value={formData.length}
                    onChange={(e) => handleInputChange('length', e.target.value)}
                    placeholder="e.g., 25 cm"
                    helperText="Product length"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Width (רוחב)"
                    value={formData.width}
                    onChange={(e) => handleInputChange('width', e.target.value)}
                    placeholder="e.g., 20 cm"
                    helperText="Product width"
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
            </Box>
          </DialogContent>
          <DialogActions sx={{
            px: 4,
            py: 3,
            backgroundColor: '#f8f9fa',
            borderRadius: '0 0 16px 16px',
            gap: 2
          }}>
            <Button
              onClick={() => setIsDialogOpen(false)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={isCommentDialogOpen}
        onClose={() => setIsCommentDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
            minHeight: '60vh'
          }
        }}
      >
        <DialogTitle sx={{
          pb: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          px: 4,
          py: 3
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            {editingComment ? 'Edit Comment' : 'Add New Comment'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {editingComment ? 'Update customer testimonial' : 'Create a new customer testimonial'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleCommentSubmit}>
          <DialogContent sx={{
            px: 4,
            py: 3,
            background: '#fafafa',
          }}>
            <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
              <Typography variant="body2">
                For video comments, upload videos to the "comments" folder in cloud storage and use the full URL.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name (Hebrew)"
                  value={commentFormData.name_he}
                  onChange={(e) => setCommentFormData(prev => ({ ...prev, name_he: e.target.value }))}
                  dir="rtl"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name (English)"
                  value={commentFormData.name_en}
                  onChange={(e) => setCommentFormData(prev => ({ ...prev, name_en: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Comment Type"
                  select
                  value={commentFormData.type}
                  onChange={(e) => setCommentFormData(prev => ({ ...prev, type: e.target.value }))}
                >
                  <MenuItem value="text">Text Comment</MenuItem>
                  <MenuItem value="video">Video Comment</MenuItem>
                  <MenuItem value="image">Image Comment</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rating"
                  type="number"
                  inputProps={{ min: 1, max: 5 }}
                  value={commentFormData.rating}
                  onChange={(e) => setCommentFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                />
              </Grid>

              {commentFormData.type === 'text' ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Comment Text (Hebrew)"
                      multiline
                      rows={4}
                      value={commentFormData.text_he}
                      onChange={(e) => setCommentFormData(prev => ({ ...prev, text_he: e.target.value }))}
                      dir="rtl"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Comment Text (English)"
                      multiline
                      rows={4}
                      value={commentFormData.text_en}
                      onChange={(e) => setCommentFormData(prev => ({ ...prev, text_en: e.target.value }))}
                    />
                  </Grid>
                </>
              ) : commentFormData.type === 'video' ? (
                <Grid item xs={12}>
                  <VideoUploader
                    label="Comment Video"
                    value={commentFormData.videoUrl}
                    onChange={(url) => setCommentFormData(prev => ({ ...prev, videoUrl: url }))}
                    helperText="Drag & drop a video file or click to browse. Video will be automatically uploaded to cloud storage."
                  />
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <ImageUploader
                    label="Comment Image"
                    value={commentFormData.imageUrl}
                    onChange={(url) => setCommentFormData(prev => ({ ...prev, imageUrl: url }))}
                    helperText="Drag & drop an image file or click to browse. Image will be automatically uploaded to cloud storage."
                    folder="comments"
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{
            px: 4,
            py: 3,
            backgroundColor: '#f8f9fa',
            borderRadius: '0 0 16px 16px',
            gap: 2
          }}>
            <Button
              onClick={() => setIsCommentDialogOpen(false)}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              {editingComment ? 'Update Comment' : 'Create Comment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog
        open={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{
          pb: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0',
          px: 4,
          py: 3
        }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Order Details
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Order #{selectedOrder?.id} - {selectedOrder?.status}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 4, py: 3, mt: 4 }}>
          {selectedOrder && (
            <Grid container spacing={3}>
              {/* Customer Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                  👤 Customer Information
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {selectedOrder.customer_name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {selectedOrder.customer_email}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Phone:</strong> {selectedOrder.customer_phone || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Address:</strong> {selectedOrder.customer_street} {selectedOrder.customer_house_number}
                    {selectedOrder.customer_apartment_number && `, Apt ${selectedOrder.customer_apartment_number}`}
                    {selectedOrder.customer_floor && `, Floor ${selectedOrder.customer_floor}`}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>City:</strong> {selectedOrder.customer_city}, {selectedOrder.customer_country}
                  </Typography>
                </Box>
              </Grid>

              {/* Order Information */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                  📦 Order Information
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Form ID:</strong> {selectedOrder.form_id}
                  </Typography>
                  {selectedOrder.document_id && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Document ID:</strong> {selectedOrder.document_id}
                    </Typography>
                  )}
                  {selectedOrder.payment_id && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Payment ID:</strong> {selectedOrder.payment_id}
                    </Typography>
                  )}
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Status:</strong> <Chip label={selectedOrder.status} size="small" color={selectedOrder.status === 'completed' ? 'success' : 'warning'} />
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Amount:</strong> {selectedOrder.amount} {selectedOrder.currency}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Order Date:</strong> {new Date(selectedOrder.created_at).toLocaleString('he-IL')}
                  </Typography>
                  {selectedOrder.dedication && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Dedication:</strong> {selectedOrder.dedication}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Items */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                  🛍️ Items Purchased
                </Typography>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <Box sx={{ pl: 2 }}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < selectedOrder.items.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {item.name_he || item.name_en || 'Unknown Product'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quantity: {item.quantity || 1} × {item.price} {selectedOrder.currency}
                        </Typography>
                        {item.id && (
                          <Typography variant="caption" color="text.secondary">
                            Product ID: {item.id}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                    No items information available
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 4, py: 3 }}>
          <Button
            onClick={() => setIsOrderDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 