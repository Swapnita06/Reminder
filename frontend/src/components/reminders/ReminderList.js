import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import Cookies from 'js-cookie';

export default function ReminderList() {
  const { user, socket } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    //let isMounted = true;
    
    // const fetchReminders = async () => {
    //   try {
    //     const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reminders/active`, {
    //       headers: {
    //         'Authorization': `Bearer ${Cookies.get('token')}`,
    //         'Content-Type': 'application/json'
    //       }
    //     });
        
    //         console.log('API Response:', response); 

    //     if (!response.ok) {
    //       throw new Error(`HTTP error! status: ${response.status}`);
    //     }
        
    //     const data = await response.json();
    //     // if (isMounted) {
    //     //   setReminders(data);
    //     //   setError('');
    //     // }
    //     console.log('Reminders data:', data);
    //     setReminders(data);

    //   } catch (err) {
    //     // if (isMounted) {
    //     //   setError('Failed to fetch reminders. Please try again.');
    //     //   console.error('Fetch error:', err);
    //     // }
    //     console.error('Fetch error:', err);
    //   setError('Failed to load reminders');
    //   } finally {
    //      setLoading(false);
    //   }
    // };

    // In your fetchReminders function
const fetchReminders = async () => {
  try {
    const response = await fetch(`http://localhost:5000/api/reminders/active`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    });
    
    const data = await response.json();
    
    // Filter out any invalid or past-due reminders
    const validReminders = data.filter(reminder => 
      reminder.dueAt && new Date(reminder.dueAt) > new Date()
    );
    
    setReminders(validReminders);
  } catch (err) {
    console.error('Error:', err);
    setError('Failed to load reminders');
  }
};

    fetchReminders();

    // Socket listener for new reminders only
    if (socket) {
      console.log('Setting up socket listeners');
      socket.on('newReminder', (reminder) => {
  console.log('New reminder via socket:', reminder);
  setReminders(prev => [{
    ...reminder,
    senderInfo: reminder.senderInfo || { username: 'Unknown' },
    recipientInfo: reminder.recipientInfo || { username: 'Unknown' }
  }, ...prev]);
});
    }

    return () => {
     // isMounted = false;
      if (socket) {
        socket.off('newReminder');
      }
    };
  }, [socket]);



  // if (socket) {
  //   socket.on('reminderDueNow', (reminder) => {
  //     // Show immediate notification
  //     showReminderAlert(reminder);
      
  //     // Update the reminder in state
  //     setReminders(prev => prev.map(r => 
  //       r._id === reminder._id ? { ...r, isDueNow: true } : r
  //     ));
  //   });
  // }

//   return () => {
//     if (socket) {
//       socket.off('reminderDueNow');
//     }
//   };
// }, [socket]);

const showReminderAlert = (reminder) => {
  // Check if notifications are allowed
  if (Notification.permission === 'granted') {
    new Notification('Reminder Due Now!', {
      body: `${reminder.content}\nChat with ${reminder.recipientInfo?.username || 'participant'}`,
      icon: '/notification-icon.png',
      requireInteraction: true
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showReminderAlert(reminder);
      }
    });
  }

  // Fallback alert if notifications are blocked
  if (Notification.permission === 'denied') {
    alert(`⏰ REMINDER: ${reminder.content}`);
  }
};

  useEffect(() => {
  console.log('Current reminders:', reminders);
}, [reminders]);


  const handleComplete = async (reminderId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reminders/${reminderId}/complete`, 
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${Cookies.get('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedReminder = await response.json();
      setReminders(prev => prev.map(r => 
        r._id === reminderId ? updatedReminder : r
      ));
    } catch (err) {
      console.error('Failed to complete reminder:', err);
      alert('Failed to mark reminder as complete');
    }
  };

 // if (loading) return <div className="loading">Loading reminders...</div>;
  if (error) return <div className="error">{error}</div>;



  return (
  <div className="reminders-container">
    <h2>Your Reminders</h2>
    <div className="debug-info">
      <p>User ID: {user?._id || 'Not logged in'}</p>
      <p>Socket status: {socket?.connected ? 'Connected' : 'Disconnected'}</p>
    </div>
    {reminders.length === 0 ? (
      <div className="no-reminders">
        <p>No reminders found</p>
        <button onClick={() => console.log(reminders)}>Log Reminders State</button>
      </div>
    ) : (
      <div className="reminders-list">
        {reminders.map(reminder => (
          <div key={reminder._id} className="reminder-card" >
            <div className="reminder-content">
              <p>{reminder.content}</p>
              <small>
                Chat between: {reminder.senderInfo?.username || 'You'} and {reminder.recipientInfo?.username || 'Unknown'}<br />
                 {/* Due: {new Date(reminder.dueAt).toLocaleString()}
                {reminder.completed && ' (Completed)'}  */}
                 Due at: {new Date(reminder.dueAt).toLocaleString('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
})}

              </small>
            </div>
            {!reminder.completed && (
              <button 
                onClick={() => handleComplete(reminder._id)}
                className="complete-button"
              >
                Mark Complete
              </button>
            )}
             {/* {reminder.isDueNow && (
    <div className="urgent-badge">DUE NOW!</div>
  )} */}
          </div>
        ))}
      </div>
    )}
  </div>
);
}