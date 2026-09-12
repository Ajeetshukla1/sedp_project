import { type ReactElement } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute(): ReactElement {
  const location = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="page-loading">Loading session...</div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
