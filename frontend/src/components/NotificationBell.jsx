import {useEffect, useRef, useState} from 'react';
import {api} from '../api/client';

export default function NotificationBell({token}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const refresh = () => {
    api('/notifications', {}, token).then(setItems).catch(() => {});
    api('/notifications/unread-count', {}, token).then(res => setUnread(res.unread || 0)).catch(() => {});
  };

  useEffect(() => { refresh(); const id = setInterval(refresh, 30000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const onClick = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = (id) => api(`/notifications/${id}/read`, {method: 'POST'}, token).then(refresh).catch(() => {});
  const markAllRead = () => api('/notifications/read-all', {method: 'POST'}, token).then(refresh).catch(() => {});

  return <div className="account-menu" ref={ref}>
    <button className="bell" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Notifications">
      🔔{unread > 0 && <b>{unread > 9 ? '9+' : unread}</b>}
    </button>
    {open && <div className="profile-menu notification-panel">
      <div className="notification-panel-header"><span>Notifications</span>{unread > 0 && <button className="quiet-button" onClick={markAllRead}>Mark all read</button>}</div>
      {items.length ? items.slice(0, 8).map(item => (
        <button key={item.id} className={`notification-item ${item.is_read ? '' : 'unread'}`} onClick={() => markRead(item.id)}>
          <strong>{item.title}</strong>
          <small>{item.message}</small>
        </button>
      )) : <p className="figma-empty">No notifications yet.</p>}
    </div>}
  </div>;
}
