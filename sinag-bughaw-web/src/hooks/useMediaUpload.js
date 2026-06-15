// src/hooks/useMediaUpload.js

// Fixed from previous version:
// Signature changed from options-object to positional args
//    to match how GalleryPage.jsx calls it:
//    useMediaUpload(albumId, tier, onSuccess)
// mediaApi used for all API calls (consistent with gallery.api.js)
// Added `limits`, `queue`, `errors`, `clearQueue`, `upload`, `dragHandlers`
//    aliases in the return value so BulkUploadZone receives the exact prop
//    names it expects without any adapter code in GalleryPage.

import { useState, useCallback, useRef } from 'react';
import { mediaApi } from '../api/gallery.api';

const TIER_LIMITS = {
  free: {
    maxFiles:       5,
    maxFileSizeMB:  5,
    maxVideoSizeMB: 0,   // no video on free tier
    hdEnabled:      false,
    label:          'Free',
    storageGB:      0.5,
  },
  standard: {
    maxFiles:       20,
    maxFileSizeMB:  20,
    maxVideoSizeMB: 500,
    hdEnabled:      true,
    label:          'Standard',
    storageGB:      5,
  },
  // Legacy key kept for backward compat
  premium_standard: {
    maxFiles:       20,
    maxFileSizeMB:  20,
    maxVideoSizeMB: 500,
    hdEnabled:      true,
    label:          'Premium Standard',
    storageGB:      5,
  },
  premium: {
    maxFiles:       50,
    maxFileSizeMB:  50,
    maxVideoSizeMB: 2048,
    hdEnabled:      true,
    label:          'Premium HD',
    storageGB:      10,
  },
};

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

/**
 * useMediaUpload
 *
 * Called as: useMediaUpload(albumId, tierKey, onSuccess)
 * Matches GalleryPage.jsx usage exactly.
 *
 * @param {number|null} albumId    - Target album ID
 * @param {string}      tierKey   - 'free' | 'standard' | 'premium_standard' | 'premium'
 * @param {Function}    onSuccess - Called after successful upload
 */
