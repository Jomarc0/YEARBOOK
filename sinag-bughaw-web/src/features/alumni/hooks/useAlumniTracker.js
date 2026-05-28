import { useState, useEffect, useCallback } from 'react';
import { alumniApi } from '@/api/alumni.api';

export function useAlumniProfile(alumniId) {
  const [alumni,  setAlumni]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!alumniId) return;
    setLoading(true); setError(null);
    try {
      const { data } = await alumniApi.show(alumniId);
      setAlumni(data?.data ?? data);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [alumniId]);

  useEffect(() => { load(); }, [load]);
  return { alumni, loading, error, reload: load };
}

export function useAlumniList(initialFilters = {}) {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [meta,    setMeta]    = useState({ total: 0, current_page: 1, last_page: 1 });
  const [filters, setFilters] = useState(initialFilters);

  const load = useCallback(async (params = {}) => {
    setLoading(true); setError(null);
    try {
      const { data } = await alumniApi.list({ ...filters, ...params });
      setList(data?.data ?? []);
      setMeta({ total: data?.total ?? 0, current_page: data?.current_page ?? 1, last_page: data?.last_page ?? 1 });
    } catch (e) {
      setError(e.response?.data?.message ?? 'Failed to load alumni.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const applyFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const clearFilters = () => setFilters(initialFilters);

  return { list, loading, error, meta, filters, applyFilter, clearFilters, reload: load };
}

export function useYearbookDeepLink(alumniId) {
  const [entry,   setEntry]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!alumniId) return;
    setLoading(true);
    alumniApi.yearbookEntry(alumniId)
      .then(({ data }) => setEntry(data?.data ?? data))
      .catch(() => setEntry(null))
      .finally(() => setLoading(false));
  }, [alumniId]);

  const yearbookUrl = entry
    ? `/yearbook/${entry.batch_id}/view?page=${entry.page_index ?? 0}`
    : null;

  return { entry, yearbookUrl, loading };
}