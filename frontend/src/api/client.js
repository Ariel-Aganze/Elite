import axios from 'axios'
import toast from 'react-hot-toast'

// Get API URL from environment
// VITE_API_URL: http://localhost:8000/api or https://xxx.onrender.com/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Remove trailing slash if present and ensure /api is included
let baseURL = API_URL.replace(/\/+$/, '')

// If the URL doesn't end with /api, append it
if (!baseURL.endsWith('/api')) {
  baseURL = `${baseURL}/api`
}

export const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh and 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        const response = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        
        const { access } = response.data
        localStorage.setItem('access_token', access)
        
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear everything and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    // Handle other errors
    if (error.response?.status === 403) {
      toast.error('Vous n\'avez pas les permissions nécessaires')
    } else if (error.response?.status === 404) {
      toast.error('Ressource non trouvée')
    } else if (error.response?.status >= 500) {
      toast.error('Erreur serveur. Veuillez réessayer plus tard.')
    }
    
    return Promise.reject(error)
  }
)

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization']
}

// API helper functions - paths are relative to baseURL
export const authApi = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/auth/register/', data),
  refresh: (refresh) => api.post('/auth/refresh/', { refresh }),
}

export const tenantsApi = {
  list: (params) => api.get('/tenants/', { params }),
  detail: (id) => api.get(`/tenants/${id}/`),
  update: (id, data) => api.put(`/tenants/${id}/`, data),
  activate: (id, data) => api.post(`/tenants/${id}/activate/`, data),
  extend: (id, data) => api.post(`/tenants/${id}/extend/`, data),
  dashboard: () => api.get('/admin/dashboard/'),
}

export const usersApi = {
  list: (params) => api.get('/users/', { params }),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  permissions: () => api.get('/permissions/templates/'),
}