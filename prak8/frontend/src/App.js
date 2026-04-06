import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/Common/LoadingSpinner';

import Login from './pages/Login';
import Register from './pages/Register';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';

import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Публичный маршрут - если пользователь уже авторизован, перенаправляет на /products
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      
      {/* Публичные страницы */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      
      {/* Защищенные страницы с Layout */}
      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProductList />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/products/new" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProductForm />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/products/:id" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProductDetail />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/products/:id/edit" 
        element={
          <ProtectedRoute>
            <Layout>
              <ProductForm isEdit />
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;