import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Info, AlertTriangle, Zap } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const durationInSeconds = duration / 1000;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: Check,
    error: X,
    warning: AlertTriangle,
    info: Info,
    premium: Zap
  };

  const Icon = icons[type];

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