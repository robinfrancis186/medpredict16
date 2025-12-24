import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types/medical';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<UserRole, User> = {
  doctor: {
    id: 'doc-001',
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@hospital.com',
    role: 'doctor',
    department: 'Pulmonology',
  },
  nurse: {
    id: 'nurse-001',
    name: 'James Wilson',
    email: 'james.wilson@hospital.com',
    role: 'nurse',
    department: 'ICU',
  },
  patient: {
    id: 'patient-001',
    name: 'Robert Johnson',
    email: 'robert.j@email.com',
    role: 'patient',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // For demo, accept any credentials and use mock user
    setUser(mockUsers[role]);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
