import React, { useState, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, IconButton } from '@mui/material';
import { CloudUpload as CloudUploadIcon, PlayArrow as PlayArrowIcon, Close as CloseIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { API_ENDPOINTS } from '../config';

export default function VideoUploader({ label, value, onChange, helperText }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const handleUpload = useCallback(async (file) => {
        setUploading(true);
        setError('');

        try {
            const contentType = file.type || 'video/mp4';
            const presignRes = await fetch(`${API_ENDPOINTS.upload}/presign`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType,
                    contentLength: file.size
                })
            });
            const presignData = await presignRes.json();
            if (!presignData.success) {
                const msg = presignData.error || presignData.message || 'Failed to get upload URL';
                throw new Error(msg);
            }

            const putRes = await fetch(presignData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': contentType }
            });
            if (!putRes.ok) throw new Error(`Upload failed: ${putRes.status}`);

            fetch(`${API_ENDPOINTS.upload}/confirm`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: presignData.key, size: file.size, mimeType: contentType })
            }).catch(() => { /* optional metadata recording */ });

            onChange(presignData.publicUrl);
            setPreviewUrl(presignData.publicUrl);
        } catch (err) {
            setError(err.message || 'Network error or server unreachable.');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    }, [onChange]);

    const onDrop = useCallback((acceptedFiles) => {
        const videoFiles = acceptedFiles.filter(file =>
            file.type.startsWith('video/') ||
            file.type === 'application/octet-stream' // Sometimes videos have this type
        );

        if (videoFiles.length > 0) {
            handleUpload(videoFiles[0]);
        } else {
            setError('Only video files are allowed.');
        }
    }, [handleUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv']
        }
    });

    const handleDelete = useCallback(() => {
        onChange('');
        setPreviewUrl('');
    }, [onChange]);

    // Update preview URL when value changes
    React.useEffect(() => {
        if (value) {
            setPreviewUrl(value);
        } else {
            setPreviewUrl('');
        }
    }, [value]);

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>{label}</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {previewUrl && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '400px',
                        height: '200px',
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        overflow: 'hidden',
                        backgroundColor: '#000'
                    }}>
                        <video
                            src={previewUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            controls
                        />
                        <IconButton
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                            }}
                            onClick={handleDelete}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Video uploaded successfully
                    </Typography>
                </Box>
            )}

            <Box
                {...getRootProps()}
                sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? '#e0e0e0' : '#f9f9f9',
                    transition: 'background-color 0.3s',
                    '&:hover': { backgroundColor: '#e0e0e0' }
                }}
            >
                <input {...getInputProps()} />
                {uploading ? (
                    <CircularProgress size={24} />
                ) : (
                    <CloudUploadIcon sx={{ fontSize: 40, color: '#888', mb: 1 }} />
                )}
                <Typography variant="body2" color="text.secondary">
                    {isDragActive ? 'Drop the video here...' : 'Drag & drop a video here, or click to browse'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Supports MP4, MOV, AVI, WebM, MKV formats
                </Typography>
                {helperText && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{helperText}</Typography>}
            </Box>
        </Box>
    );
}
