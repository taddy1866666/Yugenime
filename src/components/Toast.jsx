import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, AlertTriangle, Zap, Clock } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 4000, onClose, animeData = null }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const durationInSeconds = duration / 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Update countdown timer if it's an anime notification with airingAt
  useEffect(() => {
    if (!animeData?.airingAt) return;

    const updateCountdown = () => {
      const now = Date.now();
      const airingTime = animeData.airingAt * 1000;
      const diff = airingTime - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown(`In ${hours}h ${minutes}m`);
      } else {
        setCountdown('Now airing!');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [animeData]);

  const icons = {
    success: Check,
    error: X,
    warning: AlertTriangle,
    info: Info,
    premium: Zap
  };

  const Icon = icons[type];

  // Anime card notification design
  if (animeData) {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="toast toast-anime"
            onClick={animeData.onClick}
            style={{ cursor: animeData.onClick ? 'pointer' : 'default' }}
            layout
          >
            {animeData.coverImage && (
              <div className="toast-anime-image">
                <img src={animeData.coverImage} alt={animeData.title} />
              </div>
            )}
            
            <div className="toast-anime-content">
              <h3 className="toast-anime-title">{animeData.title}</h3>
              
              <div className="toast-anime-meta">
                {countdown && (
                  <div className="toast-anime-countdown">
                    <Clock size={14} />
                    <span>{countdown}</span>
                  </div>
                )}
                
                {animeData.episode && (
                  <div className="toast-anime-episode">Episode {animeData.episode}</div>
                )}
              </div>

              {animeData.genres && animeData.genres.length > 0 && (
                <div className="toast-anime-genres">
                  {animeData.genres.slice(0, 2).map(genre => (
                    <span key={genre} className="toast-anime-genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="toast-close"
              onClick={() => setIsVisible(false)}
            >
              <X size={16} />
            </button>

            <div 
              className="toast-progress"
              style={{ animation: `progress ${durationInSeconds}s linear forwards` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Regular toast notification
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className={`toast toast-${type}`}
          layout
        >
          <div className="toast-icon">
            <Icon size={20} />
          </div>
          <div className="toast-content">
            <div className="toast-message">{message}</div>
          </div>
          <button 
            className="toast-close"
            onClick={() => setIsVisible(false)}
          >
            <X size={16} />
          </button>
          <div 
            className="toast-progress"
            style={{ animation: `progress ${durationInSeconds}s linear forwards` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;