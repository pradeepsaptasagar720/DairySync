import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Milk, 
  Truck, 
  UserCheck, 
  BarChart3, 
  Shield,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  Clock,
  Award,
  Zap,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sun,
  Sunset
} from 'lucide-react';
import ProfessionalCard from '../ui/ProfessionalCard';
import GradientButton from '../ui/GradientButton';
import AnimatedCounter from '../ui/AnimatedCounter';
import LoadingSkeleton from '../ui/LoadingSkeleton';

const RoleShowcase = ({ stats, loading }) => {
  const [activeRole, setActiveRole] = useState('farmer');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const roles = [
    {
      id: 'farmer',
      title: 'Farmers',
      icon: <Milk className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      description: 'Streamline milk collection and animal management',
      features: [
        'Digital milk entry with instant calculations',
        'Animal health tracking and management',
        'Real-time payment tracking',
        'Performance analytics and reports',
        'Mobile-friendly interface',
        'Automated rate calculations'
      ],
      stats: {
        total: stats?.users?.farmers?.total || 0,
        active: stats?.users?.farmers?.active || 0,
        growth: '+12%'
      },
      benefits: [
        { icon: <TrendingUp className="w-5 h-5" />, text: 'Increase income by 25%' },
        { icon: <Clock className="w-5 h-5" />, text: 'Save 2 hours daily' },
        { icon: <Shield className="w-5 h-5" />, text: '100% accurate payments' }
      ]
    },
    {
      id: 'buyer',
      title: 'Buyers',
      icon: <Truck className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Manage orders and home delivery efficiently',
      features: [
        'Easy online milk ordering system',
        'Flexible delivery scheduling',
        'Real-time order tracking',
        'Digital payment integration',
        'Order history and analytics',
        'Customer support integration'
      ],
      stats: {
        total: stats?.users?.buyers?.total || 0,
        active: stats?.users?.buyers?.active || 0,
        growth: '+18%'
      },
      benefits: [
        { icon: <Zap className="w-5 h-5" />, text: 'Order in under 2 minutes' },
        { icon: <Truck className="w-5 h-5" />, text: 'Quick And Fast Delivery' },
        { icon: <Award className="w-5 h-5" />, text: 'Premium quality guarantee' }
      ]
    },
    {
      id: 'employee',
      title: 'Employees',
      icon: <UserCheck className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      description: 'Efficient operations and customer management',
      features: [
        'Streamlined milk collection process',
        'Customer relationship management',
        'Delivery route optimization',
        'Performance tracking dashboard',
        'Real-time communication tools',
        'Automated reporting system'
      ],
      stats: {
        total: stats?.users?.employees?.total || 0,
        active: stats?.users?.employees?.active || 0,
        growth: '+8%'
      },
      benefits: [
        { icon: <BarChart3 className="w-5 h-5" />, text: 'Track performance metrics' },
        { icon: <Users className="w-5 h-5" />, text: 'Manage 100+ customers' },
        { icon: <CheckCircle className="w-5 h-5" />, text: '99% accuracy rate' }
      ]
    }
  ];

  const activeRoleData = roles.find(role => role.id === activeRole);

  const RoleCard = ({ role, isActive, onClick }) => (
    <ProfessionalCard
      variant={isActive ? "solid" : "glassmorphism"}
      className={`p-4 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
        isActive 
          ? `bg-gradient-to-r ${role.color} text-white shadow-2xl` 
          : 'hover:bg-white/10 border-white/20'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${
          isActive 
            ? 'bg-white/20' 
            : `bg-gradient-to-r ${role.color} text-white`
        }`}>
          {role.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{role.title}</h3>
          <div className="text-xs text-white/70">
            {loading ? (
              <LoadingSkeleton variant="text" className="h-3 w-16 bg-white/20" />
            ) : (
              <AnimatedCounter end={role.stats.total} suffix=" users" />
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <span className="text-xs font-medium text-green-400">{role.stats.growth}</span>
          <ChevronRight className="w-3 h-3 text-white/50" />
        </div>
      </div>
    </ProfessionalCard>
  );

  return (
    <>
    <section id="roles" className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium text-white/90 mb-4 border border-white/20">
            <Users className="w-4 h-4 mr-2" />
            Role-Based Solutions
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Built for Every
            <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Stakeholder
            </span>
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Tailored experiences for farmers, buyers, employees, and administrators.
            Each role gets exactly what they need to succeed.
          </p>
        </div>

        {/* Main Content: Left column (roles + stats) + Right panel (details) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left Column: Role Cards + Live Stats */}
          <div className={`lg:col-span-2 flex flex-col gap-4 transform transition-all duration-1000 delay-200 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}>
            {/* Role Selection Cards */}
            <div className="space-y-2">
              {roles.map((role, index) => (
                <div key={role.id} style={{ transitionDelay: `${index * 0.08}s` }}>
                  <RoleCard
                    role={role}
                    isActive={activeRole === role.id}
                    onClick={() => setActiveRole(role.id)}
                  />
                </div>
              ))}
            </div>


          </div>

          {/* Right Panel: Active Role Details */}
          <div className={`lg:col-span-3 transform transition-all duration-1000 delay-400 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <ProfessionalCard variant="glassmorphism" className="p-6 h-full">
              {/* Role Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${activeRoleData.color} text-white shadow-lg`}>
                  {activeRoleData.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{activeRoleData.title}</h3>
                  <p className="text-white/70">{activeRoleData.description}</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xl font-bold text-white mb-0.5">
                    {loading ? (
                      <LoadingSkeleton variant="text" className="h-5 w-10 mx-auto bg-white/20" />
                    ) : (
                      <AnimatedCounter end={activeRoleData.stats.total} />
                    )}
                  </div>
                  <div className="text-white/60 text-xs">Total Users</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xl font-bold text-white mb-0.5">
                    {loading ? (
                      <LoadingSkeleton variant="text" className="h-5 w-10 mx-auto bg-white/20" />
                    ) : (
                      <AnimatedCounter end={activeRoleData.stats.active} />
                    )}
                  </div>
                  <div className="text-white/60 text-xs">Active Users</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xl font-bold text-green-400 mb-0.5">{activeRoleData.stats.growth}</div>
                  <div className="text-white/60 text-xs">Growth Rate</div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="mb-6">
                <h4 className="text-base font-bold text-white mb-3">Key Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeRoleData.features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-2 p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors duration-200"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-white/90 text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h4 className="text-base font-bold text-white mb-3">Key Benefits</h4>
                <div className="space-y-2">
                  {activeRoleData.benefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${activeRoleData.color} text-white flex-shrink-0`}>
                        {benefit.icon}
                      </div>
                      <span className="text-white text-sm font-medium">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <GradientButton
                  variant="primary"
                  size="md"
                  icon={ChevronRight}
                  iconPosition="right"
                  className="flex-1"
                  as={Link}
                  to="/register"
                >
                  Get Started as {activeRoleData.title.slice(0, -1)}
                </GradientButton>
              </div>
            </ProfessionalCard>
          </div>

        </div>
      </div>
    </section>

    {/* ── ABOUT / COMPANY INFO SECTION ── */}
    <section id="about" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full uppercase tracking-widest mb-3">
            About Us
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            {stats?.dairyInfo?.name || 'Our Dairy'}
          </h2>
          <div className="mt-2 w-16 h-1 bg-orange-500 mx-auto rounded-full" />
        </div>

        {/* Two-column: About + Address */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">

          {/* Left — About */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">About Our Dairy</h3>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4 text-sm">
              {stats?.dairyInfo?.name
                ? `${stats.dairyInfo.name} is a trusted dairy management platform connecting farmers, buyers, and employees in one unified digital system. We ensure transparent milk collection, fair payments, and reliable home delivery — all in real time.`
                : 'A trusted dairy management platform connecting farmers, buyers, and employees in one unified digital system.'
              }
            </p>
            <p className="text-gray-600 leading-relaxed text-sm mb-6">
              Our technology-first approach eliminates manual errors, speeds up payments, and gives every stakeholder complete visibility into the dairy supply chain.
            </p>

            {/* Contact details */}
            <div className="space-y-3">
              {stats?.dairyInfo?.contact && (
                <a href={`tel:${stats.dairyInfo.contact}`} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Phone</p>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-green-600 transition-colors">+91 {stats.dairyInfo.contact}</p>
                  </div>
                </a>
              )}
              {stats?.dairyInfo?.email && (
                <a href={`mailto:${stats.dairyInfo.email}`} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{stats.dairyInfo.email}</p>
                  </div>
                </a>
              )}
              {stats?.dairyInfo?.morningHours && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <Sun className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Morning Session</p>
                    <p className="text-sm font-semibold text-gray-800">{stats.dairyInfo.morningHours}</p>
                  </div>
                </div>
              )}
              {stats?.dairyInfo?.eveningHours && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Sunset className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Evening Session</p>
                    <p className="text-sm font-semibold text-gray-800">{stats.dairyInfo.eveningHours}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Address card */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Our Address</h3>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              {stats?.dairyInfo ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Dairy Name</p>
                    <p className="text-base font-bold text-gray-900">{stats.dairyInfo.name}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Full Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {stats.dairyInfo.fullAddress || stats.dairyInfo.location}
                      </p>
                    </div>
                  </div>
                  {stats.dairyInfo.contact && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Contact</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-sm text-gray-700">+91 {stats.dairyInfo.contact}</p>
                      </div>
                    </div>
                  )}
                  {stats.dairyInfo.email && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{stats.dairyInfo.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Address information not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { value: stats?.users?.farmers?.total, label: 'Registered Farmers', icon: '🌾', bg: 'bg-green-50', text: 'text-green-700' },
            { value: stats?.users?.buyers?.total, label: 'Happy Buyers', icon: '🛒', bg: 'bg-blue-50', text: 'text-blue-700' },
            { value: stats?.users?.employees?.total, label: 'Active Employees', icon: '👷', bg: 'bg-purple-50', text: 'text-purple-700' },
          ].map((item, i) => {
            const n = item.value || 0;
            const display = n >= 10000000 ? (n / 10000000).toFixed(1) + 'Cr'
              : n >= 100000 ? (n / 100000).toFixed(1) + 'L'
              : n >= 1000 ? (n / 1000).toFixed(1) + 'k'
              : n.toString();
            return (
              <div key={i} className={`${item.bg} rounded-2xl p-5 text-center border border-gray-100`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className={`text-2xl font-black ${item.text} mb-1`}>
                  {loading ? <span className="text-gray-300">—</span> : display}
                </div>
                <div className="text-gray-500 text-xs font-medium">{item.label}</div>
              </div>
            );
          })}
        </div>

        {/* Rating Section */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-orange-100">
          <div className="text-center mb-6">
            <span className="inline-block px-4 py-1.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full uppercase tracking-widest mb-3">
              Customer Satisfaction
            </span>
            <h3 className="text-2xl font-bold text-gray-900">What Our Users Say</h3>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-10">
            {/* Big rating number */}
            <div className="text-center">
              <div className="text-7xl font-black text-orange-500 leading-none">
                {loading ? '...' : (stats?.efficiency?.userSatisfaction || 0).toFixed(1)}
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {[1,2,3,4,5].map(i => {
                  const rating = stats?.efficiency?.userSatisfaction || 0;
                  return (
                    <span key={i} className={`text-2xl ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  );
                })}
              </div>
              <p className="text-gray-500 text-sm mt-1">out of 5</p>
            </div>

            {/* Satisfaction gauge */}
            <div className="text-center">
              <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="url(#ratingGrad)" strokeWidth="3"
                    strokeDasharray={`${((stats?.efficiency?.userSatisfaction || 0) / 5) * 100} 100`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="ratingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-xl font-bold text-gray-800">
                  {loading ? '...' : `${Math.round(((stats?.efficiency?.userSatisfaction || 0) / 5) * 100)}%`}
                </span>
              </div>
              <p className="text-gray-600 text-sm font-medium mt-2">Satisfaction Score</p>
            </div>

            {/* Efficiency metrics */}
            <div className="space-y-3 min-w-[180px]">
              {[
                { label: 'Collection Efficiency', value: stats?.efficiency?.collectionEfficiency },
                { label: 'Delivery Efficiency', value: stats?.efficiency?.deliveryEfficiency },
                { label: 'System Utilization', value: stats?.efficiency?.systemUtilization },
              ].map((metric, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{metric.label}</span>
                    <span className="font-semibold text-gray-700">
                      {loading ? '—' : `${Math.round(metric.value || 0)}%`}
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-700"
                      style={{ width: loading ? '0%' : `${Math.min(Math.round(metric.value || 0), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
    </>
  );
};

export default RoleShowcase;
