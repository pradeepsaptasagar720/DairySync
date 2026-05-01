import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Save, ArrowLeft, Milk, Edit3, Check, X, Clock, History } from "lucide-react";

export default function MilkSellingRate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingSection, setEditingSection] = useState(null);
  const [ratesSaved, setRatesSaved] = useState(false);
  const [lastSavedDate, setLastSavedDate] = useState("");
  const [rateHistory, setRateHistory] = useState([]);

  // Selling rates for online buyers
  const [sellingRates, setSellingRates] = useState({
    cowMilk: {
      rate: "",
      description: "Fresh cow milk with high nutritional value"
    },
    buffaloMilk: {
      rate: "",
      description: "Rich buffalo milk with higher fat content"
    }
  });

  // Temporary editing values
  const [tempRates, setTempRates] = useState({});
  const [tempAllRates, setTempAllRates] = useState({});

  useEffect(() => {
    fetchSellingRates();
    fetchRateHistory();
  }, []);

  const fetchSellingRates = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/selling-rates");
      if (response.data.data) {
        // Ensure the data has the expected structure
        const data = response.data.data;
        const safeData = {
          cowMilk: {
            rate: data.cowMilk?.rate || "0.00",
            description: data.cowMilk?.description || "Fresh cow milk with high nutritional value"
          },
          buffaloMilk: {
            rate: data.buffaloMilk?.rate || "0.00", 
            description: data.buffaloMilk?.description || "Rich buffalo milk with higher fat content"
          }
        };
        
        setSellingRates(safeData);
        // Check if all rates are set to determine if rates have been saved
        const allRatesSet = safeData.cowMilk.rate !== "0.00" && 
                           safeData.buffaloMilk.rate !== "0.00";
        setRatesSaved(allRatesSet);
      }
    } catch (err) {
      console.error("Error fetching selling rates:", err);
      // If no rates exist, keep default values
    } finally {
      setLoading(false);
    }
  };

  const fetchRateHistory = async () => {
    try {
      const response = await api.get("/api/admin/selling-rates-history");
      if (response.data.data) {
        setRateHistory(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching rate history:", err);
    }
  };

  const startEditing = (section) => {
    if (section === 'all') {
      setEditingSection('all');
      setTempAllRates({
        cowMilk: {
          rate: sellingRates.cowMilk?.rate || "0.00",
          description: sellingRates.cowMilk?.description || "Fresh cow milk with high nutritional value"
        },
        buffaloMilk: {
          rate: sellingRates.buffaloMilk?.rate || "0.00",
          description: sellingRates.buffaloMilk?.description || "Rich buffalo milk with higher fat content"
        }
      });
    } else {
      setEditingSection(section);
      setTempRates({
        rate: sellingRates[section]?.rate || "0.00",
        description: sellingRates[section]?.description || ""
      });
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setTempRates({});
    setTempAllRates({});
  };

  const saveSection = async (section) => {
    if (!tempRates.rate || parseFloat(tempRates.rate) <= 0) {
      setError("Please enter a valid rate");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const updatedRates = {
        ...sellingRates,
        [section]: {
          rate: parseFloat(tempRates.rate).toFixed(2),
          description: tempRates.description || sellingRates[section].description
        }
      };

      const response = await api.post("/api/admin/selling-rates", updatedRates);
      
      setSellingRates(updatedRates);
      setEditingSection(null);
      setTempRates({});
      
      // Check if this was a full update that created history
      if (response.data.data.isFullUpdate) {
        setRatesSaved(true);
        setLastSavedDate(response.data.data.savedAt);
        await fetchRateHistory();
        setSuccess(`${getSectionTitle(section)} rate saved successfully on ${response.data.data.savedAt}!`);
      } else {
        setSuccess(`${getSectionTitle(section)} rate updated successfully!`);
      }
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to update selling rate");
    } finally {
      setLoading(false);
    }
  };

  const saveAllActiveRates = async () => {
    // Validate all rates
    const sections = ['cowMilk', 'buffaloMilk'];
    for (const section of sections) {
      if (!tempAllRates[section].rate || parseFloat(tempAllRates[section].rate) <= 0) {
        setError(`Please set a valid rate for ${getSectionTitle(section)}`);
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const updatedRates = {
        cowMilk: {
          rate: parseFloat(tempAllRates.cowMilk.rate).toFixed(2),
          description: tempAllRates.cowMilk.description
        },
        buffaloMilk: {
          rate: parseFloat(tempAllRates.buffaloMilk.rate).toFixed(2),
          description: tempAllRates.buffaloMilk.description
        }
      };

      const response = await api.post("/api/admin/selling-rates", updatedRates);
      
      setSellingRates(updatedRates);
      setEditingSection(null);
      setTempAllRates({});
      
      if (response.data.data.isFullUpdate) {
        setRatesSaved(true);
        setLastSavedDate(response.data.data.savedAt);
        setSuccess(`All selling rates updated successfully on ${response.data.data.savedAt}!`);
        
        // Refresh rate history
        await fetchRateHistory();
        
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setSuccess("Selling rates updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to update selling rates");
    } finally {
      setLoading(false);
    }
  };
  const saveAllRates = async () => {
    // Validate all rates
    const sections = ['cowMilk', 'buffaloMilk'];
    for (const section of sections) {
      if (!sellingRates[section].rate || parseFloat(sellingRates[section].rate) <= 0) {
        setError(`Please set a valid rate for ${getSectionTitle(section)}`);
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/api/admin/selling-rates", sellingRates);
      
      if (response.data.data.isFullUpdate) {
        setRatesSaved(true);
        setLastSavedDate(response.data.data.savedAt);
        setSuccess(`All selling rates saved successfully on ${response.data.data.savedAt}!`);
        
        // Refresh rate history
        await fetchRateHistory();
        
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setSuccess("Selling rates updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to save selling rates");
    } finally {
      setLoading(false);
    }
  };

  const getSectionTitle = (section) => {
    const titles = {
      cowMilk: "Cow Milk",
      buffaloMilk: "Buffalo Milk"
    };
    return titles[section];
  };

  const getSectionIcon = (section) => {
    return <Milk className="w-8 h-8" />;
  };

  const getSectionColor = (section) => {
    const colors = {
      cowMilk: "from-blue-500 to-blue-600",
      buffaloMilk: "from-orange-500 to-orange-600"
    };
    return colors[section];
  };

  const getSectionBorderColor = (section) => {
    const colors = {
      cowMilk: "border-blue-200",
      buffaloMilk: "border-orange-200"
    };
    return colors[section];
  };

  const renderRateSection = (section, title) => {
    const isEditing = editingSection === section;
    const rate = sellingRates[section] || { rate: "0.00", description: "" };
    const hasActiveRate = rate.rate && rate.rate !== "0.00";

    // Don't render the section if it has an active rate (it will be shown in Active Rates section)
    if (hasActiveRate && !isEditing) {
      return null;
    }

    return (
      <div key={section} className={`bg-white rounded-xl shadow-lg border-2 ${getSectionBorderColor(section)} hover:shadow-xl transition-all duration-200`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${getSectionColor(section)} text-white p-6 rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getSectionIcon(section)}
              <h3 className="text-xl font-bold">{title}</h3>
            </div>
            {!isEditing && !hasActiveRate && (
              <button
                onClick={() => startEditing(section)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate per Liter (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                  value={tempRates.rate}
                  onChange={(e) => setTempRates({...tempRates, rate: e.target.value})}
                  placeholder="Enter rate"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  value={tempRates.description}
                  onChange={(e) => setTempRates({...tempRates, description: e.target.value})}
                  placeholder="Enter description"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => saveSection(section)}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  ₹{rate.rate ? parseFloat(rate.rate).toFixed(2) : "0.00"}
                </div>
                <div className="text-lg text-gray-600">per Liter</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 text-center">{rate.description}</p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => startEditing(section)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  Set Rate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && !editingSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading selling rates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/rate-charts')}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Milk Selling Rate for Online Buyers</h1>
                <p className="text-gray-600 mt-1">Set and manage selling rates for different types of milk</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Milk className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">Online Buyer Rates</h3>
                <p className="text-blue-700 text-sm">
                  These rates will be displayed to online buyers when they place orders. 
                  Make sure to set competitive and accurate pricing for each milk type.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Sections - Only show sections that don't have active rates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {renderRateSection('cowMilk', 'Cow Milk Rate')}
          {renderRateSection('buffaloMilk', 'Buffalo Milk Rate')}
        </div>

        {/* Save All Button - Only show if rates haven't been saved yet */}
        {!editingSection && !ratesSaved && (
          <div className="text-center mb-8">
            <button
              onClick={saveAllRates}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-3 mx-auto disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              <Save className="w-5 h-5" />
              {loading ? "Saving..." : "Save All Rates"}
            </button>
          </div>
        )}

        {/* Active Rates Section - Show rates that have been set */}
        {(sellingRates.cowMilk.rate !== "0.00" || sellingRates.buffaloMilk.rate !== "0.00") && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-6 h-6 text-green-600" />
                Active Rates
              </h3>
              <div className="flex items-center gap-4">
                {lastSavedDate && !editingSection && (
                  <span className="text-sm text-gray-500">
                    Last saved: {lastSavedDate}
                  </span>
                )}
                {editingSection === 'all' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={saveAllActiveRates}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {loading ? "Saving..." : "Save All"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditing('all')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit & Save
                  </button>
                )}
              </div>
            </div>
            
            {editingSection === 'all' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cow Milk Editing */}
                {sellingRates.cowMilk.rate !== "0.00" && (
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                    <div className="text-sm opacity-90 mb-2">Cow Milk</div>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 text-gray-800 rounded border focus:outline-none focus:ring-2 focus:ring-blue-300"
                        value={tempAllRates.cowMilk?.rate || ''}
                        onChange={(e) => setTempAllRates({
                          ...tempAllRates,
                          cowMilk: { ...tempAllRates.cowMilk, rate: e.target.value }
                        })}
                        placeholder="Rate per liter"
                      />
                      <textarea
                        className="w-full px-3 py-2 text-gray-800 rounded border focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm resize-none"
                        rows="2"
                        value={tempAllRates.cowMilk?.description || ''}
                        onChange={(e) => setTempAllRates({
                          ...tempAllRates,
                          cowMilk: { ...tempAllRates.cowMilk, description: e.target.value }
                        })}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                )}
                
                {/* Buffalo Milk Editing */}
                {sellingRates.buffaloMilk.rate !== "0.00" && (
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                    <div className="text-sm opacity-90 mb-2">Buffalo Milk</div>
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 text-gray-800 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300"
                        value={tempAllRates.buffaloMilk?.rate || ''}
                        onChange={(e) => setTempAllRates({
                          ...tempAllRates,
                          buffaloMilk: { ...tempAllRates.buffaloMilk, rate: e.target.value }
                        })}
                        placeholder="Rate per liter"
                      />
                      <textarea
                        className="w-full px-3 py-2 text-gray-800 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none"
                        rows="2"
                        value={tempAllRates.buffaloMilk?.description || ''}
                        onChange={(e) => setTempAllRates({
                          ...tempAllRates,
                          buffaloMilk: { ...tempAllRates.buffaloMilk, description: e.target.value }
                        })}
                        placeholder="Description"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sellingRates.cowMilk.rate !== "0.00" && (
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                    <div className="text-sm opacity-90">Cow Milk</div>
                    <div className="text-2xl font-bold">
                      ₹{parseFloat(sellingRates.cowMilk.rate).toFixed(2)}/L
                    </div>
                    <div className="text-xs opacity-75 mt-1">{sellingRates.cowMilk.description}</div>
                  </div>
                )}
                {sellingRates.buffaloMilk.rate !== "0.00" && (
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                    <div className="text-sm opacity-90">Buffalo Milk</div>
                    <div className="text-2xl font-bold">
                      ₹{parseFloat(sellingRates.buffaloMilk.rate).toFixed(2)}/L
                    </div>
                    <div className="text-xs opacity-75 mt-1">{sellingRates.buffaloMilk.description}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Previous Rates Section - Show rate history */}
        {rateHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <History className="w-5 h-5" />
              Previous Rates ({rateHistory.length})
            </h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {rateHistory.map((historyItem, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Rate Set #{rateHistory.length - index}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(historyItem.savedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">Cow</div>
                      <div className="font-semibold">₹{historyItem.cowMilk?.rate ? parseFloat(historyItem.cowMilk.rate).toFixed(2) : '0.00'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-medium">Buffalo</div>
                      <div className="font-semibold">₹{historyItem.buffaloMilk?.rate ? parseFloat(historyItem.buffaloMilk.rate).toFixed(2) : '0.00'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}