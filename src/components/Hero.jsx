import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import './Hero.css';

function Hero({ trendingAnime, onPlay }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trendingAnime.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [trendingAnime.length]);

  if (!trendingAnime || trendingAnime.length === 0) return <div className="hero-skeleton skeleton" />;

  const current = trendingAnime[currentIndex];

  return (
    <section className="hero">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-slide"
        >
          <div className="hero-backdrop">
            <img 
              src={current.hdBanner || current.bannerImage} 
              alt="" 
              className="hero-banner-img" 
              onError={(e) => {
                if (current.fallbackBanner && e.target.src !== current.fallbackBanner) {
                  e.target.src = current.fallbackBanner;
                } else if (current.bannerImage && e.target.src !== current.bannerImage) {
                  e.target.src = current.bannerImage;
                }
              }}
            />
            <div className="hero-vignette" />
          </div>

          <div className="container hero-content">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hero-text"
            >
              <div className="hero-header-meta">
                <div className="hero-badge">Trending #{currentIndex + 1}</div>
                <div className="hero-genres">
                  {current.genres?.slice(0, 3).map(genre => (
                    <span key={genre} className="hero-genre-pill">{genre}</span>
                  ))}
                </div>
              </div>

              <h2 className="hero-title">{current.title.english || current.title.romaji}</h2>

              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => onPlay(current)}>
                  <Play size={20} fill="currentColor" />
                  <span>Watch Now</span>
                </button>
                <button className="btn btn-secondary" onClick={() => onPlay(current)}>
                  <Info size={20} />
                  <span>Details</span>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="hero-controls">
        <div className="hero-dots">
          {trendingAnime.map((_, i) => (
            <div
              key={i}
              className={`hero-dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
