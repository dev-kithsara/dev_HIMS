// frontend/src/components/Navbar.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  // 1. Get user data and logout function from our global Auth Context
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  // This legacy navbar is retained for older routes. MainLayout provides the
  // application-wide confirmation panel before sign-out.
  const handleLogout = () => logout();

  // 3. Render the Navbar UI
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left side: Logo and Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            {/* A simple placeholder logo using Tailwind */}
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded font-bold text-xl mr-3">
              K
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">KAIROS HIMS</span>
          </div>

          {/* Right side: User Info and Logout */}
          <div className="flex items-center gap-4">
            
            {/* Show user info only if user exists (Defensive programming) */}
            {user && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-0.5">
                  {user.role?.replace('_', ' ')}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-4 px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Logout
            </button>
            
          </div>
        </div>
      </div>
    </nav>
  );
};
