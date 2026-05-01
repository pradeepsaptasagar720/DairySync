import { useState, useEffect } from "react";
import api from "../../services/api";
import { Save } from "lucide-react";

export default function MilkRateChart() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateChartName, setRateChartName] = useState("");
  
  // Dynamic rows for cow and buffalo milk (without SNF)
  const [cowRows, setCowRows] = useState([
    { id: 1, fat: "", rate: "" }
  ]);
  
  const [buffaloRows, setBuffaloRows] = useState([
    { id: 1, fat: "", rate: "" }
  ]);

  // Range Apply section - separate for cow and buffalo
  const [rangeData, setRangeData] = useState({
    cow: {
      startFat: "",
      endFat: "",
      baseRate: "",
      difference: ""
    },
    buffalo: {
      startFat: "",
      endFat: "",
      baseRate: "",
      difference: ""
    }
  });

  const [savedCharts, setSavedCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSavedCharts();
  }, []);

  const fetchSavedCharts = async () => {
    try {
      const response = await api.get("/api/admin/rate-charts");
      setSavedCharts(response.data.data || []);
    } catch (err) {
      console.error("Error fetching saved charts:", err);
    }
  };

  // Dynamic row management
  const addCowRow = () => {
    const newId = Math.max(...cowRows.map(r => r.id)) + 1;
    setCowRows([...cowRows, { id: newId, fat: "", rate: "" }]);
  };

  const addBuffaloRow = () => {
    const newId = Math.max(...buffaloRows.map(r => r.id)) + 1;
    setBuffaloRows([...buffaloRows, { id: newId, fat: "", rate: "" }]);
  };

  const removeCowRow = (id) => {
    if (cowRows.length > 1) {
      setCowRows(cowRows.filter(row => row.id !== id));
    }
  };

  const removeBuffaloRow = (id) => {
    if (buffaloRows.length > 1) {
      setBuffaloRows(buffaloRows.filter(row => row.id !== id));
    }
  };

  const updateCowRow = (id, field, value) => {
    setCowRows(cowRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const updateBuffaloRow = (id, field, value) => {
    setBuffaloRows(buffaloRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Auto-Fill Calculation Engine (Based on image structure)
  const validateRangeParameters = (params) => {
    const errors = [];
    
    if (!params.startFat || !params.endFat || !params.baseRate || !params.difference) {
      errors.push("Start fat, end fat, base rate, and difference amount are required");
    }
    
    if (parseFloat(params.startFat) >= parseFloat(params.endFat)) {
      errors.push("Start fat must be less than end fat");
    }
    
    if (parseFloat(params.baseRate) <= 0) {
      errors.push("Base rate must be positive");
    }

    if (parseFloat(params.difference) <= 0) {
      errors.push("Difference amount must be positive");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const calculateOptimalRowCount = (startFat, endFat) => {
    const fatRange = parseFloat(endFat) - parseFloat(startFat);
    // Calculate rows based on exact 0.1% fat increments
    const optimalRows = Math.round(fatRange / 0.1) + 1;
    return Math.min(Math.max(optimalRows, 1), 100); // Allow up to 100 rows
  };

  const generateFatProgression = (startFat, endFat, rowCount) => {
    const start = parseFloat(startFat);
    
    return Array.from({ length: rowCount }, (_, index) => {
      const fatValue = start + (index * 0.1); // Increment by exactly 0.1% per row
      return parseFloat(fatValue.toFixed(1));
    });
  };

  const calculateRateProgression = (baseRate, differenceAmount, fatProgression, startFat) => {
    const base = parseFloat(baseRate);
    const diff = parseFloat(differenceAmount);
    const startFatValue = parseFloat(startFat);
    
    return fatProgression.map((fat) => {
      // Calculate how many 0.1% increments from start fat
      const fatIncrements = Math.round((fat - startFatValue) / 0.1);
      // Formula: rate per fat = base rate + (difference amount * fat increments)
      // This gives us the rate per 0.1% fat increment
      const rate = base + (diff * fatIncrements);
      return parseFloat(rate.toFixed(2));
    });
  };

  const generateCalculatedRows = (params, milkType) => {
    const validation = validateRangeParameters(params);
    if (!validation.isValid) {
      setError(validation.errors.join('. '));
      return [];
    }

    const rowCount = calculateOptimalRowCount(params.startFat, params.endFat);
    const fatProgression = generateFatProgression(params.startFat, params.endFat, rowCount);
    
    // Use the EXACT same base rate for both cow and buffalo - NO AUTOMATIC LINKING
    const baseRate = parseFloat(params.baseRate);
    
    const rateProgression = calculateRateProgression(baseRate, params.difference, fatProgression, params.startFat);

    return Array.from({ length: rowCount }, (_, index) => ({
      id: index + 1,
      fat: fatProgression[index],
      rate: rateProgression[index]
    }));
  };


  // Update preview when range parameters change (no auto-fill)
  useEffect(() => {
    // No automatic preview needed with separate controls
  }, [rangeData]);

  // Enhanced Apply range to cow milk with manual trigger
  const applyToCow = () => {
    const cowParams = rangeData.cow;
    if (!cowParams.baseRate || !cowParams.startFat || !cowParams.endFat || !cowParams.difference) {
      setError("Please fill in all cow milk values: start fat, end fat, base rate, and difference amount");
      return;
    }

    try {
      const newCowRows = generateCalculatedRows(cowParams, 'cow');
      setCowRows(newCowRows);
      setSuccess(`Generated ${newCowRows.length} cow milk rate rows successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to calculate cow milk rates: " + err.message);
    }
  };

  // Enhanced Apply range to buffalo milk with manual trigger - COMPLETELY INDEPENDENT
  const applyToBuffalo = () => {
    const buffaloParams = rangeData.buffalo;
    if (!buffaloParams.baseRate || !buffaloParams.startFat || !buffaloParams.endFat || !buffaloParams.difference) {
      setError("Please fill in all buffalo milk values: start fat, end fat, base rate, and difference amount");
      return;
    }

    try {
      // Use buffalo's own parameters - completely independent from cow
      const newBuffaloRows = generateCalculatedRows(buffaloParams, 'buffalo');
      setBuffaloRows(newBuffaloRows);
      setSuccess(`Generated ${newBuffaloRows.length} buffalo milk rate rows successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to calculate buffalo milk rates: " + err.message);
    }
  };

  // Save rate chart - saves both cow and buffalo rates under single name
  const saveRateChart = async () => {
    if (!rateChartName.trim()) {
      setError("Please enter a rate chart name");
      return;
    }

    // Validate that we have rates for both milk types
    const hasCowRates = cowRows.some(row => row.fat && row.rate);
    const hasBuffaloRates = buffaloRows.some(row => row.fat && row.rate);

    if (!hasCowRates && !hasBuffaloRates) {
      setError("Please add rates for at least one milk type (Cow or Buffalo)");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        date: selectedDate,
        name: rateChartName,
        cowRates: cowRows,
        buffaloRates: buffaloRows,
        rangeSettings: rangeData,
        description: `Rate chart containing ${hasCowRates ? 'Cow' : ''}${hasCowRates && hasBuffaloRates ? ' and ' : ''}${hasBuffaloRates ? 'Buffalo' : ''} milk rates`
      };

      await api.post("/api/admin/rate-chart", payload);
      setSuccess(`Rate chart "${rateChartName}" saved successfully with both cow and buffalo rates!`);
      fetchSavedCharts();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to save rate chart");
    } finally {
      setLoading(false);
    }
  };

  // Load saved chart
  const loadChart = async (chartId) => {
    try {
      const response = await api.get(`/api/admin/rate-chart/${chartId}`);
      const chart = response.data.data;
      
      setRateChartName(chart.name);
      setCowRows(chart.cowRates || [{ id: 1, fat: "", rate: "" }]);
      setBuffaloRows(chart.buffaloRates || [{ id: 1, fat: "", rate: "" }]);
      
      // Handle both old and new range settings format
      if (chart.rangeSettings) {
        if (chart.rangeSettings.cow && chart.rangeSettings.buffalo) {
          // New separate format
          setRangeData(chart.rangeSettings);
        } else {
          // Old shared format - convert to separate
          setRangeData({
            cow: {
              startFat: chart.rangeSettings.startFat || "",
              endFat: chart.rangeSettings.endFat || "",
              baseRate: chart.rangeSettings.baseRate || "",
              difference: chart.rangeSettings.difference || ""
            },
            buffalo: {
              startFat: chart.rangeSettings.startFat || "",
              endFat: chart.rangeSettings.endFat || "",
              baseRate: chart.rangeSettings.baseRate || "",
              difference: chart.rangeSettings.difference || ""
            }
          });
        }
      } else {
        // Default empty structure
        setRangeData({
          cow: { startFat: "", endFat: "", baseRate: "", difference: "" },
          buffalo: { startFat: "", endFat: "", baseRate: "", difference: "" }
        });
      }
      
      setSuccess("Rate chart loaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to load rate chart");
    }
  };

  // Delete saved chart
  const deleteChart = async (chartId) => {
    if (!confirm("Are you sure you want to delete this rate chart?")) {
      return;
    }

    try {
      await api.delete(`/api/admin/rate-chart/${chartId}`);
      fetchSavedCharts();
      setSuccess("Rate chart deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete rate chart");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Advanced Rate Chart - Milk Dairy</h1>
          
          {/* Workflow Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 How to Create Rate Charts</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Step 1:</strong> Set up cow milk rates (manually or using auto-fill)</p>
              <p><strong>Step 2:</strong> Set up buffalo milk rates (completely independent)</p>
              <p><strong>Step 3:</strong> Enter a rate chart name and click "Save Complete Rate Chart"</p>
              <p><strong>Result:</strong> Both cow and buffalo rates saved under one name! 🎯</p>
            </div>
          </div>
          
          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {/* Date and Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date:</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate Chart Name:</label>
              <input
                type="text"
                placeholder="Name for this rate chart"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={rateChartName}
                onChange={(e) => setRateChartName(e.target.value)}
              />
            </div>
          </div>

          {/* Main Rate Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Cow Milk Section */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-blue-700 text-center">Cow (ಹಸು)</h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center border-r">Fat</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center border-r">Rate</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cowRows.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-2 py-2 border-r">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={row.fat}
                            onChange={(e) => updateCowRow(row.id, 'fat', e.target.value)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={row.rate}
                            onChange={(e) => updateCowRow(row.id, 'rate', e.target.value)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => removeCowRow(row.id)}
                            className="text-red-600 hover:text-red-800 text-lg font-bold"
                            disabled={cowRows.length === 1}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-2 bg-gray-50 border-t">
                  <button
                    onClick={addCowRow}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
                  >
                    + Add Row
                  </button>
                </div>
              </div>
            </div>

            {/* Buffalo Milk Section */}
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-orange-700 text-center">Buffalo (ಎಮ್ಮೆ)</h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center border-r">Fat</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center border-r">Rate</th>
                      <th className="px-3 py-2 text-xs font-medium text-gray-700 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buffaloRows.map((row) => (
                      <tr key={row.id} className="border-t">
                        <td className="px-2 py-2 border-r">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={row.fat}
                            onChange={(e) => updateBuffaloRow(row.id, 'fat', e.target.value)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="px-2 py-2 border-r">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-orange-500"
                            value={row.rate}
                            onChange={(e) => updateBuffaloRow(row.id, 'rate', e.target.value)}
                            placeholder="0.0"
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => removeBuffaloRow(row.id)}
                            className="text-red-600 hover:text-red-800 text-lg font-bold"
                            disabled={buffaloRows.length === 1}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-2 bg-gray-50 border-t">
                  <button
                    onClick={addBuffaloRow}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
                  >
                    + Add Row
                  </button>
                </div>
              </div>
            </div>

            {/* Range Apply Section - Separate Controls for Cow and Buffalo */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-purple-700 text-center">Auto-Fill Range</h3>
              
              <div className="space-y-4">
                {/* Cow Range Settings */}
                <div className="bg-blue-50 p-3 rounded border">
                  <h4 className="text-sm font-semibold text-blue-700 mb-3">🐄 Cow Milk Settings</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Fat (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="3.5"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={rangeData.cow?.startFat || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            cow: { ...rangeData.cow, startFat: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Fat (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="5.0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={rangeData.cow?.endFat || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            cow: { ...rangeData.cow, endFat: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Base Rate (₹)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="50.00"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={rangeData.cow?.baseRate || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            cow: { ...rangeData.cow, baseRate: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Difference (₹)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="2.00"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={rangeData.cow?.difference || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            cow: { ...rangeData.cow, difference: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={applyToCow}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      Generate Cow Rates
                    </button>
                  </div>
                </div>

                {/* Buffalo Range Settings */}
                <div className="bg-orange-50 p-3 rounded border">
                  <h4 className="text-sm font-semibold text-orange-700 mb-3">🐃 Buffalo Milk Settings</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Fat (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="6.0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          value={rangeData.buffalo?.startFat || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            buffalo: { ...rangeData.buffalo, startFat: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Fat (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="8.0"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          value={rangeData.buffalo?.endFat || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            buffalo: { ...rangeData.buffalo, endFat: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Base Rate (₹)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="65.00"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          value={rangeData.buffalo?.baseRate || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            buffalo: { ...rangeData.buffalo, baseRate: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Difference (₹)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="3.00"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          value={rangeData.buffalo?.difference || ''}
                          onChange={(e) => setRangeData({
                            ...rangeData, 
                            buffalo: { ...rangeData.buffalo, difference: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={applyToBuffalo}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      Generate Buffalo Rates
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-600 text-center bg-gray-100 p-2 rounded">
                  ✅ Cow and Buffalo rates are now completely independent<br/>
                  Set different base rates and parameters for each milk type
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mb-6">
            <button
              onClick={saveRateChart}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? "Saving..." : "Save Complete Rate Chart (Cow + Buffalo)"}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              💡 This will save both cow and buffalo rates under a single rate chart name
            </p>
          </div>

          {/* Bottom Section - Saved Rate Charts */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Saved Rate Charts</h3>
            
            {savedCharts.length === 0 ? (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded border">
                No saved rate charts available
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-r">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-r">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 border-r">Contains</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedCharts.map((chart) => {
                      const hasCow = chart.cowRates && chart.cowRates.length > 0 && chart.cowRates.some(r => r.fat && r.rate);
                      const hasBuffalo = chart.buffaloRates && chart.buffaloRates.length > 0 && chart.buffaloRates.some(r => r.fat && r.rate);
                      
                      return (
                        <tr key={chart._id} className="border-t">
                          <td className="px-4 py-2 text-sm border-r">
                            {new Date(chart.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm border-r font-medium">{chart.name}</td>
                          <td className="px-4 py-2 text-sm border-r">
                            <div className="flex gap-1">
                              {hasCow && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  🐄 Cow ({chart.cowRates.filter(r => r.fat && r.rate).length})
                                </span>
                              )}
                              {hasBuffalo && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  🐃 Buffalo ({chart.buffaloRates.filter(r => r.fat && r.rate).length})
                                </span>
                              )}
                              {!hasCow && !hasBuffalo && (
                                <span className="text-gray-500 text-xs">Empty</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => loadChart(chart._id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => deleteChart(chart._id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}