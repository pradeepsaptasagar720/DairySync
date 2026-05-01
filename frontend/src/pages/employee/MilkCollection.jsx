import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  Milk, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Save, 
  Printer, 
  Download,
  ArrowLeft,
  Building2,
  Edit,
  Trash2
} from "lucide-react";

export default function MilkCollection() {
  const navigate = useNavigate();
  
  // Page Header & Session State
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [selectedSession, setSelectedSession] = useState('Morning');
  const [dairyName, setDairyName] = useState('');
  const [dairyInfo, setDairyInfo] = useState(null);
  const [isAutoMode, setIsAutoMode] = useState(true); // Auto mode for date/session selection
  
  // Farmer Identification State
  const [farmerInput, setFarmerInput] = useState('');
  const [farmerData, setFarmerData] = useState(null);
  const [farmerLoading, setFarmerLoading] = useState(false);
  
  // Milk Entry State
  const [milkEntry, setMilkEntry] = useState({
    cow: {
      quantity: '',
      fat: '',
      rate: 0,
      amount: 0
    },
    buffalo: {
      quantity: '',
      fat: '',
      rate: 0,
      amount: 0
    },
    totalAmount: 0
  });
  
  // Records and Summary State
  const [milkRecords, setMilkRecords] = useState([]);
  const [sessionSummary, setSessionSummary] = useState({
    cowMilkTotal: 0,
    buffaloMilkTotal: 0,
    averageFat: 0,
    totalAmount: 0,
    entryCount: 0
  });
  const [fullDaySummary, setFullDaySummary] = useState({
    cowMilk: 0,
    buffaloMilk: 0,
    totalLiters: 0,
    totalAmount: 0,
    entryCount: 0,
    farmerCount: 0
  });
  
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSavedEntry, setLastSavedEntry] = useState(null);
  
  // Loading and Error State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);

  // Update time every second and auto-determine session
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      
      // Auto-determine session based on dairy time if in auto mode
      if (isAutoMode && dairyInfo) {
        // Set current date when in auto mode
        const todayDate = now.toISOString().split('T')[0];
        if (currentDate !== todayDate) {
          setCurrentDate(todayDate);
        }
        
        const currentTimeStr = now.toTimeString().slice(0, 5); // HH:MM format
        
        // Use specific morning/evening times if available, otherwise use general opening/closing times
        const morningStart = dairyInfo.morningOpenTime || dairyInfo.openingTime || '06:00';
        const morningEnd = dairyInfo.morningCloseTime || '10:00';
        const eveningStart = dairyInfo.eveningOpenTime || '16:00';
        const eveningEnd = dairyInfo.eveningCloseTime || dairyInfo.closingTime || '18:00';
        
        // Helper function to convert time string to minutes for proper comparison
        const timeToMinutes = (timeStr) => {
          if (!timeStr) return null;
          const [hours, minutes] = timeStr.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) return null;
          return hours * 60 + minutes;
        };
        
        // Helper function to check if current time is within a session (handles midnight crossing)
        const isTimeInRange = (currentMinutes, openTime, closeTime) => {
          const openMinutes = timeToMinutes(openTime);
          const closeMinutes = timeToMinutes(closeTime);
          
          if (openMinutes === null || closeMinutes === null) return false;
          
          // Handle sessions that span across midnight (e.g., 17:00 - 00:00)
          if (openMinutes > closeMinutes) {
            // Session crosses midnight
            return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
          }
          
          // Normal session within same day
          if (openMinutes >= closeMinutes) return false; // Invalid range (same time)
          
          return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
        };
        
        const currentMinutes = timeToMinutes(currentTimeStr);
        
        if (currentMinutes !== null) {
          // Determine session based on current time and dairy schedule
          if (isTimeInRange(currentMinutes, morningStart, morningEnd)) {
            setSelectedSession('Morning');
          } else if (isTimeInRange(currentMinutes, eveningStart, eveningEnd)) {
            setSelectedSession('Evening');
          }
          // If outside dairy hours, keep current session
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoMode, dairyInfo, currentDate]);

  // Handle auto mode toggle
  useEffect(() => {
    if (isAutoMode) {
      // When switching to auto mode, set current date
      const today = new Date().toISOString().split('T')[0];
      setCurrentDate(today);
    }
  }, [isAutoMode]);

  // Fetch dairy info on component mount
  useEffect(() => {
    fetchDairyInfo();
  }, []);

  // Fetch milk records when date or session changes
  useEffect(() => {
    fetchMilkRecords();
    fetchFullDaySummary();
  }, [selectedSession, currentDate]);

  const fetchDairyInfo = async () => {
    try {
      // Fetch dairy info from public endpoint (no authentication required)
      const response = await api.get('/api/public/dairy-info');
      const data = response.data.data;
      
      if (data) {
        setDairyName(data.dairyName || 'Dairy Management System');
        setDairyInfo({
          dairyName: data.dairyName || 'Dairy Management System',
          openingTime: data.openingTime || '06:00',
          closingTime: data.closingTime || '18:00',
          morningOpenTime: data.morningOpenTime || '06:00',
          morningCloseTime: data.morningCloseTime || '10:00',
          eveningOpenTime: data.eveningOpenTime || '16:00',
          eveningCloseTime: data.eveningCloseTime || '19:00',
          currentStatus: 'open'
        });
      } else {
        // Fallback if no dairy info is set by admin
        setDairyName('Dairy Management System');
        setDairyInfo({
          dairyName: 'Dairy Management System',
          openingTime: '06:00',
          closingTime: '18:00',
          morningOpenTime: '06:00',
          morningCloseTime: '10:00',
          eveningOpenTime: '16:00',
          eveningCloseTime: '19:00',
          currentStatus: 'open'
        });
      }
    } catch (err) {
      console.error('Error fetching dairy info from public endpoint:', err);
      // Fallback values if public endpoint fails
      setDairyName('Dairy Management System');
      setDairyInfo({
        dairyName: 'Dairy Management System',
        openingTime: '06:00',
        closingTime: '18:00',
        morningOpenTime: '06:00',
        morningCloseTime: '10:00',
        eveningOpenTime: '16:00',
        eveningCloseTime: '19:00',
        currentStatus: 'open'
      });
    }
  };

  const fetchMilkRecords = async () => {
    try {
      console.log(`[MilkCollection] Fetching records for date: ${currentDate}, session: ${selectedSession}`);
      const response = await api.get(`/api/employee/milk-entries?date=${currentDate}&session=${selectedSession}`);
      const records = response.data.data || [];
      console.log(`[MilkCollection] Received ${records.length} records`);
      setMilkRecords(records);
      calculateSessionSummary(records);
    } catch (err) {
      console.error('[MilkCollection] Error fetching milk records:', err);
    }
  };

  const fetchFullDaySummary = async () => {
    try {
      const response = await api.get('/api/employee/dashboard');
      const dashboardData = response.data.data;
      if (dashboardData && dashboardData.todayMilkCollection) {
        setFullDaySummary(dashboardData.todayMilkCollection);
      }
    } catch (err) {
      console.error('Error fetching full day summary:', err);
    }
  };

  const calculateSessionSummary = (records) => {
    const summary = records.reduce((acc, record) => {
      acc.cowMilkTotal += record.cow?.quantity || 0;
      acc.buffaloMilkTotal += record.buffalo?.quantity || 0;
      acc.totalAmount += record.totalAmount || 0;
      acc.entryCount += 1;
      
      // Calculate average fat (weighted by quantity)
      const cowFat = (record.cow?.quantity || 0) * (record.cow?.fat || 0);
      const buffaloFat = (record.buffalo?.quantity || 0) * (record.buffalo?.fat || 0);
      const totalQuantity = (record.cow?.quantity || 0) + (record.buffalo?.quantity || 0);
      
      if (totalQuantity > 0) {
        acc.totalFatWeight += cowFat + buffaloFat;
        acc.totalQuantityWeight += totalQuantity;
      }
      
      return acc;
    }, {
      cowMilkTotal: 0,
      buffaloMilkTotal: 0,
      totalAmount: 0,
      entryCount: 0,
      totalFatWeight: 0,
      totalQuantityWeight: 0
    });

    summary.averageFat = summary.totalQuantityWeight > 0 
      ? (summary.totalFatWeight / summary.totalQuantityWeight).toFixed(2)
      : 0;

    setSessionSummary(summary);
  };

  const fetchFarmerData = async () => {
    if (!farmerInput.trim()) {
      setError('Please enter Farmer ID or Mobile Number');
      return;
    }

    setFarmerLoading(true);
    setError('');
    
    try {
      let response;
      const input = farmerInput.trim();
      
      // Check if input is a Farmer ID (starts with F and followed by digits)
      if (input.match(/^[F]\d+$/i)) {
        console.log('Fetching farmer by ID:', input.toUpperCase());
        response = await api.get(`/api/employee/farmer/id/${input.toUpperCase()}`);
      } 
      // Check if input is a 10-digit mobile number
      else if (input.match(/^\d{10}$/)) {
        console.log('Fetching farmer by mobile:', input);
        response = await api.get(`/api/employee/farmer/mobile/${input}`);
      } 
      // Invalid format
      else {
        throw new Error('Invalid format. Use Farmer ID (F123456) or 10-digit mobile number');
      }
      
      console.log('Farmer data received:', response.data);
      
      // Check if farmer is approved
      if (response.data.data && !response.data.data.approved) {
        throw new Error('Farmer is not approved yet. Please contact admin.');
      }
      
      const farmer = response.data.data;
      setFarmerData(farmer);
      
      // Check if entry already exists for this farmer in current session
      const isDuplicate = await checkDuplicateEntry(farmer._id, currentDate, selectedSession);
      if (isDuplicate) {
        setError('Already entry recorded for this farmer in current session');
        setShowDuplicatePopup(true);
        return;
      }
      
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching farmer:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Farmer not found';
      setError(errorMessage);
      setFarmerData(null);
    } finally {
      setFarmerLoading(false);
    }
  };

  const fetchRate = async (milkType, fatPercentage) => {
    try {
      const response = await api.get(`/api/employee/rate-chart?milkType=${milkType}&fat=${fatPercentage}`);
      return response.data.data?.rate || 0;
    } catch (err) {
      console.error('Error fetching rate:', err);
      return 0;
    }
  };

  const handleMilkEntryChange = async (milkType, field, value) => {
    const updatedEntry = { ...milkEntry };
    updatedEntry[milkType][field] = value;

    // If fat percentage changed, fetch new rate
    if (field === 'fat' && value) {
      const rate = await fetchRate(milkType, parseFloat(value));
      updatedEntry[milkType].rate = rate;
    }

    // Calculate amount if both quantity and rate are available
    if (updatedEntry[milkType].quantity && updatedEntry[milkType].rate) {
      updatedEntry[milkType].amount = 
        parseFloat(updatedEntry[milkType].quantity) * parseFloat(updatedEntry[milkType].rate);
    }

    // Calculate total amount
    updatedEntry.totalAmount = updatedEntry.cow.amount + updatedEntry.buffalo.amount;

    setMilkEntry(updatedEntry);
  };

  const checkDuplicateEntry = async (farmerId, date, session) => {
    try {
      const response = await api.get(`/api/employee/milk-entry/check-duplicate?farmerId=${farmerId}&date=${date}&session=${session}`);
      return response.data.data.exists;
    } catch (err) {
      console.error('Error checking duplicate entry:', err);
      return false;
    }
  };

  const validateMilkEntry = async () => {
    if (!farmerData) {
      setError('Please fetch farmer data first');
      return false;
    }

    const hasCowEntry = milkEntry.cow.quantity && milkEntry.cow.fat;
    const hasBuffaloEntry = milkEntry.buffalo.quantity && milkEntry.buffalo.fat;

    if (!hasCowEntry && !hasBuffaloEntry) {
      setError('Please enter at least one milk type (Cow or Buffalo)');
      return false;
    }

    // Skip duplicate check when editing existing record
    if (!editingRecordId) {
      // Check for duplicate entry only for new records
      const isDuplicate = await checkDuplicateEntry(farmerData._id, currentDate, selectedSession);
      if (isDuplicate) {
        setError('Already entry recorded');
        return false;
      }
    }

    return true;
  };

  const saveMilkEntry = async () => {
    const isValid = await validateMilkEntry();
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {
      const entryData = {
        date: currentDate,
        session: selectedSession,
        time: currentTime,
        farmerId: farmerData._id,
        farmerUniqueId: farmerData.uniqueId,
        farmerName: farmerData.username,
        cow: milkEntry.cow.quantity ? {
          quantity: parseFloat(milkEntry.cow.quantity),
          fat: parseFloat(milkEntry.cow.fat),
          rate: milkEntry.cow.rate,
          amount: milkEntry.cow.amount
        } : null,
        buffalo: milkEntry.buffalo.quantity ? {
          quantity: parseFloat(milkEntry.buffalo.quantity),
          fat: parseFloat(milkEntry.buffalo.fat),
          rate: milkEntry.buffalo.rate,
          amount: milkEntry.buffalo.amount
        } : null,
        totalAmount: milkEntry.totalAmount
      };

      let response;
      if (editingRecordId) {
        // Update existing record
        response = await api.put(`/api/employee/milk-entry/${editingRecordId}`, entryData);
      } else {
        // Create new record
        response = await api.post('/api/employee/milk-entry', entryData);
      }
      
      const savedEntry = response.data.data;

      // Show success popup first
      setShowSuccessPopup(true);
      
      // Auto-hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);

      // Clear form and editing state
      setMilkEntry({
        cow: { quantity: '', fat: '', rate: 0, amount: 0 },
        buffalo: { quantity: '', fat: '', rate: 0, amount: 0 },
        totalAmount: 0
      });
      setFarmerInput('');
      setFarmerData(null);
      setEditingRecordId(null);

      // Show receipt after a short delay (only for new records)
      if (!editingRecordId) {
        setTimeout(() => {
          setLastSavedEntry(savedEntry);
          setShowReceipt(true);
        }, 1000);
      }

      // Refresh records
      fetchMilkRecords();
      fetchFullDaySummary();

    } catch (err) {
      // Handle duplicate entry error specifically (only for new records)
      if (err.response?.data?.error?.code === 'DUPLICATE_ENTRY' && !editingRecordId) {
        setError('Already entry recorded');
        setShowDuplicatePopup(true);
      } else {
        setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save milk entry');
      }
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };



  const downloadReceiptPDF = () => {
    // This would integrate with a PDF library like jsPDF
    alert('PDF download functionality will be implemented');
  };

  const handleUpdateRecord = (record) => {
    // Populate the form with the record data for editing
    setFarmerData({
      _id: record.farmer,
      uniqueId: record.farmerUniqueId,
      username: record.farmerName,
      mobile: record.farmerMobile || ''
    });
    setFarmerInput(record.farmerUniqueId);
    
    setMilkEntry({
      cow: {
        quantity: record.cow?.quantity || '',
        fat: record.cow?.fat || '',
        rate: record.cow?.rate || 0,
        amount: record.cow?.amount || 0
      },
      buffalo: {
        quantity: record.buffalo?.quantity || '',
        fat: record.buffalo?.fat || '',
        rate: record.buffalo?.rate || 0,
        amount: record.buffalo?.amount || 0
      },
      totalAmount: record.totalAmount || 0
    });
    
    // Store the record ID for updating
    setEditingRecordId(record._id);
    
    // Scroll to the top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Are you sure you want to delete this milk entry record?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/api/employee/milk-entry/${recordId}`);
      
      // Refresh records after deletion
      fetchMilkRecords();
      fetchFullDaySummary();
      
      // Show success message
      alert('Record deleted successfully!');
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setMilkEntry({
      cow: { quantity: '', fat: '', rate: 0, amount: 0 },
      buffalo: { quantity: '', fat: '', rate: 0, amount: 0 },
      totalAmount: 0
    });
    setFarmerInput('');
    setFarmerData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                {isAutoMode ? (
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(currentDate).toLocaleDateString()}
                    <span className="text-xs text-green-600 block">Auto</span>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => setCurrentDate(e.target.value)}
                    className="text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1"
                  />
                )}
              </div>
            </div>

            {/* Session Selector */}
            <div className="flex items-center gap-3">
              <Milk className="h-6 w-6 text-blue-600" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session {isAutoMode && <span className="text-xs text-green-600">(Auto)</span>}
                </label>
                <div className="flex gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="session"
                      value="Morning"
                      checked={selectedSession === 'Morning'}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      disabled={isAutoMode}
                      className="mr-2"
                    />
                    Morning
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="session"
                      value="Evening"
                      checked={selectedSession === 'Evening'}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      disabled={isAutoMode}
                      className="mr-2"
                    />
                    Evening
                  </label>
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <div className="text-lg font-semibold text-gray-900">{currentTime}</div>
                {dairyInfo && (
                  <div className="text-xs text-gray-500">
                    <div>Morning: {dairyInfo.morningOpenTime || dairyInfo.openingTime} - {dairyInfo.morningCloseTime || '10:00'}</div>
                    <div>Evening: {dairyInfo.eveningOpenTime || '16:00'} - {dairyInfo.eveningCloseTime || dairyInfo.closingTime}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Dairy Name */}
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <label className="block text-sm font-medium text-gray-700">Dairy Name</label>
                <div className="text-lg font-semibold text-gray-900">{dairyName}</div>
              </div>
            </div>
          </div>

          {/* Auto/Manual Mode Toggle */}
          <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoMode"
                  checked={isAutoMode}
                  onChange={(e) => setIsAutoMode(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoMode" className="text-sm font-medium text-gray-700">
                  Automatic Date & Session Selection
                </label>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isAutoMode 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isAutoMode ? 'AUTO' : 'MANUAL'}
              </div>
            </div>
            
            {isAutoMode && dairyInfo && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Current Session:</span> {selectedSession} 
                <span className="ml-2 text-xs">
                  (Morning: {dairyInfo.morningOpenTime || dairyInfo.openingTime} - {dairyInfo.morningCloseTime || '10:00'}, 
                   Evening: {dairyInfo.eveningOpenTime || '16:00'} - {dairyInfo.eveningCloseTime || dairyInfo.closingTime})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Farmer Identification Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Farmer Identification
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Farmer ID / Mobile No
              </label>
              <input
                type="text"
                placeholder="Enter Farmer ID (F123456) or Mobile (1234567890)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={farmerInput}
                onChange={(e) => setFarmerInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchFarmerData();
                  }
                }}
              />
            </div>
            
            <div>
              <button
                onClick={fetchFarmerData}
                disabled={farmerLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Search className="h-4 w-4" />
                {farmerLoading ? 'Fetching...' : 'Fetch Farmer'}
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Farmer Name
              </label>
              <input
                type="text"
                value={farmerData?.username || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                placeholder="Farmer name will appear here"
              />
              {farmerData && (
                <div className="mt-1 text-xs text-gray-500">
                  ID: {farmerData.uniqueId} | Mobile: {farmerData.mobile}
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                {error}
                {error === 'Already entry recorded for this farmer in current session' && (
                  <div className="mt-2 text-sm">
                    <strong>Note:</strong> Each farmer can only have one entry per session (Morning/Evening) per day.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {farmerData && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Farmer found: {farmerData.username} (ID: {farmerData.uniqueId})
              </div>
            </div>
          )}
        </div>

        {/* Milk Entry Section with Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Milk Entry Form - Left Side (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRecordId ? 'Edit Milk Entry' : 'Milk Entry'}
              </h2>
              {editingRecordId && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  Editing Mode
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Milk Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity (Litres)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Fat (%)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rate (₹/L)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Cow Milk Row */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🐄</span>
                        <span className="font-medium">Cow</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={milkEntry.cow.quantity}
                        onChange={(e) => handleMilkEntryChange('cow', 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={milkEntry.cow.fat}
                        onChange={(e) => handleMilkEntryChange('cow', 'fat', e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        value={milkEntry.cow.rate}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        value={milkEntry.cow.amount.toFixed(2)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium"
                      />
                    </td>
                  </tr>
                  
                  {/* Buffalo Milk Row */}
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🐃</span>
                        <span className="font-medium">Buffalo</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={milkEntry.buffalo.quantity}
                        onChange={(e) => handleMilkEntryChange('buffalo', 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="0.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={milkEntry.buffalo.fat}
                        onChange={(e) => handleMilkEntryChange('buffalo', 'fat', e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        value={milkEntry.buffalo.rate}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <input
                        type="number"
                        value={milkEntry.buffalo.amount.toFixed(2)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Total Amount and Save Button */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-xl font-semibold text-gray-900">
                Total Amount: ₹{milkEntry.totalAmount.toFixed(2)}
              </div>
              
              <div className="flex gap-3">
                {editingRecordId && (
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
                
                <button
                  onClick={saveMilkEntry}
                  disabled={loading || !farmerData}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  {!editingRecordId && <Printer className="h-4 w-4" />}
                  {loading ? 'Saving...' : editingRecordId ? 'Update Record' : 'Save and Print'}
                </button>
              </div>
            </div>
          </div>

          {/* Live Summary Box - Right Side (1/3 width) */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📊 Milk Collection Summary
            </h2>
            
            {/* Session Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800">
                  Today - {selectedSession} Session
                </h3>
              </div>
              
              {/* Session Data */}
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🐄 Cow Milk:</span>
                  <span className="font-semibold">{parseFloat(sessionSummary.cowMilkTotal).toFixed(1).replace(/\.0$/, '')} Litres</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🐃 Buffalo Milk:</span>
                  <span className="font-semibold">{parseFloat(sessionSummary.buffaloMilkTotal).toFixed(1).replace(/\.0$/, '')} Litres</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">📊 Total Entries:</span>
                  <span className="font-semibold">{sessionSummary.entryCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🧈 Average Fat:</span>
                  <span className="font-semibold">{parseFloat(sessionSummary.averageFat).toFixed(1).replace(/\.0$/, '')}%</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">💰 Session Amount:</span>
                  <span className="font-bold text-lg text-blue-600">₹{parseFloat(sessionSummary.totalAmount).toFixed(1).replace(/\.0$/, '')}</span>
                </div>
              </div>
            </div>

            {/* Full Day Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800">
                  Today - Full Day Total
                </h3>
                <span className="text-xs text-gray-500">All Sessions</span>
              </div>
              
              {/* Full Day Data */}
              <div className="space-y-3 bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🐄 Cow Milk:</span>
                  <span className="font-semibold">{parseFloat(fullDaySummary.cowMilk || 0).toFixed(1).replace(/\.0$/, '')} Litres</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">🐃 Buffalo Milk:</span>
                  <span className="font-semibold">{parseFloat(fullDaySummary.buffaloMilk || 0).toFixed(1).replace(/\.0$/, '')} Litres</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">📊 Total Entries:</span>
                  <span className="font-semibold">{fullDaySummary.entryCount || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">👨‍🌾 Farmers:</span>
                  <span className="font-semibold">{fullDaySummary.farmerCount || 0}</span>
                </div>
                
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">🥛 Total Available:</span>
                  <span className="font-bold text-xl text-green-600">{parseFloat(fullDaySummary.totalLiters || 0).toFixed(1).replace(/\.0$/, '')}L</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">💰 Total Amount:</span>
                  <span className="font-bold text-lg text-green-600">₹{parseFloat(fullDaySummary.totalAmount || 0).toFixed(1).replace(/\.0$/, '')}</span>
                </div>
                
                <div className="text-center text-sm text-gray-500">
                  🔄 Updates after every save
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Records Table - Full Width Below */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Saved Records - {selectedSession} Session
          </h2>
          
          {milkRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No records found for {selectedSession} session
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2">Sl No</th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Session</th>
                    <th className="text-left py-2 px-2">Farmer</th>
                    <th className="text-left py-2 px-2">Cow Qty</th>
                    <th className="text-left py-2 px-2">Cow Fat</th>
                    <th className="text-left py-2 px-2">Buf Qty</th>
                    <th className="text-left py-2 px-2">Buf Fat</th>
                    <th className="text-left py-2 px-2">Total ₹</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {milkRecords.map((record, index) => (
                    <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">{index + 1}</td>
                      <td className="py-2 px-2">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-2 px-2">{record.session}</td>
                      <td className="py-2 px-2">{record.farmerName}</td>
                      <td className="py-2 px-2">{record.cow?.quantity ? parseFloat(record.cow.quantity).toFixed(1).replace(/\.0$/, '') : '-'}</td>
                      <td className="py-2 px-2">{record.cow?.fat ? parseFloat(record.cow.fat).toFixed(1).replace(/\.0$/, '') : '-'}</td>
                      <td className="py-2 px-2">{record.buffalo?.quantity ? parseFloat(record.buffalo.quantity).toFixed(1).replace(/\.0$/, '') : '-'}</td>
                      <td className="py-2 px-2">{record.buffalo?.fat ? parseFloat(record.buffalo.fat).toFixed(1).replace(/\.0$/, '') : '-'}</td>
                      <td className="py-2 px-2 font-medium">₹{parseFloat(record.totalAmount).toFixed(1).replace(/\.0$/, '')}</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdateRecord(record)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                            title="Edit Record"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record._id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Duplicate Entry Popup Modal */}
        {showDuplicatePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Already Entry Recorded</h3>
                <p className="text-gray-600 mb-2">
                  This farmer already has an entry for the current session.
                </p>
                <p className="text-sm text-gray-500">
                  Each farmer can only have one milk collection entry per session (Morning/Evening) per day.
                </p>
              </div>
              
              <button
                onClick={() => {
                  setShowDuplicatePopup(false);
                  setError('');
                  setFarmerInput('');
                  setFarmerData(null);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Success Popup Modal */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-600">
                  Record saved farmer and collection side successfully
                </p>
              </div>
              
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && lastSavedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4 text-center">🧾 Receipt</h2>
              
              <div className="border-2 border-dashed border-gray-300 p-4 space-y-2 text-sm">
                <div className="text-center font-bold">{dairyName}</div>
                <div className="border-b border-gray-300 my-2"></div>
                
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(lastSavedEntry.date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Session:</span>
                  <span>{lastSavedEntry.session}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{lastSavedEntry.time}</span>
                </div>
                
                <div className="border-b border-gray-300 my-2"></div>
                
                <div className="flex justify-between">
                  <span>Farmer ID:</span>
                  <span>{lastSavedEntry.farmerUniqueId}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Farmer Name:</span>
                  <span>{lastSavedEntry.farmerName}</span>
                </div>
                
                <div className="border-b border-gray-300 my-2"></div>
                
                {lastSavedEntry.cow && (
                  <>
                    <div className="font-medium">Cow Milk:</div>
                    <div className="ml-2 space-y-1">
                      <div className="flex justify-between">
                        <span>- Quantity:</span>
                        <span>{parseFloat(lastSavedEntry.cow.quantity).toFixed(1).replace(/\.0$/, '')}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Fat %:</span>
                        <span>{parseFloat(lastSavedEntry.cow.fat).toFixed(1).replace(/\.0$/, '')}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Rate:</span>
                        <span>₹{parseFloat(lastSavedEntry.cow.rate).toFixed(1).replace(/\.0$/, '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Amount:</span>
                        <span>₹{parseFloat(lastSavedEntry.cow.amount).toFixed(1).replace(/\.0$/, '')}</span>
                      </div>
                    </div>
                  </>
                )}
                
                {lastSavedEntry.buffalo && (
                  <>
                    <div className="font-medium">Buffalo Milk:</div>
                    <div className="ml-2 space-y-1">
                      <div className="flex justify-between">
                        <span>- Quantity:</span>
                        <span>{parseFloat(lastSavedEntry.buffalo.quantity).toFixed(1).replace(/\.0$/, '')}L</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Fat %:</span>
                        <span>{parseFloat(lastSavedEntry.buffalo.fat).toFixed(1).replace(/\.0$/, '')}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Rate:</span>
                        <span>₹{parseFloat(lastSavedEntry.buffalo.rate).toFixed(1).replace(/\.0$/, '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Amount:</span>
                        <span>₹{parseFloat(lastSavedEntry.buffalo.amount).toFixed(1).replace(/\.0$/, '')}</span>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="border-b border-gray-300 my-2"></div>
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>₹{parseFloat(lastSavedEntry.totalAmount).toFixed(1).replace(/\.0$/, '')}</span>
                </div>
                
                <div className="border-b border-gray-300 my-2"></div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={printReceipt}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                
                <button
                  onClick={downloadReceiptPDF}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>
              
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}