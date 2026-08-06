import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

export function useAutoLogout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const timer = useRef(null)

  const reset = useCallback(() => {
    if (!user) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      logout()
      navigate('/login?reason=timeout')
    }, TIMEOUT_MS)
  }, [user, logout, navigate])

  useEffect(() => {
    if (!user) return
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, reset))
    reset()
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      clearTimeout(timer.current)
    }
  }, [user, reset])
}
