import React, { createContext, useContext, useState } from 'react';
import Toast from './Toast';
import { Bell } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const addToast = (message, type = 'info', duration = 4000, animeData = null) => {
    const id = Date.now();
    const toast = { id, message, type, duration, animeData };
    setToasts(prev => [...prev, toast]);
    
    // Auto-collapse when there are many notifications
    if (toasts.length >= 3) {
      setIsExpanded(false);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showCount = isExpanded ? toasts.length : Math.min(toasts.length, 2);
  const hasOverflow = toasts.length > showCount;

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className={`toast-container ${!isExpanded ? 'collapsed' : ''}`} data-count={toasts.length}>
        {toasts.length > 0 && toasts.length > 2 && (
          <div className="toast-notification-badge">
            <Bell size={14} />
            <span>{toasts.length}</span>
            <button 
              className="toast-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        )}
        
        <div className="toast-list">
          {toasts.slice(0, isExpanded ? undefined : 2).map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              animeData={toast.animeData}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
        
        {hasOverflow && !isExpanded && (
          <div className="toast-overflow-indicator">
            +{toasts.length - 2} more
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;