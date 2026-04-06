import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProductList from './components/Products/ProductList';
import ProductForm from './components/Products/ProductForm';
import ProductDetail from './components/Products/ProductDetail';
import LoadingSpinner from './components/Common/LoadingSpinner';
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
      
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      <Route path="/products" element={
        <ProtectedRoute>
          <Layout>
            <ProductList />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/products/new" element={
        <ProtectedRoute>
          <Layout>
            <ProductForm />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/products/:id" element={
        <ProtectedRoute>
          <Layout>
            <ProductDetail />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/products/:id/edit" element={
        <ProtectedRoute>
          <Layout>
            <ProductForm isEdit />
          </Layout>
        </ProtectedRoute>
      } />
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