import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

// ✅ PostgreSQL-ready notification types
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorUsername: string;   // PostgreSQL: users.username JOIN
  actorAvatar: string;     // PostgreSQL: users.avatar
  message: string;
  postId?: string;         // PostgreSQL: posts.id (nullable)
  commentId?: string;      // PostgreSQL: comments.id (nullable)
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Mock data — backend ሲመጣ GET /api/notifications ይተካዋል
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'like',
    actorUsername: 'abel_codes',
    actorAvatar: '',
    message: 'liked your post',
    postId: 'mock-1',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n2',
    type: 'follow',
    actorUsername: 'mahlet_dev',
    actorAvatar: '',
    message: 'started following you',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n3',
    type: 'comment',
    actorUsername: 'fitsum_backend',
    actorAvatar: '',
    message: 'commented on your post',
    postId: 'mock-2',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'n4',
    type: 'mention',
    actorUsername: 'eden_creates',
    actorAvatar: '',
    message: 'mentioned you in a comment',
    postId: 'mock-3',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n5',
    type: 'system',
    actorUsername: 'Nexify',
    actorAvatar: '',
    message: 'Welcome to Nexify! Start posting and connecting.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    // TODO: PATCH /api/notifications/:id/read
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    // TODO: PATCH /api/notifications/read-all
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => {
    const newN: AppNotification = {
      ...n,
      id: `n-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newN, ...prev]);
  }, []);

  const clearAll = useCallback(() => {
    // TODO: DELETE /api/notifications
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      markAsRead, markAllAsRead,
      addNotification, clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}