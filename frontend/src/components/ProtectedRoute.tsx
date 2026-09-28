import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthContext();

  // 1. If not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. If roles are specified, check if user has permission
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // Redirect to a generic "unauthorized" page or dashboard
    return <Navigate to="/" replace />;
  }

  // 3. If everything is fine, render the child routes
  return <Outlet />;
};