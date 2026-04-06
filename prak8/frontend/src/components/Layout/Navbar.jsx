import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/products" className="navbar-brand">
          Product Manager
        </Link>
        <div className="navbar-menu">
          <Link to="/products" className="navbar-link">Товары</Link>
          <Link to="/products/new" className="navbar-link">Добавить товар</Link>
        </div>
        <div className="navbar-user">
          <span className="user-name">{user?.first_name} {user?.last_name}</span>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;