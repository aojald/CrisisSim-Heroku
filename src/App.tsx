import React from 'react';
import { SimulationProvider } from './context/SimulationContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import LoginForm from './components/auth/LoginForm';
import SimulationFlow from './components/SimulationFlow';
import { Settings, Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}

function AppContent() {
  const { isAuthenticated, username, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => {}} />;
  }

  return (
    <SimulationProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto py-4 px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-600 dark:bg-blue-500 text-white p-2 rounded-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                  Executive Cyber Crisis Simulator
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  <span>{username}</span>
                </div>
                <ThemeToggle />
                <button
                  onClick={logout}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="py-8 px-4 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <SimulationFlow />
          </div>
        </main>
      </div>
    </SimulationProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}