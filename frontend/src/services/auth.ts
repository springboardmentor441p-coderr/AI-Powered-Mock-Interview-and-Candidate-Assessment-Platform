import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const LOCAL_USERS_KEY = 'mockInterviewUsers'

type RegisterPayload = {
  email: string
  username: string
  password: string
  highest_qualification: string
  role?: string
}

type LocalUser = {
  id: number
  email: string
  username: string
  password: string
  highest_qualification: string
  role: string
  created_at: string
}

function getLocalUsers(): LocalUser[] {
  const raw = localStorage.getItem(LOCAL_USERS_KEY)
  if (!raw) {
    return []
  }

  try {
    return JSON.parse(raw) as LocalUser[]
  } catch {
    return []
  }
}

function setLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

function buildError(message: string) {
  return { response: { data: { detail: message } } }
}

function shouldFallbackToLocal(err: any): boolean {
  const status = err?.response?.status
  return !status || status === 404 || status >= 500
}

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  register: async (payload: RegisterPayload) => {
    const users = getLocalUsers()
    const duplicateEmail = users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())
    if (duplicateEmail) {
      throw buildError('Email is already registered.')
    }

    const duplicateUsername = users.some(
      (user) => user.username.toLowerCase() === payload.username.toLowerCase(),
    )
    if (duplicateUsername) {
      throw buildError('Username is already taken. Please choose another one.')
    }

    try {
      const response = await apiClient.post('/auth/register', {
        email: payload.email,
        username: payload.username,
        password: payload.password,
        highest_qualification: payload.highest_qualification,
        role: payload.role ?? 'user',
      })

      const userToSave: LocalUser = {
        id: users.length + 1,
        email: payload.email,
        username: payload.username,
        password: payload.password,
        highest_qualification: payload.highest_qualification,
        role: payload.role ?? 'user',
        created_at: new Date().toISOString(),
      }
      setLocalUsers([...users, userToSave])
      return response
    } catch (err: any) {
      if (!shouldFallbackToLocal(err)) {
        throw err
      }

      const newUser: LocalUser = {
        id: users.length + 1,
        email: payload.email,
        username: payload.username,
        password: payload.password,
        highest_qualification: payload.highest_qualification,
        role: payload.role ?? 'user',
        created_at: new Date().toISOString(),
      }

      setLocalUsers([...users, newUser])

      return {
        data: {
          message: 'Registered locally (backend unavailable).',
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            highest_qualification: newUser.highest_qualification,
            role: newUser.role,
            created_at: newUser.created_at,
          },
        },
      }
    }
  },
  
  login: async (email: string, password: string) => {
    try {
      return await apiClient.post('/auth/login', { email, password })
    } catch (err: any) {
      if (!shouldFallbackToLocal(err)) {
        throw err
      }

      const users = getLocalUsers()
      const matchedUser = users.find(
        (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password,
      )

      if (!matchedUser) {
        throw buildError('Invalid email or password.')
      }

      return {
        data: {
          access_token: 'local-dev-token',
          token_type: 'bearer',
          user: {
            id: matchedUser.id,
            email: matchedUser.email,
            username: matchedUser.username,
            highest_qualification: matchedUser.highest_qualification,
            role: matchedUser.role,
            created_at: matchedUser.created_at,
          },
        },
      }
    }
  },
  
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  },
}

export default apiClient
