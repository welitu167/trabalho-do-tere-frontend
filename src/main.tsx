import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore: allow importing CSS without type declarations
import './index.css'
import App from './App.tsx'
import Login from './componentes/login/login.tsx'
import AdminDashboard from './componentes/admin/AdminDashboard.tsx'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Cast the imported AdminDashboard to a React component type in case its export is untyped
const AdminDashboardComponent = (AdminDashboard as unknown) as React.ComponentType<any>

// Custom route que protege páginas de admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  const tipo = localStorage.getItem('tipo')
  if (tipo !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<App/>} />
          <Route path="/login" element={<Login/>} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboardComponent/>
              </AdminRoute>
            } 
          />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)