import { useState, useEffect } from "react";
import { Milk, ShoppingCart, RefreshCw } from "lucide-react";
import api from "../../../services/api";
import DairyTimeStatus from "../../../components/common/DairyTimeStatus";
import PlaceOrderModal from "../../../components/order/PlaceOrderModal";

export default function BuyerOverview() {
  const [milkAvailability, setMilkAvailability] = useState(null);
  const [milkRates, setMilkRates] = useState({ cow: 0, buffalo: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dairyStatus, setDairyStatus] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isDairyOpen, setIsDairyOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState("Morning");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Function to check if dairy is currently open
  const checkDairyStatus = (dairyInfo) => {
    if (!dairyInfo) return false;

    // Helper function to validate and convert time string to minutes for comparison
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      // Allow "00:00" as a valid time (midnight)
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      return hours * 60 + minutes;
    };

    // Helper function to check if current time is within a session
    const isTimeInRange = (currentMinutes, openTime, closeTime) => {
      const openMinutes = timeToMinutes(openTime);
      const closeMinutes = timeToMinutes(closeTime);
      
      // Both times must be valid
      if (openMinutes === null || closeMinutes === null) return false;
      
      // Handle sessions that span across midnight (e.g., 22:00 - 02:00)
      if (openMinutes > closeMinutes) {
        // Session crosses midnight
        return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
      }
      
      // Normal session within same day
      if (openMinutes >= closeMinutes) return false; // Invalid range (same time)
      
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    };

    // Get current IST time using proper timezone handling
    const getCurrentISTTime = () => {
      return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    };

    const now = getCurrentISTTime();
    const currentTimeStr = now.toTimeString().slice(0, 5);
    const currentMinutes = timeToMinutes(currentTimeStr);
    
    if (currentMinutes === null) return false;

    // Validate session times
    const morningOpenMinutes = timeToMinutes(dairyInfo.morningOpenTime);
    const morningCloseMinutes = timeToMinutes(dairyInfo.morningCloseTime);
    const eveningOpenMinutes = timeToMinutes(dairyInfo.eveningOpenTime);
    const eveningCloseMinutes = timeToMinutes(dairyInfo.eveningCloseTime);

    // Check if morning session is valid and currently active (allow midnight crossing)
    const isMorningSessionValid = morningOpenMinutes !== null && morningCloseMinutes !== null && 
      (morningOpenMinutes < morningCloseMinutes || morningOpenMinutes > morningCloseMinutes);
    if (isMorningSessionValid && isTimeInRange(currentMinutes, dairyInfo.morningOpenTime, dairyInfo.morningCloseTime)) {
      return true;
    }
    
    // Check if evening session is valid and currently active (allow midnight crossing)
    const isEveningSessionValid = eveningOpenMinutes !== null && eveningCloseMinutes !== null && 
      (eveningOpenMinutes < eveningCloseMinutes || eveningOpenMinutes > eveningCloseMinutes);
    if (isEveningSessionValid && isTimeInRange(currentMinutes, dairyInfo.eveningOpenTime, dairyInfo.eveningCloseTime)) {
      return true;
    }
    
    return false;
  };

  // Real-time dairy status checker
  useEffect(() => {
    const checkStatus = () => {
      if (dairyStatus) {
        const isOpen = checkDairyStatus(dairyStatus);
        setIsDairyOpen(isOpen);
        
        // Close order modal immediately if dairy becomes closed
        if (!isOpen && showOrderModal) {
          setShowOrderModal(false);
        }
      }
    };

    // Check status immediately
    checkStatus();

    // Check status every 10 seconds for real-time updates
    const statusInterval = setInterval(checkStatus, 10000);

    return () => clearInterval(statusInterval);
  }, [dairyStatus, showOrderModal]);

  useEffect(() => {
    const fetchData = async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          console.log('🔄 Manual refresh triggered');
          setRefreshing(true);
        } else {
          console.log('🔄 Automatic refresh (polling)');
        }

        // Fetch dairy info to check status
        const dairyRes = await api.get("/api/public/dairy-info").catch(() => ({ data: { data: null } }));
        const dairyData = dairyRes.data.data;
        setDairyStatus(dairyData);

        // Check if dairy is currently open
        const isDairyOpenNow = checkDairyStatus(dairyData);
        setIsDairyOpen(isDairyOpenNow);

        // Fetch milk availability data with cache busting
        const milkRes = await api.get(`/api/buyer/milk-availability?t=${Date.now()}`).catch(() => ({ data: { data: null } }));
        const milkData = milkRes.data.data;
        
        console.log('=== Milk Availability API Response ===');
        console.log('Full response:', milkRes.data);
        console.log('Milk data:', milkData);
        console.log('Status code:', milkRes.status);
        
        // Update session and availability data
        if (milkData) {
          console.log('Session milk collection:', milkData.sessionMilkCollection);
          console.log('Is dairy open:', milkData.isDairyOpen);
          console.log('Current session:', milkData.currentSession);
          
          setCurrentSession(milkData.currentSession || "Morning");
          setIsDairyOpen(milkData.isDairyOpen || false);
          
          // Always use session milk collection data (empty if dairy closed)
          const newMilkAvailability = milkData.sessionMilkCollection;
          console.log('🔄 Setting new milk availability:', newMilkAvailability);
          
          // FORCE STATE UPDATE: Use functional update to ensure React re-renders
          setMilkAvailability(prevState => {
            console.log('🔄 Previous state:', prevState);
            console.log('🔄 New state:', newMilkAvailability);
            
            // Force update even if objects look similar
            return { ...newMilkAvailability, _forceUpdate: Date.now() };
          });
          
          // Get milk rates
          if (milkData.milkRates) {
            setMilkRates(milkData.milkRates);
          }
        } else {
          console.log('⚠️ No milk data received from API');
          // Fallback values - set empty availability when no data
          setMilkAvailability({
            cowMilk: 0,
            buffaloMilk: 0,
            totalLiters: 0,
            totalAmount: 0,
            entryCount: 0,
            farmerCount: 0
          });
          setMilkRates({ cow: 50, buffalo: 60 });
        }

        // Update last updated time
        setLastUpdated(new Date());

      } catch (err) {
        console.error("Error fetching data:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        // Set default values if all requests fail
        setMilkAvailability({
          cowMilk: 0,
          buffaloMilk: 0,
          totalLiters: 0,
          totalAmount: 0,
          entryCount: 0,
          farmerCount: 0
        });
        setMilkRates({ cow: 50, buffalo: 60 });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up real-time polling for milk availability updates
    // Poll every 5 seconds to get fresh milk collection data
    const milkAvailabilityInterval = setInterval(() => {
      fetchData();
    }, 5000); // 5 seconds for faster updates

    // Store fetchData function for manual refresh with enhanced logging
    window.refreshMilkAvailability = () => {
      console.log('🔄 Manual refresh triggered - fetchData called');
      fetchData(true);
    };

    return () => {
      clearInterval(milkAvailabilityInterval);
      delete window.refreshMilkAvailability;
    };
  }, []); // Remove isDairyOpen dependency to prevent infinite loop

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">Buyer Dashboard</h1>
        <p className="text-blue-100">Check dairy status and milk availability</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dairy Time Status */}
        <DairyTimeStatus compact={true} />

        {/* Today's Milk Availability */}
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Milk className="text-blue-600" size={24} />
              Today's Milk Availability
            </h2>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => window.refreshMilkAvailability?.()}
                disabled={refreshing}
                className={`p-2 rounded-lg transition-colors ${
                  refreshing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
                title="Refresh milk availability"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {milkAvailability !== null ? (
              <>
                {/* Cow Milk */}
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🐄</span>
                    <span className="font-medium">Cow Milk</span>
                  </div>
                  <span className="font-bold text-lg text-blue-600">
                    {parseFloat(milkAvailability.cowMilk || 0).toFixed(1).replace(/\.0$/, '')}L
                  </span>
                </div>

                {/* Buffalo Milk */}
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🐃</span>
                    <span className="font-medium">Buffalo Milk</span>
                  </div>
                  <span className="font-bold text-lg text-orange-600">
                    {parseFloat(milkAvailability.buffaloMilk || 0).toFixed(1).replace(/\.0$/, '')}L
                  </span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🥛</span>
                    <span className="font-bold">{currentSession} Session Total</span>
                  </div>
                  <span className="font-bold text-xl text-green-600">
                    {parseFloat(milkAvailability.totalLiters || 0).toFixed(1).replace(/\.0$/, '')}L
                  </span>
                </div>

                {/* Session Status */}
                <div className="text-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                  {isDairyOpen ? (
                    <span className="text-green-600">
                      ✅ {currentSession} session is active - Availability updates as milk is collected
                    </span>
                  ) : (
                    <span className="text-red-600">
                      ❌ Dairy is closed - Next session will start from 0L
                    </span>
                  )}
                </div>

                {/* Place Order Button */}
                <button
                  onClick={() => setShowOrderModal(true)}
                  disabled={!isDairyOpen || (milkAvailability.totalLiters || 0) === 0}
                  className={`w-full font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 ${
                    isDairyOpen && (milkAvailability.totalLiters || 0) > 0
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-400 text-gray-600 cursor-not-allowed"
                  }`}
                  title={!isDairyOpen ? "Dairy is currently closed" : (milkAvailability.totalLiters || 0) === 0 ? "No milk available in current session" : ""}
                >
                  <ShoppingCart size={20} />
                  {!isDairyOpen ? "Dairy Closed" : (milkAvailability.totalLiters || 0) === 0 ? "No Milk Available" : "Place Order"}
                </button>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Milk size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg">Loading milk availability...</p>
                <p className="text-sm">Please wait while we fetch the latest session data</p>
              </div>
            )}
          </div>
        </div>

        {/* Milk Rates */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Current Milk Rates
          </h2>
          <div className="space-y-4">
            {/* Cow Milk Rate */}
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐄</span>
                <div>
                  <div className="font-medium">Cow Milk</div>
                  <div className="text-sm text-gray-600">Per Liter</div>
                </div>
              </div>
              <span className="font-bold text-xl text-blue-600">₹{milkRates.cow}</span>
            </div>

            {/* Buffalo Milk Rate */}
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐃</span>
                <div>
                  <div className="font-medium">Buffalo Milk</div>
                  <div className="text-sm text-gray-600">Per Liter</div>
                </div>
              </div>
              <span className="font-bold text-xl text-orange-600">₹{milkRates.buffalo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Place Order Modal */}
      <PlaceOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        milkRates={milkRates}
        dairyStatus={dairyStatus}
        onOrderSuccess={() => {
          // Trigger immediate refresh when order is placed successfully
          console.log('🔄 Order success callback triggered, refreshing milk availability...');
          
          // Force immediate refresh with multiple strategies
          if (window.refreshMilkAvailability) {
            console.log('📞 Calling window.refreshMilkAvailability...');
            window.refreshMilkAvailability();
            console.log('✅ Refresh function called');
            
            // Also trigger a delayed refresh to ensure it works
            setTimeout(() => {
              console.log('🔄 Delayed refresh triggered...');
              window.refreshMilkAvailability();
            }, 1000);
          } else {
            console.error('❌ window.refreshMilkAvailability not found');
          }
          
          // Force component re-render by updating a state
          setLastUpdated(new Date());
        }}
      />
    </div>
  );
}
