import React from "react";
import "./style.scss";
import "./style.css";

const ProductCatalog = () => {
  const products = [
    {
      id: 1,
      title: "Беспроводные наушники Sony",
      description:
        "Высококачественные беспроводные наушники с шумоподавлением. До 30 часов работы от аккумулятора.",
      image:
        "https://www.sony.ru/image/5d02da5df552836db894cead8a68f5f3?fmt=pjpeg&wid=330&bgcolor=FFFFFF&bgc=FFFFFF",
      rating: 4.5,
      reviews: 128,
      priceCurrent: "8 499 ₽",
      priceOld: "10 999 ₽",
    },
    {
      id: 2,
      title: "Фотоаппарат",
      description:
        "Профессиональная зеркальная камера. Комплект включает объектив и сумку для переноски.",
      image:
        "https://texno-pro.ru/upload/iblock/a05/Canon-EOS-R6-24-105-STM-kit-1.jpg",
      rating: 4.0,
      reviews: 64,
      priceCurrent: "34 999 ₽",
      priceOld: null,
    },
  ];

  return (
    <div className="container">
      <h1>Каталог товаров</h1>

      {products.map((product) => (
        <div key={product.id} className="product-card">
          <img
            className="product-card__image"
            src={product.image}
            alt={product.title}
          />

          <div className="product-card__content">
            <h2 className="product-card__title">{product.title}</h2>
            <p className="product-card__description">{product.description}</p>

            <div className="product-card__details">
              <div className="product-card__rating">
                {Array.from({ length: Math.floor(product.rating) }).map((_, i) => (
                  <i key={i} className="fas fa-star"></i>
                ))}
                {product.rating % 1 !== 0 && <i className="fas fa-star-half-alt"></i>}
                <span className="rating-text">
                  {product.rating} ({product.reviews} отзывов)
                </span>
              </div>

              <div className="product-card__price">
                <span className="price-current">{product.priceCurrent}</span>
                {product.priceOld && <span className="price-old">{product.priceOld}</span>}
              </div>
            </div>

            <div className="product-card__actions">
              <button className="btn btn--primary">
                <i className="fas fa-shopping-cart"></i> В корзину
              </button>
              <button className="btn btn--secondary">
                <i className="far fa-heart"></i> В избранное
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductCatalog;