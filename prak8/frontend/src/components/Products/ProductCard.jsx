import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onDelete }) => {
  return (
    <div className="product-card">
      <div className="product-card-content">
        <h3 className="product-title">{product.title}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-description">{product.description}</p>
        <p className="product-price">{product.price} ₽</p>
      </div>
      <div className="product-card-actions">
        <Link to={`/products/${product.id}`} className="btn-view">
          Просмотр
        </Link>
        <Link to={`/products/${product.id}/edit`} className="btn-edit">
          Редактировать
        </Link>
        <button onClick={() => onDelete(product.id)} className="btn-delete">
          Удалить
        </button>
      </div>
    </div>
  );
};

export default ProductCard;