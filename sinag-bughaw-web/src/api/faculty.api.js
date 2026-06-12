import api from './client';

export const facultyApi = {
  byDepartment: (params = {}) =>
    api.get('/faculty/by-department', { params }),
};
