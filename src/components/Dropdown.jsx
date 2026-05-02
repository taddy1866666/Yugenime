import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ListTodo, CheckCircle2 } from 'lucide-react';
import './Dropdown.css';

const STATUS_OPTIONS = [
  {
    value: 'watching',
    label: 'Watching',
    description: 'Currently watching',
    icon: Clock,
    color: 'var(--accent)',
    bgColor: 'rgba(var(--accent-rgb), 0.15)',
    iconBg: 'rgba(var(--accent-rgb), 0.2)',
    borderColor: 'rgba(var(--accent-rgb), 0.3)'
  },
  {
    value: 'plan_to_watch',
    label: 'Plan to Watch',
    description: 'Save for later',
    icon: ListTodo,
    color: '#ffa500',
    bgColor: 'rgba(255, 165, 0, 0.15)',
    iconBg: 'rgba(255, 165, 0, 0.2)',
    borderColor: 'rgba(255, 165, 0, 0.3)'
  },
  {
    value: 'finished',
    label: 'Completed',
    description: 'Already finished',
    icon: CheckCircle2,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    iconBg: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  }
];

function Dropdown({ currentStatus, onStatusChange, triggerButton }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value) => {
    onStatusChange(value);
    setIsOpen(false);
  };

  const currentOption = STATUS_OPTIONS.find(opt => opt.value === currentStatus);

  return (
    <div className="dropdown-container">
      <div onClick={() => setIsOpen(!isOpen)}>
        {triggerButton}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="dropdown-backdrop"
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
              className="dropdown-menu"
            >
              <div className="dropdown-gradient-overlay" />
              
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = currentStatus === option.value;
                
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ 
                      x: 4
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => handleSelect(option.value)}
                    className={`dropdown-option ${isActive ? 'active' : ''}`}
                    style={{
                      background: isActive ? option.bgColor : 'transparent',
                      border: isActive ? `1px solid ${option.borderColor}` : '1px solid transparent'
                    }}
                  >
                    <div 
                      className="dropdown-icon-box"
                      style={{
                        background: option.iconBg,
                        border: `1px solid ${option.borderColor}`
                      }}
                    >
                      <Icon size={22} color={option.color} strokeWidth={2.5} />
                    </div>
                    <div className="dropdown-text">
                      <div className="dropdown-label">{option.label}</div>
                      <div className="dropdown-description">{option.description}</div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dropdown;
