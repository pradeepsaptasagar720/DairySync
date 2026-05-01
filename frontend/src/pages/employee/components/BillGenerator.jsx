import { Filter, FileText } from "lucide-react";

export default function BillGenerator({ filters, onFiltersChange, onGenerateBill, loading, farmers }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({ ...prev, [key]: value }));
  };

  const handleFarmerSelect = (farmerId) => {
    const farmer = farmers.find(f => f._id === farmerId);
    onFiltersChange(prev => ({
      ...prev,
      selectedFarmerId: farmerId,
      farmerMobile: farmer?.mobile || ''
    }));
  };

  const handleMobileSearch = (mobile) => {
    if (mobile.length === 10) {
      const farmer = farmers.find(f => f.mobile === mobile);
      if (farmer) {
        onFiltersChange(prev => ({
          ...prev,
          selectedFarmerId: farmer._id
        }));
      }
    }
  };

  const handleGenerate = () => {
    onGenerateBill(filters);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Filter className="text-green-600" size={24} />
        Bill Generation
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Date From
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Date To
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            👥 Farmer Selection
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filters.farmerType}
            onChange={(e) => handleFilterChange('farmerType', e.target.value)}
          >
            <option value="all">All Farmers</option>
            <option value="specific">Specific Farmer</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText size={16} />
                Generate Bill
              </>
            )}
          </button>
        </div>
      </div>

      {/* Specific Farmer Selection */}
      {filters.farmerType === 'specific' && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📱 Farmer Mobile Number
              </label>
              <input
                type="text"
                placeholder="Enter 10-digit mobile number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={filters.farmerMobile}
                onChange={(e) => {
                  const mobile = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleFilterChange('farmerMobile', mobile);
                  handleMobileSearch(mobile);
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👨‍🌾 Or Select Farmer
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={filters.selectedFarmerId}
                onChange={(e) => handleFarmerSelect(e.target.value)}
              >
                <option value="">Select a farmer...</option>
                {farmers.map(farmer => (
                  <option key={farmer._id} value={farmer._id}>
                    {farmer.username} - {farmer.uniqueId} - {farmer.mobile}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}