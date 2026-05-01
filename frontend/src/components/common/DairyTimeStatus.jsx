import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import api from "../../services/api";

export default function DairyTimeStatus({ className = "", compact = false }) {
  const [dairyInfo, setDairyInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (time24) => {
    if (!time24) return time24;
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get current IST time using proper timezone handling
  const getCurrentISTTime = () => {
    // Use proper timezone conversion for IST
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  };

  // Update current time every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentISTTime());
    }, 1000); // Update every second for real-time countdown

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDairyInfo = async () => {
      try {
        const res = await api.get("/api/public/dairy-info");
        setDairyInfo(res.data.data);
      } catch (err) {
        console.error("Error fetching dairy info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDairyInfo();
  }, []);

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

  const getCurrentDairyStatus = () => {
    if (!dairyInfo) {
      return { 
        status: "unknown", 
        color: "text-gray-600", 
        bg: "bg-gray-100",
        message: "Dairy time not set",
        timeInfo: "",
        sessionName: "Unknown"
      };
    }

    const now = currentTime;
    const currentTimeStr = now.toTimeString().slice(0, 5);
    const currentMinutes = timeToMinutes(currentTimeStr);
    
    if (currentMinutes === null) {
      return { 
        status: "unknown", 
        color: "text-gray-600", 
        bg: "bg-gray-100",
        message: "Invalid current time",
        timeInfo: "",
        sessionName: "Unknown"
      };
    }

    // Validate session times
    const morningOpenMinutes = timeToMinutes(dairyInfo.morningOpenTime);
    const morningCloseMinutes = timeToMinutes(dairyInfo.morningCloseTime);
    const eveningOpenMinutes = timeToMinutes(dairyInfo.eveningOpenTime);
    const eveningCloseMinutes = timeToMinutes(dairyInfo.eveningCloseTime);

    // Check if morning session is valid (can span midnight)
    const isMorningSessionValid = morningOpenMinutes !== null && morningCloseMinutes !== null && 
      (morningOpenMinutes < morningCloseMinutes || morningOpenMinutes > morningCloseMinutes); // Allow midnight crossing
    
    // Check if evening session is valid (can span midnight)
    const isEveningSessionValid = eveningOpenMinutes !== null && eveningCloseMinutes !== null && 
      (eveningOpenMinutes < eveningCloseMinutes || eveningOpenMinutes > eveningCloseMinutes); // Allow midnight crossing
    
    // Check if currently in morning session
    if (isMorningSessionValid && isTimeInRange(currentMinutes, dairyInfo.morningOpenTime, dairyInfo.morningCloseTime)) {
      
      // Calculate real-time countdown until morning closing
      let diffMinutes;
      if (morningOpenMinutes > morningCloseMinutes) {
        // Session crosses midnight
        if (currentMinutes >= morningOpenMinutes) {
          // Currently in the part before midnight
          diffMinutes = (24 * 60) - currentMinutes + morningCloseMinutes;
        } else {
          // Currently in the part after midnight
          diffMinutes = morningCloseMinutes - currentMinutes;
        }
      } else {
        // Normal session
        diffMinutes = morningCloseMinutes - currentMinutes;
      }
      
      if (diffMinutes > 0) {
        const hoursLeft = Math.floor(diffMinutes / 60);
        const minutesLeft = diffMinutes % 60;
        
        // Get seconds for real-time countdown
        const currentSeconds = now.getSeconds();
        const secondsLeft = 60 - currentSeconds;
        
        const timeInfo = diffMinutes <= 15 
          ? `Closing Soon: ${minutesLeft}m ${secondsLeft}s`
          : `Closes in: ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`;
        
        return { 
          status: "open", 
          session: "morning",
          color: "text-green-600", 
          bg: "bg-green-100",
          message: "Morning Session Open",
          timeInfo,
          urgent: diffMinutes <= 15,
          sessionName: "Morning Session",
          countdown: true
        };
      }
    }
    
    // Check if currently in evening session
    if (isEveningSessionValid && isTimeInRange(currentMinutes, dairyInfo.eveningOpenTime, dairyInfo.eveningCloseTime)) {
      
      // Calculate real-time countdown until evening closing
      let diffMinutes;
      if (eveningOpenMinutes > eveningCloseMinutes) {
        // Session crosses midnight
        if (currentMinutes >= eveningOpenMinutes) {
          // Currently in the part before midnight
          diffMinutes = (24 * 60) - currentMinutes + eveningCloseMinutes;
        } else {
          // Currently in the part after midnight
          diffMinutes = eveningCloseMinutes - currentMinutes;
        }
      } else {
        // Normal session
        diffMinutes = eveningCloseMinutes - currentMinutes;
      }
      
      if (diffMinutes > 0) {
        const hoursLeft = Math.floor(diffMinutes / 60);
        const minutesLeft = diffMinutes % 60;
        
        // Get seconds for real-time countdown
        const currentSeconds = now.getSeconds();
        const secondsLeft = 60 - currentSeconds;
        
        const timeInfo = diffMinutes <= 15 
          ? `Closing Soon: ${minutesLeft}m ${secondsLeft}s`
          : `Closes in: ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`;
        
        return { 
          status: "open", 
          session: "evening",
          color: "text-green-600", 
          bg: "bg-green-100",
          message: "Evening Session Open",
          timeInfo,
          urgent: diffMinutes <= 15,
          sessionName: "Evening Session",
          countdown: true
        };
      }
    }
    
    // Dairy is closed - calculate next opening time with real-time countdown
    let nextOpenTime, nextSession, nextOpenMinutes;
    
    // Determine next session based on current time and valid sessions
    if (isMorningSessionValid && currentMinutes < morningOpenMinutes) {
      // Before morning session
      nextOpenTime = dairyInfo.morningOpenTime;
      nextSession = "Morning";
      nextOpenMinutes = morningOpenMinutes;
    } else if (isEveningSessionValid && currentMinutes < eveningOpenMinutes) {
      // Between sessions or before evening session
      nextOpenTime = dairyInfo.eveningOpenTime;
      nextSession = "Evening";
      nextOpenMinutes = eveningOpenMinutes;
    } else if (isMorningSessionValid) {
      // After all sessions today - next day morning
      nextOpenTime = dairyInfo.morningOpenTime;
      nextSession = "Morning (Tomorrow)";
      nextOpenMinutes = morningOpenMinutes;
    } else {
      // No valid sessions configured
      return { 
        status: "closed", 
        session: "none",
        color: "text-red-600", 
        bg: "bg-red-100",
        message: "Dairy Times Not Configured",
        timeInfo: "Please contact admin to set dairy hours",
        urgent: false,
        sessionName: "Closed"
      };
    }
    
    // Calculate time until next opening with real-time countdown
    if (nextOpenMinutes !== null) {
      let diffMinutes;
      
      if (nextSession.includes("Tomorrow")) {
        // Next day calculation
        diffMinutes = (24 * 60) - currentMinutes + nextOpenMinutes;
      } else {
        // Same day calculation
        diffMinutes = nextOpenMinutes - currentMinutes;
      }
      
      if (diffMinutes > 0) {
        const hoursLeft = Math.floor(diffMinutes / 60);
        const minutesLeft = diffMinutes % 60;
        
        // Get seconds for real-time countdown
        const currentSeconds = now.getSeconds();
        const secondsLeft = 60 - currentSeconds;
        
        return { 
          status: "closed", 
          session: "none",
          color: "text-red-600", 
          bg: "bg-red-100",
          message: "See You Soon! 👋",
          timeInfo: `${nextSession} opens in: ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`,
          urgent: false,
          sessionName: "Closed",
          countdown: true
        };
      }
    }
    
    return { 
      status: "closed", 
      session: "none",
      color: "text-red-600", 
      bg: "bg-red-100",
      message: "Dairy is Closed",
      timeInfo: "",
      urgent: false,
      sessionName: "Closed"
    };
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-xl shadow ${className}`}>
        <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold mb-4 flex items-center gap-2`}>
          <Clock className="text-indigo-600" size={compact ? 20 : 24} />
          Dairy Time Status
        </h2>
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  const dairyStatus = getCurrentDairyStatus();

  return (
    <div className={`bg-white ${compact ? 'p-4' : 'p-6'} rounded-xl shadow ${className}`}>
      <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold mb-4 flex items-center gap-2`}>
        <Clock className="text-indigo-600" size={compact ? 20 : 24} />
        Dairy Time Status
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className={`px-6 py-4 rounded-full font-medium ${compact ? 'text-base' : 'text-lg'} ${dairyStatus.bg} ${dairyStatus.color}`}>
            <span className="flex items-center gap-2">
              <span className={compact ? 'text-xl' : 'text-2xl'}>
                {dairyStatus.status === "open" ? "🟢" : dairyStatus.status === "closed" ? "🔴" : "⚪"}
              </span>
              {dairyStatus.sessionName}
            </span>
          </div>
        </div>
        
        {/* Time Information with Real-time Countdown */}
        {dairyStatus.timeInfo && (
          <div className="text-center">
            <div className={`inline-block px-4 py-2 rounded-lg font-medium ${
              dairyStatus.urgent 
                ? "bg-red-100 text-red-700 animate-pulse" 
                : dairyStatus.status === "open" 
                  ? "bg-orange-100 text-orange-700" 
                  : "bg-blue-100 text-blue-700"
            } ${dairyStatus.countdown ? 'font-mono' : ''}`}>
              ⏰ {dairyStatus.timeInfo}
            </div>
            {dairyStatus.countdown && (
              <div className="text-xs text-gray-500 mt-1">
                Live countdown • Updates every second
              </div>
            )}
          </div>
        )}
        
        {/* Operating Hours - Always show, but compact layout in compact mode */}
        {dairyInfo && (
          <div className="text-center text-gray-600 space-y-2">
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-500 mb-2`}>Operating Hours</div>
            
            {compact ? (
              /* Compact Layout - Side by side sessions */
              <div className="grid grid-cols-2 gap-2">
                {/* Morning Session - Compact */}
                {dairyInfo.morningOpenTime && dairyInfo.morningCloseTime && (
                  <div className="bg-yellow-50 p-2 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-sm">🌅</span>
                      <span className="font-semibold text-yellow-800 text-xs">Morning</span>
                    </div>
                    <p className="text-xs text-yellow-700">
                      {formatTime12Hour(dairyInfo.morningOpenTime)} - {formatTime12Hour(dairyInfo.morningCloseTime)}
                    </p>
                  </div>
                )}
                
                {/* Evening Session - Compact */}
                {dairyInfo.eveningOpenTime && dairyInfo.eveningCloseTime && (
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-sm">🌇</span>
                      <span className="font-semibold text-orange-800 text-xs">Evening</span>
                    </div>
                    <p className="text-xs text-orange-700">
                      {formatTime12Hour(dairyInfo.eveningOpenTime)} - {formatTime12Hour(dairyInfo.eveningCloseTime)}
                    </p>
                  </div>
                )}
                
                {/* Fallback to old format if new times not available - Compact */}
                {(!dairyInfo.morningOpenTime || !dairyInfo.eveningOpenTime) && dairyInfo.openingTime && (
                  <div className="col-span-2 bg-blue-50 p-2 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-sm">🕐</span>
                      <span className="font-semibold text-blue-800 text-xs">Daily Hours</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {formatTime12Hour(dairyInfo.openingTime)} - {formatTime12Hour(dairyInfo.closingTime)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Full Layout - Stacked sessions */
              <>
                {/* Morning Session */}
                {dairyInfo.morningOpenTime && dairyInfo.morningCloseTime && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">🌅</span>
                      <span className="font-semibold text-yellow-800">Morning Session</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {formatTime12Hour(dairyInfo.morningOpenTime)} - {formatTime12Hour(dairyInfo.morningCloseTime)}
                    </p>
                  </div>
                )}
                
                {/* Evening Session */}
                {dairyInfo.eveningOpenTime && dairyInfo.eveningCloseTime && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">🌇</span>
                      <span className="font-semibold text-orange-800">Evening Session</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      {formatTime12Hour(dairyInfo.eveningOpenTime)} - {formatTime12Hour(dairyInfo.eveningCloseTime)}
                    </p>
                  </div>
                )}
                
                {/* Fallback to old format if new times not available */}
                {(!dairyInfo.morningOpenTime || !dairyInfo.eveningOpenTime) && dairyInfo.openingTime && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-lg">🕐</span>
                      <span className="font-semibold text-blue-800">Daily Hours</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {formatTime12Hour(dairyInfo.openingTime)} - {formatTime12Hour(dairyInfo.closingTime)}
                    </p>
                  </div>
                )}
              </>
            )}
            
            {/* Current Time Display - Always show but smaller in compact mode */}
            <div className={`${compact ? 'text-xs' : 'text-xs'} text-gray-500 mt-2 pt-2 border-t`}>
              Current IST Time: {currentTime.toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}