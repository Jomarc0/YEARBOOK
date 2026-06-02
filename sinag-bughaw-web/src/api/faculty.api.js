import axios from 'axios';

const api = axios.create({ baseURL: '/api' }); 

export const facultyApi = {
  byDepartment: (params = {}) =>
    api.get('/faculty/by-department', { params }),
};