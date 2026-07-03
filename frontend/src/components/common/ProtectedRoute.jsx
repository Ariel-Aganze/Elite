import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, requiredPermission, fallbackPath = '/app/dashboard' }) => {
  const { user, hasPermission, hasAnyPermission } = useAuth()

  // Check if user is authenticated
  if (!user) {
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