export function useMediaUpload(albumId = null, tierKey = 'free', onSuccess = null) {
  const tier = TIER_LIMITS[tierKey] ?? TIER_LIMITS.free;

  const [files,      setFiles]      = useState([]);
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [results,    setResults]    = useState(null);
  const [error,      setError]      = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mode,       setMode]       = useState('bulk'); // kept for backward compatibility

  const inputRef = useRef(null);

  // Validation

  const validateFile = useCallback((file) => {
    const isPhoto = PHOTO_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    const sizeMB  = file.size / (1024 * 1024);

    if (!isPhoto && !isVideo) {
      return `${file.name}: Only JPEG, PNG, WebP, GIF, MP4, MOV, AVI, WebM accepted.`;
    }
    if (isVideo && tier.maxVideoSizeMB === 0) {
      return `${file.name}: Video uploads require a paid plan.`;
    }
    if (isPhoto && sizeMB > tier.maxFileSizeMB) {
      return `${file.name}: Exceeds ${tier.maxFileSizeMB} MB limit.`;
    }
    if (isVideo && sizeMB > tier.maxVideoSizeMB) {
      return `${file.name}: Exceeds ${tier.maxVideoSizeMB} MB video limit.`;
    }
    return null;
  }, [tier]);

  // Add files

  const addFiles = useCallback((newFiles) => {
    const arr = Array.from(newFiles);
    setError(null);

    if (files.length + arr.length > tier.maxFiles) {
      setError(`Your ${tier.label} plan allows up to ${tier.maxFiles} files per upload.`);
      return;
    }

    const mapped = arr.map((file) => ({
      id:      `${file.name}-${file.size}-${Date.now()}`,
      file,
      type:    file.type.startsWith('video/') ? 'video' : 'image',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status:  validateFile(file) ? 'error' : 'pending',
      error:   validateFile(file),
    }));

    setFiles((prev) => [...prev, ...mapped]);
  }, [files.length, tier, validateFile]);

  const removeFile = useCallback((id) => {
    setFiles((prev) => {
      const t = prev.find((f) => f.id === id);
      if (t?.preview) URL.revokeObjectURL(t.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFiles([]);
    setProgress(0);
    setResults(null);
    setError(null);
  }, [files]);

  // Submit

  const submit = useCallback(async (options = {}) => {
    const caption = typeof options === 'string' ? options : (options.caption ?? '');
    const visibility = typeof options === 'object' ? (options.visibility ?? 'public') : 'public';
    const valid = files.filter((f) => f.status !== 'error');
    if (!valid.length || !albumId) {
      setError(!albumId ? 'No album selected.' : 'No valid files to upload.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const imageFiles = valid.filter((f) => f.type === 'image').map((f) => f.file);
      const videoFiles = valid.filter((f) => f.type === 'video').map((f) => f.file);
      const responses = [];
      const totalSteps = (imageFiles.length ? 1 : 0) + videoFiles.length;
      let completedSteps = 0;
      const stepProgress = (innerProgress = 0) => {
        if (!totalSteps) return;
        setProgress(Math.min(99, Math.round(((completedSteps + innerProgress / 100) / totalSteps) * 100)));
      };

      if (imageFiles.length) {
        responses.push(await mediaApi.bulkUpload(albumId, imageFiles, stepProgress, visibility, caption));
        completedSteps += 1;
        stepProgress(0);
      }

      for (const file of videoFiles) {
        responses.push(await mediaApi.uploadVideo(albumId, file, caption, stepProgress, visibility));
        completedSteps += 1;
        stepProgress(0);
      }

      const data = responses.map((response) => response.data?.data ?? response.data);
      setResults(data);
      setProgress(100);
      clearFiles();
      onSuccess?.(data);

    } catch (err) {
      setError(err.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [files, albumId, clearFiles, onSuccess]);

  // Delete

  const remove = useCallback(async (photoId) => {
    try {
      await mediaApi.deletePhoto(photoId);
      return true;
    } catch (err) {
      setError(err.response?.data?.message ?? 'Delete failed.');
      return false;
    }
  }, []);

  // Drag and drop

  const dragProps = {
    onDragOver:  (e) => { e.preventDefault(); setIsDragging(true); },
    onDragLeave: (e) => { e.preventDefault(); setIsDragging(false); },
    onDrop:      (e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); },
  };

  const openFilePicker = () => inputRef.current?.click();

  const inputProps = {
    ref:      inputRef,
    type:     'file',
    multiple: true,
    accept:   [...PHOTO_TYPES, ...VIDEO_TYPES].join(','),
    style:    { display: 'none' },
    onChange: (e) => addFiles(e.target.files),
  };

  // BulkUploadZone-compatible shape

  // BulkUploadZone expects:
  //   queue, uploading, progress, errors, isDragging,
  //   limits { videoAllowed, maxFiles, maxPhotoMB, maxVideoMB },
  //   addFiles, removeFile, clearQueue, upload, dragHandlers

  // We build these as aliases so GalleryPage can keep doing {...uploadHook}.

  const limits = {
    videoAllowed: tier.maxVideoSizeMB > 0,
    maxFiles:     tier.maxFiles,
    maxPhotoMB:   tier.maxFileSizeMB,
    maxVideoMB:   tier.maxVideoSizeMB,
  };

  return {
    // canonical names (internal / advanced usage)
    files,
    addFiles,
    removeFile,
    clearFiles,
    submit,
    remove,
    uploading,
    progress,
    results,
    error,
    mode,
    setMode,
    isDragging,
    dragProps,
    inputProps,
    openFilePicker,
    pendingCount:  files.filter((f) => f.status !== 'error').length,
    hasFiles:      files.length > 0,
    canSubmit:     files.filter((f) => f.status !== 'error').length > 0 && !uploading && !!albumId,
    limitReached:  mode === 'bulk' && files.length >= tier.maxFiles,
    tier,
    tierKey,

    // BulkUploadZone aliases
    queue:        files,           // BulkUploadZone prop: queue
    errors:       error ? [error] : [],  // BulkUploadZone prop: errors (array)
    clearQueue:   clearFiles,      // BulkUploadZone prop: clearQueue
    upload:       submit,          // BulkUploadZone prop: upload
    dragHandlers: dragProps,       // BulkUploadZone prop: dragHandlers
    limits,                        // BulkUploadZone prop: limits
  };
}
