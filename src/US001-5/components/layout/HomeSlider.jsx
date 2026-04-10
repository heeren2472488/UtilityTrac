import React, { useState } from 'react';
import './HomeSlider.css';

const slides = [
  {
    title: 'Neon Asset Command',
    subtitle: 'Track utility infrastructure across electric, gas, and water.',
    description: 'Real-time topology, condition, and location visibility in one cyber dashboard.',
    image: 'https://images.unsplash.com/photo-1573497019257-2c43b06a9985?auto=format&fit=crop&w=1500&q=80',
  },
  {
    title: 'Autonomous Crew Flow',
    subtitle: 'Move work orders from dispatch to field with speed and confidence.',
    description: 'Automated assignments, status sync, and crew routing built for modern utilities.',
    image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1500&q=80',
  },
  {
    title: 'Outage Pulse',
    subtitle: 'Detect and restore service faster with live outage telemetry.',
    description: 'Incident mapping, alerting, and response orchestration all in one place.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1500&q=80',
  },
  {
    title: 'Reliability Intelligence',
    subtitle: 'Measure SAIDI, SAIFI, CAIDI and safety metrics in one command view.',
    description: 'Generate regulatory dashboards and compliance analytics for every region.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1500&q=80',
  },
];

export default function HomeSlider() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((value) => (value - 1 + slides.length) % slides.length);
  const next = () => setCurrent((value) => (value + 1) % slides.length);

  return (
    <section className="home-slider">
      <div className="slider-backdrop" />
      <div className="slider-inner">
        <div className="slider-copy">
          <span className="slider-eyebrow">Cyberpunk operations</span>
          <h1>{slides[current].title}</h1>
          <p>{slides[current].subtitle}</p>
          <p className="slider-description">{slides[current].description}</p>
        </div>

        <div className="slider-frame">
          <div
            className="slider-image"
            style={{ backgroundImage: `url(${slides[current].image})` }}
          />
          <div className="slider-controls">
            <button className="slider-arrow" onClick={prev} aria-label="Previous slide">
              ‹
            </button>
            <div className="slider-indicators">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === current ? 'active' : ''}`}
                  onClick={() => setCurrent(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
            <button className="slider-arrow" onClick={next} aria-label="Next slide">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
