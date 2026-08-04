import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({ baseURL: BASE })

// Attach token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('access_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-refresh on 401
api.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/auth/refresh`, { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password, role: 'admin' }),
  me: () => api.get('/users/me'),
}

export const softwareApi = {
  list: (params) => api.get('/software/', { params }),
  get: (id) => api.get(`/software/${id}`),
  create: (data) => api.post('/software/', data),
  update: (id, data) => api.patch(`/software/${id}`, data),
  delete: (id) => api.delete(`/software/${id}`),
  dashboard: () => api.get('/software/dashboard'),
  renew: (id, data) => api.post(`/software/${id}/renew`, data),
  upcoming: (days = 90) => api.get('/software/renewals/upcoming', { params: { days } }),
}

export default api
