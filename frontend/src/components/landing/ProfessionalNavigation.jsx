import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Milk, 
  Menu, 
  X
} from 'lucide-react';
import GradientButton from '../ui/GradientButton';

const ProfessionalNavigation = ({ stats, loading }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-white/10 backdrop-blur-md border-b border-white/20'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-3">
          {/* Logo and Animated Dairy Name */}
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-xl bg-orange-300">
              <Milk className="w-8 h-8 text-white" />
            </div>
            <div className="relative text-center px-3">
              {/* Decorative stars */}
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-orange-400 text-lg select-none">✦</span>
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-yellow-400 text-lg select-none">✦</span>

              {/* Shimmer Dairy Name */}
              <h1
                className="text-2xl lg:text-3xl font-black tracking-wide shimmer-text"
                style={{
                  background: 'linear-gradient(90deg, #c2410c, #f97316, #fbbf24, #f97316, #c2410c)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 3s linear infinite',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                }}
              >
                {stats?.dairyInfo?.name || "Dairy Management System"}
              </h1>

              {/* Animated Location */}
              {stats?.dairyInfo?.location && (
                <p className="text-xs mt-0.5 text-orange-600 font-medium tracking-wide text-center animate-fade-in">
                  📍 {stats.dairyInfo.location}
                </p>
              )}

              {/* Decorative underline */}
              <div className="mt-0.5 h-0.5 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
          </div>

          {/* Mobile Menu Button - hidden since no nav items */}
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className={`py-4 space-y-2 border-t ${
            isScrolled ? 'border-gray-200' : 'border-white/20'
          }`}>
            {/* Mobile Action Buttons */}
            <div className="px-4 space-y-3">
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
        isScrolled ? 'opacity-100' : 'opacity-0'
      }`} style={{
        width: `${Math.min((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100, 100)}%`
      }} />

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default ProfessionalNavigation;