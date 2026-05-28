import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

/**
 * Fetch all active faculty grouped by department.
 * Optionally pass { search: 'keyword' } to filter server-side.
 */
export const facultyApi = {
  byDepartment: (params = {}) =>
    api.get('/faculty/by-department', { params }),
};