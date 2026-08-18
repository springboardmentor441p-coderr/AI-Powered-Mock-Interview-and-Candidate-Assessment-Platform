import React, { useEffect, useState } from 'react'
import { api } from '../api'

const ICONS = { info: 'ℹ️', success: '✅', reminder: '⏰' }

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.listNotifications().then(setItems).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.markNotificationRead(id)
    load()
  }

  const markAll = async () => {
    await api.markAllRead()
    load()
  }

  if (loading) return <p className="muted">Loading notifications...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Notifications</h1>
        {items.some((n) => !n.is_read) && (
          <button className="btn-secondary btn" onClick={markAll}>Mark all as read</button>
        )}
      </div>
      <div className="card">
        {items.length === 0 && <p className="muted">No notifications yet.</p>}
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markRead(n.id)}
            style={{
              display: 'flex', gap: 12, padding: '12px 0',
              borderBottom: '1px solid var(--border)',
              opacity: n.is_read ? 0.6 : 1,
              cursor: n.is_read ? 'default' : 'pointer',
            }}
          >
            <div style={{ fontSize: 20 }}>{ICONS[n.notif_type] || 'ℹ️'}</div>
            <div style={{ flex: 1 }}>
              <div>{n.message}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {new Date(n.created_at).toLocaleString()}
              </div>
            </div>
            {!n.is_read && <span className="chip" style={{ height: 'fit-content' }}>New</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
