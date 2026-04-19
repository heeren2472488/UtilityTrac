import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import './HomePage.css';

const slides = [
  {
    title: 'Asset, Work & Outage Command',
    subtitle: 'Unified operations for electric, gas, and water utilities.',
    details: 'Inventory assets, manage topology, schedule maintenance, and coordinate outage restoration in one control plane.',
    image: 'https://images.unsplash.com/photo-1520262494112-36c3f92027a6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Maintenance Planning & Crews',
    subtitle: 'Preventive and corrective workflows with full traceability.',
    details: 'Create work orders, assign crews, capture field logs, and close jobs with audit-ready history.',
    image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Meter-to-Cash Readiness',
    subtitle: 'Reliable meter reads, usage aggregation, and tariff mapping.',
    details: 'Validate reads, estimate gaps, aggregate usage, and map billing references for consistent customer operations.',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Reliability & Regulatory Analytics',
    subtitle: 'SAIDI, SAIFI, CAIDI and safety/compliance reporting.',
    details: 'Turn outage and safety data into regulatory dashboards and submission-ready reports.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
];

const moduleNav = [
  'Identity & Access',
  'Asset & Topology',
  'Work Management',
  'Outage Control',
  'Meter & Billing',
  'Regulatory Analytics',
  'Notifications',
  'Administration',
];

const moduleCards = [
  {
    title: 'Identity & Access Management',
    details: 'Registration, login, RBAC, session control, and audit trails for all utility roles.',
  },
  {
    title: 'Asset Registry & Network Topology',
    details: 'Asset master data, parent-child hierarchy, and upstream/downstream topology links.',
  },
  {
    title: 'Maintenance Planning & Work Orders',
    details: 'Preventive/corrective plans, scheduling windows, status tracking, and completion evidence.',
  },
  {
    title: 'Outage & Incident Management',
    details: 'Outage lifecycle, dispatch board, restoration workflow, and root-cause capture.',
  },
  {
    title: 'Meter Data & Usage Management',
    details: 'Manual/auto reads, quality flags, missing-read estimation, and usage aggregation.',
  },
  {
    title: 'Billing Reference & Tariff Mapping',
    details: 'Tariff rules, usage-to-bill references, and adjustment-ready billing summaries.',
  },
  {
    title: 'Reliability, Safety & Compliance',
    details: 'SAIDI/SAIFI/CAIDI, safety records, and draft-to-submitted regulatory reports.',
  },
  {
    title: 'Notifications & Alerts',
    details: 'In-app alerts for critical outages, maintenance due, safety incidents, and anomalies.',
  },
];

const actors = [
  'Operations Planner',
  'Field Technician',
  'Control Room Operator',
  'Billing & Customer Ops',
  'Regulatory Analyst',
  'Utilities Admin',
];

const architecture = [
  'Frontend: React/Angular dashboards and workflows',
  'Backend: REST APIs (Spring Boot / ASP.NET Core adaptable)',
  'Database: Relational model (MySQL/PostgreSQL/SQL Server)',
];

const nonFunctional = [
  'Performance target for high-concurrency outage and metering peaks',
  'RBAC, auditability, and encrypted transport/storage',
  'Horizontal scalability for large asset graphs and multi-region operations',
  '99.9% availability with graceful degradation for reporting workloads',
  'Observability with centralized metrics and logs across all modules',
];

const uiShowcase = [
  {
    title: 'Cinematic Hero Layering',
    details: 'Video + gradient + pointer glow composition for high-impact first impression with controlled contrast.',
  },
  {
    title: 'Motion-Driven Storytelling',
    details: 'Subtle entrance timing, progress indicators, and contextual hover dynamics that guide user attention.',
  },
  {
    title: 'Enterprise Information Density',
    details: 'Complex utility domain content organized into modular cards, pillars, and role-focused sections.',
  },
  {
    title: 'Dark/Light Theme Parity',
    details: 'Purpose-built styles in both themes so visual quality remains premium regardless of mode.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });

  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const handleHeroMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPointer({ x, y });
  };

  return (
    <div className="home-container">
      <Navbar onLogin={() => navigate('/login')} />

      <section
        id="home"
        className="hero-slider"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={() => setPointer({ x: 50, y: 50 })}
        style={{ '--mx': `${pointer.x}%`, '--my': `${pointer.y}%` }}
      >
        <div className="hero-video-layer" aria-hidden>
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80"
          >
            <source src="https://cdn.coverr.co/videos/coverr-high-voltage-tower-at-night-1579/1080p.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="hero-cursor-glow" aria-hidden />
        <div className="hero-particles" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="hero-particle" style={{ '--i': i }} />
          ))}
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Cyber utility operations</p>
          <h1 className="home-main-title"><span className="home-brand-mark">⬡</span> UtiliTrack</h1>
          <p className="hero-description">
            UtiliTrack is a web-based Asset, Work, Outage, Metering, Billing Reference, and
            Regulatory Analytics platform for utility providers. It helps planners, field teams,
            control rooms, billing operations, and analysts run reliable utility workflows from a
            single secure system.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('/login')}>
              Explore Platform
            </button>
            <button className="secondary-button" onClick={() => window.location.assign('#services')}>
              View Modules
            </button>
          </div>
          <div className="hero-kpi-strip">
            <div className="hero-kpi-chip"><strong>8</strong><span>Core Modules</span></div>
            <div className="hero-kpi-chip"><strong>6</strong><span>Operational Roles</span></div>
            <div className="hero-kpi-chip"><strong>99.9%</strong><span>Availability Target</span></div>
          </div>
          <div className="hero-trust-strip">
            <span>Built for Utilities</span>
            <span>REST API Architecture</span>
            <span>Audit-Ready Workflows</span>
            <span>Operational Resilience</span>
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
                <div
                  className="slide-visual"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    transform: `perspective(1200px) rotateY(${(pointer.x - 50) * 0.08}deg) rotateX(${(50 - pointer.y) * 0.06}deg) scale(1.01)`,
                  }}
                />
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
        <div className="slide-progress" aria-hidden>
          <span style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
        </div>
      </section>

      <section className="home-section ui-showcase">
        <div className="ui-showcase-head">
          <h2>Design Patterns Worth Reusing</h2>
          <p>
            A production-grade frontend combines architecture clarity, thoughtful motion, visual hierarchy,
            and strong theme consistency — not just colors.
          </p>
        </div>
        <div className="ui-showcase-grid">
          {uiShowcase.map((item) => (
            <article key={item.title} className="ui-showcase-card">
              <h3>{item.title}</h3>
              <p>{item.details}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className="home-section services-nav">
        <h2>Module Overview</h2>
        <div className="service-pill-nav">
          {moduleNav.map((item) => (
            <button key={item} className="service-pill">
              {item}
            </button>
          ))}
        </div>
        <div className="services-list">
          {moduleCards.map((module, idx) => (
            <article className="service-card neon-card module-card" key={module.title}>
              <div className="module-card-top">
                <span className="module-index">{String(idx + 1).padStart(2, '0')}</span>
                <span className="module-arrow">↗</span>
              </div>
              <h3>{module.title}</h3>
              <p>{module.details}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="insights" className="home-section gray">
        <div className="feature-grid">
          <div>
            <h2>Actors, Architecture & Reliability Goals</h2>
            <p>
              Built for modern utility operations with clear role separation, API-first architecture,
              and enterprise-grade non-functional goals.
            </p>
          </div>
          <div className="insight-columns">
            <div>
              <h3 className="insight-title">Core Actors</h3>
              <ul className="features-list">
                {actors.map((actor) => (
                  <li key={actor}>{actor}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="insight-title">Architecture</h3>
              <ul className="features-list">
                {architecture.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="insight-title">Non-Functional Requirements</h3>
              <ul className="features-list">
                {nonFunctional.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="home-section cta-panel">
        <div className="cta-copy">
          <h2>Deploy UtiliTrack for end-to-end utility operations</h2>
          <p>
            From asset registry and maintenance to outage response, metering, billing references,
            and regulatory analytics — run everything in one secure platform.
          </p>
        </div>
        <div className="cta-actions">
          <button className="primary-button" onClick={() => navigate('/login')}>
            Start Demo
          </button>
          <button className="secondary-button" onClick={() => window.location.assign('#home')}>
            Back to Top
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}