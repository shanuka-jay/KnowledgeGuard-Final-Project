import { createContext, useContext, useMemo, useState } from 'react'
import { CheckCircle, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const api = useMemo(() => ({
    show(message, type = 'info') {
      const id = crypto.randomUUID()
      setToasts(current => [...current, { id, message, type }])
      window.setTimeout(() => {
        setToasts(current => current.filter(toast => toast.id !== id))
      }, 4200)
    },
    success(message) { this.show(message, 'success') },
    error(message) { this.show(message, 'error') },
    info(message) { this.show(message, 'info') },
  }), [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack">
        {toasts.map(toast => {
          const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? XCircle : Info
          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <Icon size={18} />
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))} className="toast-close" aria-label="Close notification">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
