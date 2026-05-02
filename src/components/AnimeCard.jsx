import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, ListTodo, CheckCircle2, MoreVertical } from 'lucide-react';
import './AnimeCard.css';

function AnimeCard({ title, image, rating, episode, synopsis, genres, onClick, onGenreClick, isProgress, onAddToWatchlist, currentStatus, animeData }) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStatusClick = (e, status) => {
    e.stopPropagation();
    if (onAddToWatchlist) {
      onAddToWatchlist(animeData, status);
    }
    setShowDropdown(false);
  };
  return (
    <motion.div 
      className="anime-card"
      whileHover={window.innerWidth > 768 ? { y: -8 } : {}}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={onClick}
    >
      <div className="card-image-wrapper">
        <img src={image} alt={title} className="card-image" loading="lazy" />
        
        {!isProgress && onAddToWatchlist && (
          <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <MoreVertical size={20} />
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                    }}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 999
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25 
                    }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      background: 'rgba(0, 0, 0, 0.95)',
                      backdropFilter: 'blur(30px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '14px',
                      padding: '8px',
                      minWidth: '200px',
                      maxWidth: 'calc(100vw - 40px)',
                      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
                      pointerEvents: 'none'
                    }} />
                    
                    <motion.button
                      whileHover={{ 
                        x: 4, 
                        backgroundColor: 'rgba(var(--accent-rgb), 0.15)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={(e) => handleStatusClick(e, 'watching')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        background: currentStatus === 'watching' ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(var(--accent-rgb), 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(var(--accent-rgb), 0.3)',
                        flexShrink: 0
                      }}>
                        <Clock size={20} color="var(--accent)" strokeWidth={2.5} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap' }}>Watching</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>Currently watching</div>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ 
                        x: 4, 
                        backgroundColor: 'rgba(255, 165, 0, 0.15)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={(e) => handleStatusClick(e, 'plan_to_watch')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        background: currentStatus === 'plan_to_watch' ? 'rgba(255, 165, 0, 0.15)' : 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(255, 165, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255, 165, 0, 0.3)',
                        flexShrink: 0
                      }}>
                        <ListTodo size={20} color="#ffa500" strokeWidth={2.5} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap' }}>Plan to Watch</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>Save for later</div>
                      </div>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ 
                        x: 4, 
                        backgroundColor: 'rgba(16, 185, 129, 0.15)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={(e) => handleStatusClick(e, 'finished')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        background: currentStatus === 'finished' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        flexShrink: 0
                      }}>
                        <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.4, whiteSpace: 'nowrap' }}>Completed</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>Already finished</div>
                      </div>
                    </motion.button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
        
        <div className="card-overlay">
          <div className="overlay-content">
            {genres && genres.length > 0 && (
              <div className="card-genres">
                {genres.map(genre => (
                  <span 
                    key={genre} 
                    className="genre-pill-mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenreClick?.(genre);
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
            <p className="card-synopsis">
              {synopsis ? synopsis.replace(/<[^>]*>?/gm, '').slice(0, 140) + '...' : 'No description available.'}
            </p>
          </div>
        </div>
        <div className="card-badge">
          {episode}
        </div>
      </div>
      
      <div className="card-info">
        <h3 className="card-title">{title}</h3>
        {(!isProgress || rating !== "N/A") && (
          <div className="card-meta">
            <div className="card-rating">
              <Star size={14} fill="currentColor" />
              <span>{rating}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AnimeCard;
