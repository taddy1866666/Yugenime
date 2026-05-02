import React from 'react';
import { motion } from 'framer-motion';
import './Loading.css';

const Loading = ({ 
  type = 'spinner', 
  size = 'medium', 
  text = 'Loading...', 
  fullscreen = false,
  color = 'primary' 
}) => {
  const renderSpinner = () => (
    <div className={`loading-spinner ${size} ${color}`}>
      <motion.div
        className="spinner-ring"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="spinner-ring-2"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );

  const renderDots = () => (
    <div className={`loading-dots ${size}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="dot"
          animate={{
            y: [-10, 10, -10],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`loading-pulse ${size}`}>
      <motion.div
        className="pulse-circle"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 0.3, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );

  const renderWave = () => (
    <div className={`loading-wave ${size}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="wave-bar"
          animate={{
            scaleY: [0.4, 1, 0.4],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      case 'wave': return renderWave();
      default: return renderSpinner();
    }
  };

  const content = (
    <div className="loading-content">
      {renderLoader()}
      {text && (
        <motion.p
          className="loading-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <motion.div
        className="loading-fullscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="loading-backdrop" />
        {content}
      </motion.div>
    );
  }

  return content;
};

export default Loading;