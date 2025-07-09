import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (success: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  username: null,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app load
    const authStatus = localStorage.getItem('crisis_sim_auth');
    const storedUsername = localStorage.getItem('crisis_sim_user');
    
    if (authStatus === 'authenticated' && storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
    
    setIsLoading(false);
  }, []);

  const login = (success: boolean) => {
    if (success) {
      const storedUsername = localStorage.getItem('crisis_sim_user');
      setIsAuthenticated(true);
      setUsername(storedUsername);
    }
  };

  const logout = () => {
    localStorage.removeItem('crisis_sim_auth');
    localStorage.removeItem('crisis_sim_user');
    setIsAuthenticated(false);
    setUsername(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);