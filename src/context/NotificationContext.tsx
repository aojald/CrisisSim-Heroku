import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NotificationContextValue {
  unreadCount: number;
  addUnreadMessage: () => void;
  clearUnreadMessages: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  const addUnreadMessage = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);

  const clearUnreadMessages = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const value = {
    unreadCount,
    addUnreadMessage,
    clearUnreadMessages
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 