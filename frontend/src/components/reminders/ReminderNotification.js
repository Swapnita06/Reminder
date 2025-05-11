import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function ReminderNotification() {
  const { socket } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const handleReminderDue = (reminder) => {
      if (Notification.permission === 'granted') {
        new Notification('Reminder Due', {
          body: reminder.content
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Reminder Due', {
              body: reminder.content
            });
          }
        });
      }
    };

    socket.on('reminderDue', handleReminderDue);

    return () => {
      socket.off('reminderDue', handleReminderDue);
    };
  }, [socket]);

  return null;
}