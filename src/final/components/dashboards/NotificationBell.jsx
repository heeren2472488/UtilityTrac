import React, { useState, useRef, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';

/*
 NotificationBell
 Props:
   alerts: [{ id, type ('critical'|'warning'|'info'), title, body, time }]
*/
export default function NotificationBell({ alerts = [] }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(new Set());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = alerts.filter(a => !read.has(a.id)).length;

  const markAll = () => setRead(new Set(alerts.map(a => a.id)));

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)} aria-label="Notifications">
        <FaBell />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">Notifications</span>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={markAll}>Mark all read</button>
            )}
          </div>

          <div className="notif-list">
            {alerts.length === 0 ? (
              <div className="notif-empty">No new notifications</div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`notif-item notif-${alert.type} ${read.has(alert.id) ? 'is-read' : ''}`}
                  onClick={() => setRead(prev => new Set([...prev, alert.id]))}
                >
                  <div className="notif-dot" />
                  <div className="notif-body">
                    <div className="notif-item-title">{alert.title}</div>
                    <div className="notif-item-body">{alert.body}</div>
                    <div className="notif-item-time">{alert.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
