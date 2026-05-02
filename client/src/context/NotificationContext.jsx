import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      clearNotifications();
      return;
    }

    setLoading(true);
    try {
      const response = await notificationAPI.getMine({ limit: 12 });
      setNotifications(response.data.data.notifications || []);
      setUnreadCount(response.data.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, [clearNotifications, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearNotifications();
      return;
    }

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);

    return () => window.clearInterval(intervalId);
  }, [clearNotifications, fetchNotifications, isAuthenticated, user?.id]);

  const markAsRead = useCallback(async (id) => {
    const response = await notificationAPI.markAsRead(id);
    const updatedNotification = response.data.data.notification;
    const nextUnreadCount = response.data.data.unreadCount || 0;

    setNotifications((current) => current.map((notification) => (
      notification.id === id ? { ...notification, ...updatedNotification } : notification
    )));
    setUnreadCount(nextUnreadCount);

    return response.data;
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationAPI.markAllAsRead();
    setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })));
    setUnreadCount(0);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }), [fetchNotifications, loading, markAllAsRead, markAsRead, notifications, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
