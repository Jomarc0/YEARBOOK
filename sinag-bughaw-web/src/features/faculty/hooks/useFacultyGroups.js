import { useState, useEffect, useCallback, useRef } from 'react';
import { facultyApi } from '@/api/faculty.api';

export function useFacultyGroups() {
  const [groups,        setGroups]        = useState([]);
  const [activeDeptId,  setActiveDeptId]  = useState(null); // null = all
  const [search,        setSearch]        = useState('');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const debounceRef = useRef(null);

  const fetch = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await facultyApi.byDepartment(q ? { search: q } : {});
      setGroups(data.data ?? []);
    } catch {
      setError('Unable to load faculty. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = (val) => {
    setSearch(val);
    setActiveDeptId(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetch(val), 320);
  };

  const handleDeptTab = (id) => {
    setActiveDeptId(id);
    setSearch('');
    fetch();
  };

  const clearSearch = () => {
    setSearch('');
    setActiveDeptId(null);
    fetch();
  };

  // Client-side department filter (tabs)
  const visibleGroups = activeDeptId
    ? groups.filter(g => g.id === activeDeptId)
    : groups;

  const totalFaculty   = groups.reduce((n, g) => n + g.faculty.length, 0);
  const totalDepts     = groups.length;

  return {
    groups,
    visibleGroups,
    activeDeptId,
    search,
    loading,
    error,
    totalFaculty,
    totalDepts,
    handleSearch,
    handleDeptTab,
    clearSearch,
  };
}