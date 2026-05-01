const LoadingSkeleton = ({ 
  className = '', 
  variant = 'default',
  lines = 1,
  width = 'full',
  height = 'auto'
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded';
  
  const variants = {
    default: 'bg-gray-200',
    card: 'bg-gray-200 rounded-xl',
    text: 'bg-gray-200 rounded-md h-4',
    title: 'bg-gray-200 rounded-md h-6',
    avatar: 'bg-gray-200 rounded-full',
    button: 'bg-gray-200 rounded-xl h-12'
  };
  
  const widths = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/4': 'w-1/4',
    '1/3': 'w-1/3',
    '2/3': 'w-2/3'
  };
  
  const heights = {
    auto: '',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
    '2xl': 'h-16'
  };
  
  const combinedClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${widths[width]}
    ${heights[height]}
    ${className}
  `.trim();

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={`${combinedClasses} ${index === lines - 1 ? 'w-3/4' : ''}`}
          />
        ))}
      </div>
    );
  }

  return <div className={combinedClasses} />;
};

export default LoadingSkeleton;