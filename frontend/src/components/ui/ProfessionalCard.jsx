import { forwardRef } from 'react';

const ProfessionalCard = forwardRef(({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  gradient = false,
  glassmorphism = false,
  ...props 
}, ref) => {
  const baseClasses = 'rounded-xl transition-all duration-300 ease-in-out';
  
  const variants = {
    default: 'bg-white shadow-lg border border-gray-100',
    elevated: 'bg-white shadow-xl border border-gray-100',
    gradient: 'bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-100',
    glassmorphism: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-xl',
    dark: 'bg-gray-900 shadow-xl border border-gray-800 text-white'
  };
  
  const hoverEffects = hover ? 'hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02]' : '';
  const gradientOverlay = gradient ? 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-purple-500/5 before:pointer-events-none' : '';
  const glassEffect = glassmorphism ? 'backdrop-blur-md bg-white/10' : '';
  
  const combinedClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${hoverEffects}
    ${gradientOverlay}
    ${glassEffect}
    ${className}
  `.trim();

  return (
    <div ref={ref} className={combinedClasses} {...props}>
      {children}
    </div>
  );
});

ProfessionalCard.displayName = 'ProfessionalCard';

export default ProfessionalCard;