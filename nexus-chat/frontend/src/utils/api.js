import axios from 'axios'

const BACKEND_URL = 'https://nexus-chat-production-527c.up.railway.app'

const api = axios.create({ baseURL: `${BACKEND_URL}/api` })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('nexus_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexus_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api