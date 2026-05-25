import { useCallback, useEffect, useState } from 'react';
import { studentsApi } from '@/api/student.api';

export function useProfile(id = null) {
  const [profile,      setProfile]      = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [taggedPhotos, setTaggedPhotos] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  const fetchProfile = useCallback(async (profileId) => {
    if (!profileId) return;
    try {
      setLoading(true);
      const { data } = await studentsApi.show(profileId);
      setProfile(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAchievements = useCallback(async (profileId) => {
    if (!profileId) return;
    try {
      const { data } = await studentsApi.getAchievements(profileId);
      setAchievements(data);
    } catch (err) {
      setError(err);
    }
  }, []);

  const fetchTaggedPhotos = useCallback(async (profileId) => {
    if (!profileId) return;
    try {
      const { data } = await studentsApi.getTaggedPhotos(profileId);
      setTaggedPhotos(data);
    } catch (err) {
      setError(err);
    }
  }, []);

  const updateBio = useCallback(async (bio) => {
    const { data } = await studentsApi.updateBio(bio);
    setProfile(prev => ({ ...prev, bio: data.bio }));
    return data;
  }, []);

  const updatePhoto = useCallback(async (formData) => {
    const { data } = await studentsApi.updatePhoto(formData);
    setProfile(prev => ({ ...prev, profile_picture: data.profile_picture }));
    return data;
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchProfile(id);
    fetchAchievements(id);
    fetchTaggedPhotos(id);
  }, [id, fetchProfile, fetchAchievements, fetchTaggedPhotos]);

  return {
    profile,
    achievements,
    taggedPhotos,
    loading,
    error,
    updateBio,
    updatePhoto,
    fetchProfile,
  };
}