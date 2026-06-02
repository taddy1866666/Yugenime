import React from 'react';
import { motion } from 'framer-motion';
import './Skeleton.css';

/**
 * SkeletonCard — Mimics the AnimeCard shape while loading
 */
export const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-card-image">
      <div className="skeleton-card-badge" />
    </div>
    <div className="skeleton-card-info">
      <div className="skeleton-card-title" />
      <div className="skeleton-card-title-short" />
      <div className="skeleton-card-rating">
        <div className="skeleton-card-star" />
        <div className="skeleton-card-score" />
      </div>
    </div>
  </div>
);

/**
 * SkeletonGrid — Renders a grid of SkeletonCards
 * @param {number} count - Number of skeleton cards to render
 */
export const SkeletonGrid = ({ count = 10 }) => (
  <div className="anime-grid">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05, duration: 0.4 }}
      >
        <SkeletonCard />
      </motion.div>
    ))}
  </div>
);

/**
 * SkeletonHero — Mimics the Hero banner while loading
 */
export const SkeletonHero = () => (
  <div className="skeleton-hero">
    <div className="skeleton-hero-gradient" />
    <div className="skeleton-hero-content">
      <div className="skeleton-hero-badge" />
      <div className="skeleton-hero-title" />
      <div className="skeleton-hero-title-sm" />
      <div className="skeleton-hero-buttons">
        <div className="skeleton-hero-btn" />
        <div className="skeleton-hero-btn" />
      </div>
    </div>
    <div className="skeleton-hero-dots">
      <div className="skeleton-hero-dot" />
      <div className="skeleton-hero-dot" />
      <div className="skeleton-hero-dot" />
      <div className="skeleton-hero-dot" />
      <div className="skeleton-hero-dot" />
    </div>
  </div>
);

/**
 * SkeletonScheduleCard — Mimics the AiringSchedule card while loading
 */
export const SkeletonScheduleCard = () => (
  <div className="schedule-card" style={{ pointerEvents: 'none' }}>
    <div className="card-image" style={{ background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.8s ease-in-out infinite'
      }} />
    </div>
    <div className="card-content" style={{ flex: 1, gap: '10px' }}>
      <div style={{ width: '80%', height: '16px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ width: '55%', height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <div style={{ width: '70px', height: '24px', borderRadius: '50px', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ width: '50px', height: '24px', borderRadius: '50px', background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <div style={{ width: '50px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ width: '40px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }} />
      </div>
    </div>
  </div>
);

/**
 * SkeletonScheduleGrid — Renders a grid of SkeletonScheduleCards
 * @param {number} count - Number of skeleton cards to render
 */
export const SkeletonScheduleGrid = ({ count = 6 }) => (
  <div className="schedule-grid">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.06, duration: 0.4 }}
      >
        <SkeletonScheduleCard />
      </motion.div>
    ))}
  </div>
);

/**
 * SkeletonSection — Full section skeleton (header + grid)
 * @param {number} count - Number of skeleton cards
 */
export const SkeletonSection = ({ count = 10 }) => (
  <section>
    <div className="skeleton-section-header">
      <div className="skeleton-section-title" />
      <div className="skeleton-section-btn" />
    </div>
    <SkeletonGrid count={count} />
  </section>
);

export default {
  SkeletonCard,
  SkeletonGrid,
  SkeletonHero,
  SkeletonScheduleCard,
  SkeletonScheduleGrid,
  SkeletonSection,
};
