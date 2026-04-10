import React from 'react';
import './Navbar.css';

export default function Navbar({ onLogin }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-mark">⬡</div>
        <div className="brand-copy">
          <span className="brand-title">UtiliTrack</span>
          <span className="brand-tagline">Cyber utility operations</span>
        </div>
      </div>

      <div className="navbar-menu">
        <a href="#home">Home</a>
        <a href="#services">Services</a>
        <a href="#insights">Insights</a>
        <a href="#contact">Contact</a>
      </div>

      <div className="navbar-actions">
        <button className="btn-outline" onClick={onLogin}>
          Login
        </button>
      </div>
    </nav>
  );
}
