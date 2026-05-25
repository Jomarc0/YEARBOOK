// src/features/profile/hooks/useProfileUpload.js
//
// Handles all upload state for ProfileUploadModal.
// Now includes: tagged users, premium gate check.

import { useState, useRef } from 'react';
import { profileApi } from '@/api/gallery.api';

const MAX_FILE_MB    = 50;
const ALLOWED_TYPES  = [
  'image/jpeg','image/png','image/webp',
  'image/heic','image/gif','video/mp4','video/quicktime',
];

/**
 * useProfileUpload
 *
 * @param {Function} onSuccess  Called after successful upload
 * @param {string}   tierKey    'free' | 'premium_standard' | 'premium'
 */
export function useProfileUpload(onSuccess, tierKey = 'free') {
  const fileRef  = useRef(null);

  const [preview,    setPreview]    = useState(null);   // { url, name, file }
  const [caption,    setCaption]    = useState('');
  const [visibility, setVisibility] = useState('public');
  const [taggedUsers,setTaggedUsers]= useState([]);     // [{ id, name, profile_picture }]
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [error,      setError]      = useState(null);

  // ── Tier gate ──────────────────────────────────────────────────────────────
  // Free users cannot upload — only premium_standard and premium can
  const canUpload = tierKey === 'premium_standard' || tierKey === 'premium';

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported. Use JPEG, PNG, WebP, GIF, HEIC, MP4, or MOV.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File exceeds ${MAX_FILE_MB} MB limit.`);
      return;
    }

    setPreview({ url: URL.createObjectURL(file), name: file.name, file });
  };

  // ── Tag a user ─────────────────────────────────────────────────────────────
  const tagUser = (user) => {
    if (taggedUsers.find(u => u.id === user.id)) return; // already tagged
    setTaggedUsers(prev => [...prev, user]);
  };

  const untagUser = (userId) => {
    setTaggedUsers(prev => prev.filter(u => u.id !== userId));
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const upload = async () => {
    if (!preview || !canUpload) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const form = new FormData();
      form.append('file',       preview.file);
      form.append('caption',    caption);
      form.append('visibility', visibility);
      taggedUsers.forEach(u => form.append('tagged_user_ids[]', u.id));

      await profileApi.uploadMedia(form, setProgress);
      reset();
      onSuccess?.();

    } catch (err) {
      const msg = err.response?.data?.message ?? 'Upload failed. Please try again.';
      const code = err.response?.data?.code;

      if (code === 'STORAGE_LIMIT_EXCEEDED') {
        setError('Storage limit reached. Upgrade your plan for more space.');
      } else if (err.response?.status === 403) {
        setError('Upgrade to Premium to upload photos and videos.');
      } else {
        setError(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setCaption('');
    setVisibility('public');
    setTaggedUsers([]);
    setProgress(0);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return {
    fileRef,
    preview,
    caption,    setCaption,
    visibility, setVisibility,
    taggedUsers, tagUser, untagUser,
    uploading, progress, error,
    canUpload,
    handleFileChange,
    upload,
    reset,
  };
}