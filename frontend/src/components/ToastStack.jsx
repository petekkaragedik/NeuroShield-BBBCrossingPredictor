import { useState, useEffect, useCallback } from 'react'
import './ToastStack.css'

let toastIdCounter = 0
let globalToastDispatch = null

/**
 * Hook to add toasts from anywhere in the app
 */
export function useToast() {
  return useCallback((type, message, duration = 3000) => {
    if (globalToastDispatch) {
      globalToastDispatch({ type, message, duration })
    }
  }, [])
}

/**
 * Toast Stack Component - renders toasts in top right corner
 */
export default function ToastStack() {
  const [toasts, setToasts] = useState([])

  // Register global dispatch function
  useEffect(() => {
    globalToastDispatch = ({ type, message, duration }) => {
      const id = ++toastIdCounter
      const newToast = { id, type, message, duration }

      setToasts(prev => {
        // Keep only the 2 most recent toasts, then add the new one (max 3 total)
        const limited = prev.slice(-2)
        return [...limited, newToast]
      })

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id)
        }, duration)
      }
    }

    return () => {
      globalToastDispatch = null
    }
  }, [])

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  )
}

function Toast({ type, message, onDismiss }) {
  const icons = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
    link: '🔗',
    share: '📎',
  }

  const styles = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
    link: 'toast-link',
    share: 'toast-share',
  }

  return (
    <div className={`toast ${styles[type] || 'toast-info'}`}>
      <div className="toast-icon">{icons[type] || 'ℹ'}</div>
      <div className="toast-message">{message}</div>
      <button
        className="toast-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
