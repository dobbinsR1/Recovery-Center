import { createContext, useContext, useMemo, useRef } from 'react'
import { Toast } from 'primereact/toast'

const ToastContext = createContext(null)

export function AppToastProvider({ children }) {
  const toastRef = useRef(null)

  const value = useMemo(
    () => ({
      showToast: ({ severity = 'info', summary, detail, life = 3200 }) => {
        toastRef.current?.show({ severity, summary, detail, life })
      },
      showSuccess: (summary, detail, life = 2600) => {
        toastRef.current?.show({ severity: 'success', summary, detail, life })
      },
      showError: (summary, detail, life = 4200) => {
        toastRef.current?.show({ severity: 'error', summary, detail, life })
      },
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast ref={toastRef} position="top-right" />
    </ToastContext.Provider>
  )
}

export function useAppToast() {
  const value = useContext(ToastContext)

  if (!value) {
    throw new Error('useAppToast must be used within AppToastProvider')
  }

  return value
}
