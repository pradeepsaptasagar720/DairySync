import { useState, useEffect } from 'react';
import { 
  Search,
  Grid3X3,
  List,
  Milk,
  Truck,
  Users,
  BarChart3,
  Settings,
  FileText,
  Database,
  ChevronRight,
  Star
} from 'lucide-react';
import ProfessionalCard from '../ui/ProfessionalCard';
import GradientButton from '../ui/GradientButton';
import LoadingSkeleton from '../ui/LoadingSkeleton';

const ModulesDirectory = ({ stats, loading }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const tabs = [
    { id: 'all', label: 'All', count: 8 },
    { id: 'farmer', label: 'Farmer', count: 3 },
    { id: 'buyer', label: 'Buyer', count: 1 },
    { id: 'employee', label: 'Employee', count: 1 },
    { id: 'admin', label: 'Admin', count: 3 }
  ];

  const modules = [
    {
      id: 'milk-collection',
      title: 'Milk Collection',
      description: 'Digital milk entry with automatic calculations',
      category: 'farmer',
      icon: <Milk className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      adoption: stats?.features?.milkCollection?.adoption || 85,
      rating: 4.8,
      status: 'active'
    },
    {
      id: 'animal-management',
      title: 'Animal Management',
      description: 'Health tracking and breeding management',
      category: 'farmer',
      icon: <Database className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      adoption: stats?.features?.animalManagement?.adoption || 78,
      rating: 4.6,
      status: 'active'
    },
    {
      id: 'home-delivery',
      title: 'Home Delivery',
      description: 'Order management and delivery tracking',
      category: 'buyer',
      icon: <Truck className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      adoption: stats?.features?.homeDelivery?.adoption || 82,
      rating: 4.7,
      status: 'active'
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Role-based access control system',
      category: 'admin',
      icon: <Users className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600',
      adoption: stats?.features?.userManagement?.adoption || 100,
      rating: 4.9,
      status: 'active'
    },
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: 'Business intelligence and reporting',
      category: 'admin',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-red-500 to-red-600',
      adoption: stats?.features?.reportGeneration?.adoption || 75,
      rating: 4.5,
      status: 'active'
    },
    {
      id: 'rate-management',
      title: 'Rate Management',
      description: 'Dynamic pricing and rate configuration',
      category: 'admin',
      icon: <Settings className="w-6 h-6" />,
      color: 'from-indigo-500 to-indigo-600',
      adoption: stats?.features?.rateManagement?.adoption || 95,
      rating: 4.6,
      status: 'active'
    },
    {
      id: 'loan-management',
      title: 'Loan Management',
      description: 'Complete loan lifecycle management',
      category: 'farmer',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-yellow-500 to-yellow-600',
      adoption: stats?.features?.loanManagement?.adoption || 45,
      rating: 4.2,
      status: 'active'
    },
    {
      id: 'feed-management',
      title: 'Feed Management',
      description: 'Inventory management for supplies',
      category: 'employee',
      icon: <Database className="w-6 h-6" />,
      color: 'from-pink-500 to-pink-600',
      adoption: stats?.features?.feedManagement?.adoption || 60,
      rating: 4.1,
      status: 'active'
    }
  ];

  const filteredModules = modules.filter(module => {
    const matchesTab = activeTab === 'all' || module.category === activeTab || module.category === 'all';
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const ModuleCard = ({ module, index }) => (
    <ProfessionalCard 
      variant="glassmorphism" 
      className={`p-4 h-full hover:scale-105 transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      {/* Module Header */}
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${module.color} text-white shadow-lg`}>
          {module.icon}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          module.status === 'active' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {module.status}
        </div>
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-bold text-white mb-2">{module.title}</h3>
      <p className="text-white/70 text-sm mb-4 leading-relaxed">
        {module.description}
      </p>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm text-white/70">{module.rating}</span>
        </div>
        <div className="text-sm text-white/70">
          {loading ? (
            <LoadingSkeleton variant="text" className="h-4 w-8 bg-white/20" />
          ) : (
            `${module.adoption}%`
          )}
        </div>
      </div>

      {/* CTA */}
      <GradientButton
        variant="secondary"
        size="sm"
        icon={ChevronRight}
        iconPosition="right"
        className="w-full"
      >
        Explore
      </GradientButton>
    </ProfessionalCard>
  );

  const ModuleListItem = ({ module, index }) => (
    <ProfessionalCard 
      variant="glassmorphism" 
      className={`p-4 hover:bg-white/10 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${module.color} text-white`}>
            {module.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{module.title}</h3>
            <p className="text-sm text-white/70">{module.description}</p>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-white/70">{module.rating}</span>
              </div>
              <div className="text-sm text-white/70">{module.adoption}% adoption</div>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            module.status === 'active' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {module.status}
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </div>
      </div>
    </ProfessionalCard>
  );

  return (
    <section id="modules" className="py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-40 left-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center mb-12 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium text-white/90 mb-6 border border-white/20">
            <Grid3X3 className="w-4 h-4 mr-2" />
            System Modules
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Feature
            <span className="block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Directory
            </span>
          </h2>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Explore our comprehensive suite of modules for dairy management operations.
          </p>
        </div>

        {/* Controls */}
        <div className={`flex flex-col lg:flex-row justify-between items-center mb-8 space-y-4 lg:space-y-0 transform transition-all duration-1000 delay-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search and View Controls */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
              />
            </div>
            
            <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-1 border border-white/20">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/70'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/70'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modules Display */}
        <div className={`transform transition-all duration-1000 delay-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredModules.map((module, index) => (
                <ModuleCard key={module.id} module={module} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredModules.map((module, index) => (
                <ModuleListItem key={module.id} module={module} index={index} />
              ))}
            </div>
          )}
        </div>

        {/* No Results */}
        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/50 text-lg mb-4">No modules found</div>
            <p className="text-white/30">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className={`mt-16 grid grid-cols-1 md:grid-cols-4 gap-6 transform transition-all duration-1000 delay-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <ProfessionalCard variant="glassmorphism" className="p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{modules.length}</div>
            <div className="text-white/70">Total Modules</div>
          </ProfessionalCard>
          <ProfessionalCard variant="glassmorphism" className="p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {modules.filter(m => m.status === 'active').length}
            </div>
            <div className="text-white/70">Active Modules</div>
          </ProfessionalCard>
          <ProfessionalCard variant="glassmorphism" className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {modules.filter(m => m.status === 'beta').length}
            </div>
            <div className="text-white/70">Beta Modules</div>
          </ProfessionalCard>
          <ProfessionalCard variant="glassmorphism" className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {Math.round(modules.reduce((sum, m) => sum + m.adoption, 0) / modules.length)}%
            </div>
            <div className="text-white/70">Avg Adoption</div>
          </ProfessionalCard>
        </div>
      </div>
    </section>
  );
};

export default ModulesDirectory;