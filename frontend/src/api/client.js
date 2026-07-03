import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
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

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }
        
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        
        const { access } = response.data
        localStorage.setItem('access_token', access)
        
        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
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

// API helper functions
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