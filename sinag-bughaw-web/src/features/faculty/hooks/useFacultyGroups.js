import { useState, useEffect, useCallback, useRef } from 'react';
import { facultyApi } from '@/api/faculty.api';

function facultyGroupsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export function useFacultyGroups() {
  const [groups,       setGroups]       = useState([]);
  const [activeDeptId, setActiveDeptId] = useState(null); // null = all
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const debounceRef = useRef(null);

  const loadGroups = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await facultyApi.byDepartment(q ? { search: q } : {});
      setGroups(facultyGroupsFromPayload(data));
    } catch {
      setError('Unable to load faculty. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleSearch = (val) => {
    setSearch(val);
    setActiveDeptId(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadGroups(val), 320);
  };

  const handleDeptTab = (id) => {
    setActiveDeptId(id);
    setSearch('');
    loadGroups();
  };

  const clearSearch = () => {
    setSearch('');
    setActiveDeptId(null);
    loadGroups();
  };

  // Client-side department filter (tabs)
  const visibleGroups = activeDeptId
    ? groups.filter(g => g.id === activeDeptId)
    : groups;

  // Use faculty_count from the server; fall back to array length
  const totalFaculty = groups.reduce(
    (n, g) => n + (g.faculty_count ?? g.faculty?.length ?? 0),
    0
  );
  const totalDepts = groups.length;

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
