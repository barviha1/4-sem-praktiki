import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import '../components/Products/ProductDetail.css';

const ProductDetail = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      setProduct(response.data);
    } catch (err) {
      setError('Не удалось загрузить товар');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await productsAPI.delete(id);
        navigate('/products');
      } catch (err) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (!product) {
    return <div className="error-container">Товар не найден</div>;
  }

  return (
    <div className="product-detail">
      <div className="product-detail-header">
        <Link to="/products" className="btn-back">← Назад к списку</Link>
      </div>
      <div className="product-detail-card">
        <h1 className="product-detail-title">{product.title}</h1>
        <div className="product-detail-category">{product.category}</div>
        <div className="product-detail-price">{product.price} ₽</div>
        <div className="product-detail-description">
          <h3>Описание:</h3>
          <p>{product.description}</p>
        </div>
        <div className="product-detail-actions">
          <Link to={`/products/${product.id}/edit`} className="btn btn-primary">
            Редактировать
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;