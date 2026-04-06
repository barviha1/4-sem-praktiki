import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI } from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import '../components/Products/ProductForm.css';

const ProductForm = ({ isEdit = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (isEdit && id) {
      loadProduct();
    }
  }, [isEdit, id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id);
      setFormData({
        title: response.data.title,
        category: response.data.category,
        description: response.data.description,
        price: response.data.price,
      });
    } catch (err) {
      setError('Не удалось загрузить товар');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
    };

    try {
      if (isEdit && id) {
        await productsAPI.update(id, productData);
      } else {
        await productsAPI.create(productData);
      }
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при сохранении товара');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <LoadingSpinner />;

  return (
    <div className="product-form-container">
      <div className="product-form-card">
        <h2>{isEdit ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название товара *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Введите название товара"
            />
          </div>
          <div className="form-group">
            <label>Категория *</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              placeholder="Например: Электроника, Одежда, Книги"
            />
          </div>
          <div className="form-group">
            <label>Описание *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Введите описание товара"
            />
          </div>
          <div className="form-group">
            <label>Цена *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              placeholder="Введите цену в рублях"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="btn btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;