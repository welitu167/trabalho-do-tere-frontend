import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore: allow importing CSS without type declarations
import './index.css'
import App from './App.tsx'
import Login from './componentes/login/login.tsx'
import AdminDashboard from './componentes/admin/AdminDashboard.tsx'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
//import Checkout from './componentes/checkout/Checkout.tsx' // Você precisa criar este componente

// Cast the imported AdminDashboard to a React component type in case its export is untyped
const AdminDashboardComponent = AdminDashboard as React.ComponentType<any>
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Custom route que protege páginas de admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  const tipo = localStorage.getItem('tipo')
  if (tipo !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
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
        <Route 
          path="/finalizar-compra" 
          element={
            <Elements stripe={stripePromise}>
              //Checkout
            </Elements>
          } 
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);