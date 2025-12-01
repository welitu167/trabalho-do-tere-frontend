import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore: allow importing CSS without type declarations
import './index.css'
import App from './App.tsx'
import Login from './componentes/login/login.tsx'
import AdminDashboard from './componentes/admin/AdminDashboard.tsx'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Checkout from '@/pages/checkout.tsx'
import {Elements } from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY); //chave publica

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
        <Route path="/finalizar-compra" element={ <Elements stripe={stripe}><Componente que tenha o cartão/></Elements>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)