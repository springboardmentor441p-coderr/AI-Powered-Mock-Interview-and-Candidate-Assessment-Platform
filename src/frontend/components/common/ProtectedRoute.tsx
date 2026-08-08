import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bot, Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Bot className="h-7 w-7" />
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          <span>Authenticating candidate session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to /login, saving the attempted location in state if desired
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
