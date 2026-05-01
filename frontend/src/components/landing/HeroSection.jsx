import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  CheckCircle, 
  Shield,
  Zap,
  Award,
  Sparkles
} from 'lucide-react';
import GradientButton from '../ui/GradientButton';

const HeroSection = ({ stats, loading }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const highlights = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Process milk collection in under 30 seconds"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "100% Secure",
      description: "Bank-grade security for all transactions"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Award Winning",
      description: "Trusted by 500+ dairy cooperatives"
    }
  ];

  return (
    <section id="home" className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: 'calc(100vh - 64px)', marginTop: '64px' }}>
      {/* Background Image - starts after navbar */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("/images/dairy-background.jpg?v=2")`,
            backgroundSize: 'cover',
            backgroundAttachment: 'local',
            imageRendering: 'auto',
            willChange: 'auto'
          }}
        />
        

      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-10">
          {/* Top Row - Content only (full width) */}
          <div className={`text-white transform transition-all duration-1000 relative z-10 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`} style={{ 
            textShadow: '3px 3px 6px rgba(0,0,0,0.9), 1px 1px 3px rgba(0,0,0,0.8)' 
          }}>
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium text-white/90 mb-6 border border-white/20">
              <Sparkles className="w-4 h-4 mr-2" />
              #1 Dairy Management Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="block drop-shadow-lg">Modern Dairy</span>
              <span className="block text-white drop-shadow-lg">
                Management
              </span>
              <span className="block text-4xl lg:text-5xl text-white/95 drop-shadow-lg">Made Simple</span>       
            </h1>

            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-white/95 mb-8 leading-relaxed max-w-2xl drop-shadow-lg">
              Transform your dairy operations with our comprehensive digital solution. 
              From milk collection to home delivery, streamline every aspect of your business.
            </p>

            {/* Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {highlights.map((highlight, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 transform transition-all duration-500 hover:bg-white/10 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 0.2}s` }}
                >
                  <div className="text-green-400">{highlight.icon}</div>
                  <div>
                    <div className="font-semibold text-sm">{highlight.title}</div>
                    <div className="text-xs text-white/70">{highlight.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 relative z-20">
              <GradientButton
                variant="primary"
                size="lg"
                icon={ArrowRight}
                iconPosition="right"
                className="shadow-2xl hover:shadow-3xl transform hover:scale-105"
                as={Link}
                to="/register"
                style={{ pointerEvents: 'auto' }}
              >
                Get Started
              </GradientButton>
              
              <GradientButton
                variant="secondary"
                size="lg"
                icon={Play}
                iconPosition="left"
                className="shadow-2xl hover:shadow-3xl transform hover:scale-105"
                as={Link}
                to="/login"
                style={{ pointerEvents: 'auto' }}
              >
                Login
              </GradientButton>
            </div>

            {/* User Stats Bar */}
            <div className="flex flex-wrap items-center gap-6 mb-8">
              {(() => {
                const fmt = (n) => {
                  if (!n) return '0';
                  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
                  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
                  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
                  return String(n);
                };
                const items = [
                  { value: loading ? '...' : fmt(stats?.users?.farmers?.total), label: 'Farmers', color: 'text-green-400' },
                  { value: loading ? '...' : fmt(stats?.users?.buyers?.total), label: 'Buyers', color: 'text-blue-400' },
                  { value: loading ? '...' : fmt(stats?.users?.employees?.total), label: 'Employees', color: 'text-purple-400' },
                  { value: '99.9%', label: 'Uptime', color: 'text-yellow-400' },
                ];
                return items.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                    <span className="text-xs text-white/70 font-medium">{stat.label}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-sm text-white/70">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No Setup Fees</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>

          {/* Bottom Row - Live Stats removed - now shown in RoleShowcase */}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        
        @keyframes milkDrop {
          0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
          50% { transform: translateY(10px) scale(1); opacity: 1; }
          100% { transform: translateY(30px) scale(0.9); opacity: 0; }
        }
        
        @keyframes dairyFloat {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-8px) translateX(3px) rotate(0.5deg); }
          50% { transform: translateY(-5px) translateX(-2px) rotate(-0.5deg); }
          75% { transform: translateY(-12px) translateX(1px) rotate(0.3deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-milk-drop {
          animation: milkDrop 4s ease-in-out infinite;
        }
        
        .animate-dairy-float {
          animation: dairyFloat 8s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;