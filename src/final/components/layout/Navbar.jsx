import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

export default function Navbar({ onLogin }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-mark">⬡</div>
        <div className="brand-copy">
          <span className="brand-title">
            <span className="holi-U">U</span>
            <span className="holi-t">t</span>
            <span className="holi-i">i</span>
            <span className="holi-l">l</span>
            <span className="holi-i2">i</span>
            <span className="holi-T">T</span>
            <span className="holi-r">r</span>
            <span className="holi-a">a</span>
            <span className="holi-c">c</span>
            <span className="holi-k">k</span>
          </span>
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
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button className="btn-outline" onClick={onLogin}>
          Login
        </button>
      </div>
    </nav>
  );
}
