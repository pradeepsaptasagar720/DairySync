import { useState, useEffect } from 'react';

const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '', 
  className = '',
  decimals = 0,
  separator = ','
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [end, isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isVisible]);

  const formatNumber = (num) => {
    const fixed = num.toFixed(decimals);
    return fixed.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  };

  return (
    <span 
      id={`counter-${end}`}
      className={`font-bold tabular-nums ${className}`}
    >
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

export default AnimatedCounter;