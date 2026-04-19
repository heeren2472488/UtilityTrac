import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggleButton.css';

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle-fab"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <span className="theme-fab-icon">{isDark ? '☀️' : '🌙'}</span>
      <span className="theme-fab-label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
