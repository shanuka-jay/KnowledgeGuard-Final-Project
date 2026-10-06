import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import useAuthStore from '../store/authStore'

export function useSocket() {
  const { token } = useAuthStore()
  const socketRef = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestAlert, setLatestAlert] = useState(null)

  useEffect(() => {
    if (!token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socket.emit('get_unread_count')
    })

    socket.on('unread_count', ({ count }) => setUnreadCount(count))

    socket.on('new_alert', (alert) => {
      setLatestAlert(alert)
      setUnreadCount(c => c + 1)
    })

    socket.on('badge_update', ({ increment }) => {
      setUnreadCount(c => c + increment)
    })

    socket.on('alerts_cleared', () => setUnreadCount(0))

    socketRef.current = socket
    return () => socket.disconnect()
  }, [token])

  const markAllSeen = () => {
    socketRef.current?.emit('mark_alerts_seen')
    setUnreadCount(0)
  }

  return { unreadCount, latestAlert, markAllSeen }
}
