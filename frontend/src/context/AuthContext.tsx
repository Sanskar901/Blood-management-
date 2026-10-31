import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isSuperAdmin: boolean;
  isHospitalStaff: boolean;
  isRequester: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('bloodconnect_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const currentUser = await api.getMe();
          setUser(currentUser);
        } catch {
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('bloodconnect_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bloodconnect_token');
    setToken(null);
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isHospitalStaff = user?.role === 'HOSPITAL_STAFF';
  const isRequester = user?.role === 'PUBLIC_REQUESTER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isSuperAdmin,
        isHospitalStaff,
        isRequester,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
