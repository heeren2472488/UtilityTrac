import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './HomePage.css';

const slides = [
  {
    title: 'Neon Asset Intelligence',
    subtitle: 'Real-time visibility for electric, gas, and water infrastructure.',
    details: 'Track equipment, topology, and condition data across systems with instant insights.',
    image: 'https://images.unsplash.com/photo-1520262494112-36c3f92027a6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Autonomous Workflows',
    subtitle: 'Plan, assign, and finish work faster with automated task flow.',
    details: 'From dispatch to completion, keep crews aligned with the speed of modern operations.',
    image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Outage Response Command',
    subtitle: 'Respond to incidents instantly with clear outage telemetry.',
    details: 'Coordinate field teams, notify stakeholders, and restore service with precision.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Cyber Insight Analytics',
    subtitle: 'Performance dashboards built for utility reliability and compliance.',
    details: 'Turn event data into actionable trends, risk signals, and regulatory metrics.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
];

const serviceNav = [
  'Asset Registry',
  'Work Management',
  'Outage Tracking',
  'Analytics & Compliance',
];

export default function HomePage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);

  return (
    <div className="home-container">
      <Navbar onLogin={() => navigate('/login')} />

      <section className="hero-slider">
        <div className="hero-copy">
          <p className="eyebrow">Cyber utility operations</p>
          <h1>UtiliTrack</h1>
          <p className="hero-description">
            A dark-mode control plane for asset, work, outage, and analytics workflows in
            electric, gas, and water utilities.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('/login')}>
              Launch demo
            </button>
            <button className="secondary-button" onClick={() => navigate('/services')}>
              View features
            </button>
          </div>
        </div>

        <div className="slider-window">
          <div className="slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {slides.map((slide, index) => (
              <article className="slide" key={index}>
                <div className="slide-copy">
                  <span className="slide-label">Live mode</span>
                  <h2>{slide.title}</h2>
                  <p className="slide-subtitle">{slide.subtitle}</p>
                  <p>{slide.details}</p>
                </div>
                <div className="slide-visual" style={{ backgroundImage: `url(${slide.image})` }} />
              </article>
            ))}
          </div>
        </div>

        <div className="slide-controls">
          <button className="arrow-button" onClick={prevSlide} aria-label="Previous slide">
            ←
          </button>
          <div className="slide-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <button className="arrow-button" onClick={nextSlide} aria-label="Next slide">
            →
          </button>
        </div>
      </section>

      <section className="home-section services-nav">
        <h2>Service grid</h2>
        <div className="service-pill-nav">
          {serviceNav.map((item) => (
            <button key={item} className="service-pill">
              {item}
            </button>
          ))}
        </div>
        <div className="services-list">
          <div className="service-card neon-card">
            <img
              src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=400&q=80"
              alt="Asset Registry"
            />
            <h3>Asset Registry</h3>
            <p>One source of truth for infrastructure and topology, with asset lifecycle clarity.</p>
          </div>
          <div className="service-card neon-card">
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80"
              alt="Work Management"
            />
            <h3>Work Management</h3>
            <p>Automate field ops, dispatch, and completion tracking across crews and sites.</p>
          </div>
          <div className="service-card neon-card">
            <img
              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80"
              alt="Outage Tracking"
            />
            <h3>Outage Tracking</h3>
            <p>Respond immediately to incidents with outage mapping, alerts, and coordinated workflows.</p>
          </div>
          <div className="service-card neon-card">
            <img
              src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80"
              alt="Analytics"
            />
            <h3>Analytics</h3>
            <p>Monitor reliability, compliance, and operational performance through intelligent dashboards.</p>
          </div>
        </div>
      </section>

      <section className="home-section gray">
        <div className="feature-grid">
          <div>
            <h2>Why utilities adopt cyberpunk operations</h2>
            <p>
              Operate faster, safer, and more predictably with a platform designed for modern
              utility teams and mission-critical networks.
            </p>
          </div>
          <ul className="features-list">
            <li>Dark UI with neon accents for clear, high-contrast decision making.</li>
            <li>Unified operational command across asset, crew, outage, and analytics lanes.</li>
            <li>Faster incident response and more predictable restoration.</li>
            <li>Data-driven compliance and actionable service intelligence.</li>
          </ul>
        </div>
      </section>

      <section className="home-section cta-panel">
        <div className="cta-copy">
          <h2>Step into the future of utility control</h2>
          <p>Make every outage response and work assignment feel as fast as a city at night.</p>
        </div>
        <div className="cta-actions">
          <button className="primary-button" onClick={() => navigate('/login')}>
            Start now
          </button>
          <button className="secondary-button" onClick={() => navigate('/contact')}>
            Talk to an expert
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}