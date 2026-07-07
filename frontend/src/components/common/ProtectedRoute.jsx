import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, requiredPermission, fallbackPath = '/app/dashboard' }) => {
  const { user, loading, isAuthenticated, hasPermission, hasAnyPermission } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // If no permission required, allow access
  if (!requiredPermission) {
    return children
  }

  // Check if user has the required permission
  const hasAccess = Array.isArray(requiredPermission) 
    ? hasAnyPermission(requiredPermission)
    : hasPermission(requiredPermission)

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />
  }

  return children
}

export default ProtectedRoute