import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import './Alert.css'

type AlertType = 'success' | 'error' | 'info'

type Toast = { id: string; type: AlertType; message: string }

type AlertContextType = {
  showAlert: (type: AlertType, message: string) => void
  showConfirm: (message: string) => Promise<boolean>
  showPrompt: (message: string, defaultValue?: string) => Promise<string | null>
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  showConfirm: async () => false,
  showPrompt: async () => null
})

export function useAlerts(){
  return useContext(AlertContext)
}

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modal, setModal] = useState<{
    type: 'confirm' | 'prompt' | null
    message: string
    defaultValue?: string
    resolve?: (v: any)=>void
  }>({ type: null, message: '' })

  const showAlert = useCallback((type: AlertType, message: string) => {
    const id = Math.random().toString(36).slice(2,9)
    const t: Toast = { id, type, message }
    setToasts((s)=>[...s, t])
    setTimeout(()=> setToasts((s)=> s.filter(x=> x.id !== id)), 4000)
  }, [])

  const showConfirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setModal({ type: 'confirm', message, resolve })
    })
  }, [])

  const showPrompt = useCallback((message: string, defaultValue?: string) => {
    return new Promise<string | null>((resolve) => {
      setModal({ type: 'prompt', message, defaultValue, resolve })
    })
  }, [])

  function closeModal(){
    setModal({ type: null, message: '' })
  }

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      <div className="alert-toast-container">
        {toasts.map(t=> (
          <div key={t.id} className={`alert-toast ${t.type}`}>{t.message}</div>
        ))}
      </div>

      {modal.type === 'confirm' && (
        <div className="alert-modal-overlay">
          <div className="alert-modal">
            <p>{modal.message}</p>
            <div className="alert-modal-actions">
              <button onClick={()=>{ modal.resolve?.(true); closeModal() }} className="primary">Confirmar</button>
              <button onClick={()=>{ modal.resolve?.(false); closeModal() }} className="secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modal.type === 'prompt' && (
        <PromptModal modal={modal} closeModal={closeModal} />
      )}
    </AlertContext.Provider>
  )
}

function PromptModal({ modal, closeModal }:{ modal:any, closeModal:()=>void }){
  const [value, setValue] = useState(modal.defaultValue ?? '')

  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal">
        <p>{modal.message}</p>
        <input value={value} onChange={(e)=> setValue(e.target.value)} />
        <div className="alert-modal-actions">
          <button onClick={()=>{ modal.resolve?.(value); closeModal() }} className="primary">OK</button>
          <button onClick={()=>{ modal.resolve?.(null); closeModal() }} className="secondary">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default AlertProvider
   
