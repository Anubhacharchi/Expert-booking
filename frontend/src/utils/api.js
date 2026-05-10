import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject({ message, errors: error.response?.data?.errors, status: error.response?.status });
  }
);

// ─── Expert APIs ─────────────────────────────────────────────────────────────
export const expertAPI = {
  getAll: (params) => api.get('/experts', { params }),
  getById: (id) => api.get(`/experts/${id}`),
  getCategories: () => api.get('/experts/categories')
};

// ─── Booking APIs ─────────────────────────────────────────────────────────────
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getByEmail: (email, params) => api.get('/bookings', { params: { email, ...params } }),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status })
};

export default api;
