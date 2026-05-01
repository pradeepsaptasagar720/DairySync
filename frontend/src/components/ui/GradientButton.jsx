import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const GradientButton = forwardRef(({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  as: Component = 'button',
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-500',
    secondary: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl focus:ring-green-500',
    accent: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl focus:ring-purple-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white bg-transparent shadow-md hover:shadow-lg focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 bg-transparent shadow-none hover:shadow-md focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };
  
  const isDisabled = disabled || loading;
  
  const combinedClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.trim();

  // Don't pass disabled prop to non-button components
  const componentProps = Component === 'button' 
    ? { disabled: isDisabled, ...props }
    : props;

  return (
    <Component 
      ref={ref} 
      className={combinedClasses} 
      {...componentProps}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-5 h-5 mr-2" />
      )}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-5 h-5 ml-2" />
      )}
    </Component>
  );
});

GradientButton.displayName = 'GradientButton';

export default GradientButton;