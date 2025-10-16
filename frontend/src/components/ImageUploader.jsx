import React, { useState, useRef } from 'react';
import { Box, Typography, IconButton, CircularProgress, Alert, Chip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import { API_ENDPOINTS } from '../config';

export default function ImageUploader({
    label,
    value,
    onChange,
    helperText,
    folder = 'products',
    multiple = false,
    acceptVideos = false
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    // Parse existing URLs - handle both strings (comma-separated) and arrays
    const existingUrls = value ?
        (Array.isArray(value) ? value : value.split(',').map(url => url.trim()).filter(Boolean))
        : [];

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = async (files) => {
        if (files.length === 0) return;

        // Filter image and/or video files based on acceptVideos prop
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (acceptVideos) {
                return isImage || isVideo;
            }
            return isImage;
        });

        if (validFiles.length === 0) {
            setError(acceptVideos ? 'Please select image or video files only' : 'Please select image files only');
            return;
        }

        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            if (multiple) {
                // Upload multiple images/videos
                const formData = new FormData();
                validFiles.forEach(file => {
                    formData.append('images', file);
                });
                formData.append('folder', folder);

                const response = await fetch(`${API_ENDPOINTS.upload}/images`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    const newUrls = data.images.map(img => img.url);
                    // APPEND to existing URLs instead of replacing
                    const allUrls = [...existingUrls, ...newUrls];
                    onChange(allUrls.join(', '));
                } else {
                    setError(data.error || 'Upload failed');
                }
            } else {
                // Upload single image/video
                const formData = new FormData();
                formData.append('image', validFiles[0]);
                formData.append('folder', folder);

                const response = await fetch(`${API_ENDPOINTS.upload}/image`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    if (multiple) {
                        // For multiple mode, append even if single file uploaded
                        const allUrls = [...existingUrls, data.url];
                        onChange(allUrls.join(', '));
                    } else {
                        // For single mode, replace
                        onChange(data.url);
                    }
                } else {
                    setError(data.error || 'Upload failed');
                }
            }

            setUploadProgress(100);
        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload image. Please try again.');
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const handleDeleteImage = (urlToDelete) => {
        if (multiple) {
            // Remove specific URL from the list
            const updatedUrls = existingUrls.filter(url => url !== urlToDelete);
            onChange(updatedUrls.join(', '));
        } else {
            // Clear single image
            onChange('');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    // Helper function to check if URL is a video
    const isVideoUrl = (url) => {
        const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
        return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    };

    return (
        <Box sx={{ width: '100%' }}>
            {label && (
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                    {label}
                </Typography>
            )}

            {/* Existing Images/Videos Display (for multiple mode) */}
            {multiple && existingUrls.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>
                        Uploaded {acceptVideos ? 'Images/Videos' : 'Images'} ({existingUrls.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {existingUrls.map((url, index) => (
                            <Box
                                key={index}
                                sx={{
                                    position: 'relative',
                                    width: '120px',
                                    height: '120px',
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    '&:hover .delete-btn': {
                                        opacity: 1
                                    }
                                }}
                            >
                                {isVideoUrl(url) ? (
                                    <Box
                                        component="video"
                                        src={url}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            backgroundColor: '#000'
                                        }}
                                    />
                                ) : (
                                    <Box
                                        component="img"
                                        src={url}
                                        alt={`Image ${index + 1}`}
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                )}
                                <IconButton
                                    className="delete-btn"
                                    size="small"
                                    onClick={() => handleDeleteImage(url)}
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                            color: 'error.main'
                                        }
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                <Chip
                                    label={index + 1}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        bottom: 4,
                                        left: 4,
                                        backgroundColor: 'rgba(229, 90, 61, 0.9)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '0.7rem'
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Drop Zone */}
            <Box
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                sx={{
                    border: isDragging
                        ? '2px dashed rgba(229, 90, 61, 1)'
                        : '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragging
                        ? 'rgba(229, 90, 61, 0.05)'
                        : 'transparent',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                        borderColor: 'rgba(229, 90, 61, 0.5)',
                        backgroundColor: 'rgba(229, 90, 61, 0.02)'
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptVideos ? "image/*,video/*" : "image/*"}
                    multiple={multiple}
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />

                {isUploading ? (
                    <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress
                            size={40}
                            sx={{ color: 'rgba(229, 90, 61, 1)', mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Uploading... {uploadProgress}%
                        </Typography>
                    </Box>
                ) : !multiple && value ? (
                    // Single image mode with existing image
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ImageIcon sx={{ color: 'rgba(229, 90, 61, 1)' }} />
                                <Typography variant="body2" sx={{
                                    color: '#333',
                                    wordBreak: 'break-all',
                                    textAlign: 'left',
                                    flex: 1
                                }}>
                                    {value.split('/').pop().substring(0, 50)}
                                    {value.length > 50 && '...'}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteImage(value);
                                }}
                                sx={{ color: 'error.main' }}
                            >
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        {value.startsWith('http') && (
                            <Box
                                component="img"
                                src={value}
                                alt="Preview"
                                sx={{
                                    width: '100%',
                                    maxHeight: '150px',
                                    objectFit: 'contain',
                                    borderRadius: 1,
                                    mt: 1
                                }}
                            />
                        )}
                    </Box>
                ) : (
                    // Drop zone for new uploads
                    <>
                        <CloudUploadIcon
                            sx={{
                                fontSize: 48,
                                color: isDragging ? 'rgba(229, 90, 61, 1)' : '#999',
                                mb: 1
                            }}
                        />
                        <Typography variant="body1" sx={{ mb: 0.5, fontWeight: 500 }}>
                            {isDragging
                                ? 'Drop image here'
                                : multiple && existingUrls.length > 0
                                    ? 'Add more images'
                                    : 'Drag & drop image here'
                            }
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            or click to browse
                        </Typography>
                        {multiple && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                {existingUrls.length > 0
                                    ? 'Upload more images to add to the gallery'
                                    : 'You can upload multiple images'
                                }
                            </Typography>
                        )}
                    </>
                )}
            </Box>

            {helperText && !error && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#666' }}>
                    {helperText}
                </Typography>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
        </Box>
    );
}
