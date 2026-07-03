import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, setAuthToken } from '../api/client'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      try {
        setAuthToken(token)
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setAuthToken(null)
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login/', { username, password })
      const { access, refresh, user } = response.data
      
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      localStorage.setItem('user', JSON.stringify(user))
      
      setAuthToken(access)
      setUser(user)
      setIsAuthenticated(true)
      
      toast.success(`Bienvenue, ${user.username}!`)
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.error || 'Erreur de connexion'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setAuthToken(null)
    setUser(null)
    setIsAuthenticated(false)
    toast.success('Déconnexion réussie')
  }

  // Permission helper functions
  const hasPermission = (permission) => {
    if (!user) return false
    if (user.is_platform_admin || user.is_tenant_admin) return true
    return user.permissions?.includes(permission) || false
  }

  const hasAnyPermission = (permissions) => {
    if (!user) return false
    if (user.is_platform_admin || user.is_tenant_admin) return true
    if (!permissions || permissions.length === 0) return false
    return permissions.some(p => user.permissions?.includes(p))
  }

  const hasAllPermissions = (permissions) => {
    if (!user) return false
    if (user.is_platform_admin || user.is_tenant_admin) return true
    if (!permissions || permissions.length === 0) return true
    return permissions.every(p => user.permissions?.includes(p))
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}