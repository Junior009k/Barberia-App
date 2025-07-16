import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, registerClient as apiRegisterClient } from '../services/apiService';
import { AuthContextType, AuthProviderProps, CurrentUser, Role } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initialAuthChecked, setInitialAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    try {
      // Prioritize localStorage (Remember Me) over sessionStorage
      const rememberedUser = localStorage.getItem('barberapp_user');
      const sessionUser = sessionStorage.getItem('barberapp_user');
      
      if (rememberedUser) {
        setCurrentUser(JSON.parse(rememberedUser));
      } else if (sessionUser) {
        setCurrentUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error("Failed to parse user from storage", error);
      sessionStorage.removeItem('barberapp_user');
      localStorage.removeItem('barberapp_user');
      localStorage.removeItem('barberapp_remember');
    } finally {
        setInitialAuthChecked(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, role: Role, rememberMe: boolean) => {
    setIsLoading(true);
    try {
      const user = await apiLogin(email, password, role);
      setCurrentUser(user as CurrentUser);
      if (rememberMe) {
          localStorage.setItem('barberapp_user', JSON.stringify(user));
          localStorage.setItem('barberapp_remember', JSON.stringify({ email, role }));
          sessionStorage.removeItem('barberapp_user'); // Clean up session storage
      } else {
          sessionStorage.setItem('barberapp_user', JSON.stringify(user));
          localStorage.removeItem('barberapp_user');
          localStorage.removeItem('barberapp_remember');
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, phone: string, password: string) => {
    setIsLoading(true);
    try {
      // Registration is only for clients
      const newUser = await apiRegisterClient(name, email, phone, password);
      // Automatically log in the user AND "remember" them after registration
      setCurrentUser(newUser as CurrentUser);
      localStorage.setItem('barberapp_user', JSON.stringify(newUser));
      localStorage.setItem('barberapp_remember', JSON.stringify({ email: newUser.email, role: newUser.role }));
      sessionStorage.removeItem('barberapp_user'); // Clean up session storage just in case
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem('barberapp_user');
    localStorage.removeItem('barberapp_user');
    // Keep remember me data unless user explicitly logs out from a remembered session
    // localStorage.removeItem('barberapp_remember'); 
    // Let's clear it all for a full logout
    localStorage.removeItem('barberapp_remember');
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, register, logout, initialAuthChecked }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};