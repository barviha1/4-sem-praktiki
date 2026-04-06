import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../../services/api';
import ProductCard from './ProductCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setError('');
    } catch (err) {
      setError('Не удалось загрузить товары');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await productsAPI.delete(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <h3>Нет товаров</h3>
        <p>Добавьте первый товар, чтобы начать</p>
        <Link to="/products/new" className="btn btn-primary">
          Добавить товар
        </Link>
      </div>
    );
  }

  return (
    <div className="product-list">
      <div className="product-list-header">
        <h2>Список товаров</h2>
        <Link to="/products/new" className="btn btn-primary">
          Добавить товар
        </Link>
      </div>
      <div className="product-grid">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;