import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  ripple = true,
  glow = false,
  magnetic = true,
  onClick,
  className = '',
  ...props
}) => {
  const [ripples, setRipples] = useState([]);
  const [magneticPosition, setMagneticPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    if (disabled || loading) return;

    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const newRipple = {
        x,
        y,
        size,
        id: Date.now()
      };

      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(e);
  };

  const handleMouseMove = (e) => {
    if (!magnetic || disabled || loading) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;
    
    setMagneticPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setMagneticPosition({ x: 0, y: 0 });
  };

  const buttonClasses = [
    'btn-advanced',
    `btn-${variant}`,
    `btn-${size}`,
    glow && 'btn-glow',
    disabled && 'btn-disabled',
    loading && 'btn-loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      ref={buttonRef}
      className={buttonClasses}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      animate={{
        x: magneticPosition.x,
        y: magneticPosition.y
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.5
      }}
      {...props}
    >
      <div className="btn-content">
        {loading && (
          <motion.div
            className="btn-loader"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 size={16} />
          </motion.div>
        )}
        
        {Icon && iconPosition === 'left' && !loading && (
          <Icon size={16} className="btn-icon btn-icon-left" />
        )}
        
        <span className="btn-text">{children}</span>
        
        {Icon && iconPosition === 'right' && !loading && (
          <Icon size={16} className="btn-icon btn-icon-right" />
        )}
      </div>

      {ripple && (
        <div className="btn-ripples">
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              className="btn-ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size
              }}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </div>
      )}

      <div className="btn-shine" />
    </motion.button>
  );
};

export default Button;