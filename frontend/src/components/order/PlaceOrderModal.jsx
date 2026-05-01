import { useState, useEffect } from "react";
import { ShoppingCart, X, AlertTriangle, MapPin, CreditCard } from "lucide-react";
import api from "../../services/api";

const PlaceOrderModal = ({ isOpen, onClose, milkRates, dairyStatus, onOrderSuccess }) => {
  const [step, setStep] = useState(1); // 1: Order Details, 2: Address, 3: Payment, 4: Confirmation
  const [orderForm, setOrderForm] = useState({
    cowQuantity: 0,
    buffaloQuantity: 0,
    deliveryAddress: {
      area: "",
      buildingNo: "",
      colony: "",
      landmark: "",
      phoneNumber: ""
    }
  });
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [milkAvailability, setMilkAvailability] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [liveLocation, setLiveLocation] = useState({
    enabled: false,
    coordinates: null,
    accuracy: null,
    loading: false,
    error: null
  });

  // Fetch milk availability data
  const fetchMilkAvailability = async () => {
    try {
      const response = await api.get(`/api/buyer/milk-availability?t=${Date.now()}`);
      
      if (response.data.success && response.data.data) {
        // Update milk availability
        if (response.data.data.sessionMilkCollection) {
          setMilkAvailability(response.data.data.sessionMilkCollection);
        } else {
          setMilkAvailability(null);
        }
      } else {
        setMilkAvailability(null);
      }
    } catch (error) {
      console.error("Error fetching milk availability:", error);
      setMilkAvailability(null);
    }
  };

  // Live location functions
  const requestLiveLocation = () => {
    if (!navigator.geolocation) {
      setLiveLocation(prev => ({
        ...prev,
        error: "Geolocation is not supported by this browser"
      }));
      return;
    }

    setLiveLocation(prev => ({ ...prev, loading: true, error: null }));

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLiveLocation({
          enabled: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          },
          accuracy: position.coords.accuracy,
          loading: false,
          error: null
        });
      },
      (error) => {
        let errorMessage = "Unable to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setLiveLocation(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
      },
      options
    );
  };

  const clearLiveLocation = () => {
    setLiveLocation({
      enabled: false,
      coordinates: null,
      accuracy: null,
      loading: false,
      error: null
    });
  };
  const isDairyOpen = () => {
    if (!dairyStatus) return false;

    const timeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
      }
      return hours * 60 + minutes;
    };

    const isTimeInRange = (currentMinutes, openTime, closeTime) => {
      const openMinutes = timeToMinutes(openTime);
      const closeMinutes = timeToMinutes(closeTime);
      
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

    const getCurrentISTTime = () => {
      return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    };

    const now = getCurrentISTTime();
    const currentTimeStr = now.toTimeString().slice(0, 5);
    const currentMinutes = timeToMinutes(currentTimeStr);
    
    if (currentMinutes === null) return false;

    const morningOpenMinutes = timeToMinutes(dairyStatus.morningOpenTime);
    const morningCloseMinutes = timeToMinutes(dairyStatus.morningCloseTime);
    const eveningOpenMinutes = timeToMinutes(dairyStatus.eveningOpenTime);
    const eveningCloseMinutes = timeToMinutes(dairyStatus.eveningCloseTime);

    // Check if morning session is valid (allow midnight crossing)
    const isMorningSessionValid = morningOpenMinutes !== null && morningCloseMinutes !== null && 
      (morningOpenMinutes < morningCloseMinutes || morningOpenMinutes > morningCloseMinutes);
    if (isMorningSessionValid && isTimeInRange(currentMinutes, dairyStatus.morningOpenTime, dairyStatus.morningCloseTime)) {
      return true;
    }
    
    // Check if evening session is valid (allow midnight crossing)
    const isEveningSessionValid = eveningOpenMinutes !== null && eveningCloseMinutes !== null && 
      (eveningOpenMinutes < eveningCloseMinutes || eveningOpenMinutes > eveningCloseMinutes);
    if (isEveningSessionValid && isTimeInRange(currentMinutes, dairyStatus.eveningOpenTime, dairyStatus.eveningCloseTime)) {
      return true;
    }
    
    return false;
  };

  // Check dairy status every 10 seconds and close modal if dairy closes
  useEffect(() => {
    if (!isOpen) return;

    const checkDairyStatus = () => {
      if (!isDairyOpen()) {
        alert("Dairy has closed. Your order cannot be processed at this time.");
        onClose();
      }
    };

    const statusInterval = setInterval(checkDairyStatus, 10000);
    return () => clearInterval(statusInterval);
  }, [isOpen, dairyStatus, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOrderForm({
        cowQuantity: 0,
        buffaloQuantity: 0,
        deliveryAddress: {
          area: "",
          buildingNo: "",
          colony: "",
          landmark: "",
          phoneNumber: ""
        }
      });
      setPaymentMethod("");
      setShowQR(false);
      setOrderSuccess(false);
      setOrderData(null);
      setProcessingPayment(false);
      setPaymentError("");
      setValidationError("");
      setShowValidationPopup(false);
      clearLiveLocation(); // Clear live location when modal opens
      
      // Fetch milk availability when modal opens
      fetchMilkAvailability();
      
      // Refresh availability every 30 seconds while modal is open
      const availabilityInterval = setInterval(fetchMilkAvailability, 30000);
      return () => clearInterval(availabilityInterval);
    }
  }, [isOpen]);

  const calculateTotal = () => {
    const cowTotal = orderForm.cowQuantity * milkRates.cow;
    const buffaloTotal = orderForm.buffaloQuantity * milkRates.buffalo;
    return cowTotal + buffaloTotal;
  };

  const validateAddress = () => {
    const { area, buildingNo, colony, phoneNumber } = orderForm.deliveryAddress;
    return area.trim() && buildingNo.trim() && colony.trim() && phoneNumber.trim() && phoneNumber.length === 10;
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Check if at least one milk type has quantity > 0
      if (orderForm.cowQuantity <= 0 && orderForm.buffaloQuantity <= 0) {
        setValidationError("Please select at least one milk type with quantity greater than 0");
        setShowValidationPopup(true);
        return;
      }
      
      // Validate cow quantity if selected
      if (orderForm.cowQuantity > 0) {
        const cowAvailable = parseFloat(milkAvailability?.cowMilk) || 0;
        if (orderForm.cowQuantity > cowAvailable) {
          setValidationError(`Insufficient cow milk. Available: ${cowAvailable}L, Requested: ${orderForm.cowQuantity}L`);
          setShowValidationPopup(true);
          return;
        }
      }
      
      // Validate buffalo quantity if selected
      if (orderForm.buffaloQuantity > 0) {
        const buffaloAvailable = parseFloat(milkAvailability?.buffaloMilk) || 0;
        if (orderForm.buffaloQuantity > buffaloAvailable) {
          setValidationError(`Insufficient buffalo milk. Available: ${buffaloAvailable}L, Requested: ${orderForm.buffaloQuantity}L`);
          setShowValidationPopup(true);
          return;
        }
      }
      
      setValidationError("");
      setShowValidationPopup(false);
      setStep(2);
    } else if (step === 2 && validateAddress()) {
      setStep(3);
    }
  };

  const handlePaymentSelect = async (method) => {
    // Check if dairy is still open before processing payment
    if (!isDairyOpen()) {
      alert("Dairy has closed. Cannot process payment at this time.");
      onClose();
      return;
    }

    setPaymentMethod(method);
    setLoading(true);
    setProcessingPayment(true);
    setPaymentError("");

    try {
      if (method === 'cod') {
        // Simulate processing time for COD
        await new Promise(resolve => setTimeout(resolve, 1500));
        await proceedWithOrder(method);
      } else if (method === 'upi') {
        setShowQR(true);
        // Simulate QR code payment processing
        await new Promise(resolve => setTimeout(resolve, 5000));
        setShowQR(false);
        await proceedWithOrder(method);
      } else if (method === 'card') {
        // Simulate card payment processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        await proceedWithOrder(method);
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      setPaymentError("Payment processing failed. Please try again.");
      setLoading(false);
      setProcessingPayment(false);
      setShowQR(false);
    }
  };

  const proceedWithOrder = async (selectedPaymentMethod) => {
    try {
      // Final check if dairy is still open
      if (!isDairyOpen()) {
        throw new Error("Dairy has closed during payment processing");
      }

      // Convert address object to string format for backend
      const addressString = `${orderForm.deliveryAddress.buildingNo}, ${orderForm.deliveryAddress.area}, ${orderForm.deliveryAddress.colony}${orderForm.deliveryAddress.landmark ? `, Near ${orderForm.deliveryAddress.landmark}` : ''}, Phone: ${orderForm.deliveryAddress.phoneNumber}`;

      const orders = [];
      
      // Create cow milk order if quantity > 0
      if (orderForm.cowQuantity > 0) {
        orders.push({
          milkType: "cow",
          quantity: orderForm.cowQuantity,
          rate: milkRates.cow,
          totalAmount: orderForm.cowQuantity * milkRates.cow,
          address: addressString,
          deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          paymentMethod: selectedPaymentMethod,
          paymentCompleted: selectedPaymentMethod !== "cod",
          // Include live location if enabled
          ...(liveLocation.enabled && liveLocation.coordinates && {
            liveLocation: {
              latitude: liveLocation.coordinates.latitude,
              longitude: liveLocation.coordinates.longitude,
              accuracy: liveLocation.accuracy,
              timestamp: new Date(),
              isLive: true
            }
          })
        });
      }
      
      // Create buffalo milk order if quantity > 0
      if (orderForm.buffaloQuantity > 0) {
        orders.push({
          milkType: "buffalo",
          quantity: orderForm.buffaloQuantity,
          rate: milkRates.buffalo,
          totalAmount: orderForm.buffaloQuantity * milkRates.buffalo,
          address: addressString,
          deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          paymentMethod: selectedPaymentMethod,
          paymentCompleted: selectedPaymentMethod !== "cod",
          // Include live location if enabled
          ...(liveLocation.enabled && liveLocation.coordinates && {
            liveLocation: {
              latitude: liveLocation.coordinates.latitude,
              longitude: liveLocation.coordinates.longitude,
              accuracy: liveLocation.accuracy,
              timestamp: new Date(),
              isLive: true
            }
          })
        });
      }

      // Place all orders
      const orderResponses = await Promise.all(
        orders.map(orderData => api.post("/api/buyer/place-order", orderData))
      );
      
      // Check if all orders succeeded
      const allSuccess = orderResponses.every(response => response.data.success);
      
      if (allSuccess) {
        setOrderSuccess(true);
        setOrderData(orderResponses[0].data.data); // Store first order data for receipt
        setStep(4);
        
        // Trigger dashboard refresh callback if provided
        if (onOrderSuccess) {
          console.log('🔄 Order placed successfully, triggering dashboard refresh...');
          onOrderSuccess();
        } else {
          console.warn('⚠️ onOrderSuccess callback not provided');
        }
        
        // AGGRESSIVE FIX: Force page reload after 2 seconds to ensure quantities update
        console.log('🔄 Scheduling page reload in 2 seconds to ensure milk quantities update...');
        setTimeout(() => {
          console.log('🔄 Reloading page to refresh milk quantities...');
          window.location.reload();
        }, 2000);
        
        // BACKUP FIX: Also try direct API refresh before reload
        setTimeout(() => {
          console.log('🔄 Attempting direct API refresh...');
          fetch('/api/buyer/milk-availability?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
              console.log('📊 Direct API response:', data);
              if (data.data?.sessionMilkCollection) {
                console.log('🥛 Updated quantities from API:', {
                  cow: data.data.sessionMilkCollection.cowMilk,
                  buffalo: data.data.sessionMilkCollection.buffaloMilk
                });
              }
            })
            .catch(err => console.error('❌ Direct API refresh failed:', err));
        }, 1000);
      } else {
        throw new Error("Some orders failed to place");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      
      // Extract error message from backend response
      let errorMessage = "Failed to place order. Please try again.";
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setPaymentError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
      setProcessingPayment(false);
    }
  };

  const generateUPIUrl = () => {
    const amount = calculateTotal();
    return `upi://pay?pa=dairy@upi&pn=Dairy&am=${amount}&cu=INR&tn=Milk Order`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={24} className="text-green-600" />
            Place Order
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Validation Error Popup - Enhanced */}
        {showValidationPopup && validationError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="text-red-600" size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2">
                      Insufficient Milk Available
                    </h3>
                    <p className="text-red-700 mb-4">
                      {validationError}
                    </p>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          console.log("Closing validation popup");
                          setShowValidationPopup(false);
                          setValidationError("");
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        OK, Got It
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= stepNum ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNum ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Order</span>
            <span>Address</span>
            <span>Payment</span>
            <span>Done</span>
          </div>
        </div>

        {/* Step 1: Order Details */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold">Order Details</h3>
            <p className="text-sm text-gray-600">Select milk type(s) and quantity. You can order both cow and buffalo milk together.</p>

            {/* Cow Milk Selection */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐄</span>
                  <div>
                    <div className="font-medium text-blue-800">Cow Milk</div>
                    <div className="text-xs text-blue-600">₹{milkRates.cow}/L</div>
                  </div>
                </div>
                {milkAvailability && (
                  <div className="text-xs text-green-600 font-medium">
                    Available: {milkAvailability.cowMilk}L
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOrderForm({...orderForm, cowQuantity: Math.max(0, orderForm.cowQuantity - 1)})}
                  className="w-10 h-10 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center font-bold text-blue-800"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={orderForm.cowQuantity}
                  onChange={(e) => setOrderForm({...orderForm, cowQuantity: Math.max(0, parseInt(e.target.value) || 0)})}
                  className="w-20 text-center border-2 border-blue-300 rounded-lg px-3 py-2 font-medium"
                  placeholder="0"
                />
                <button
                  onClick={() => setOrderForm({...orderForm, cowQuantity: orderForm.cowQuantity + 1})}
                  className="w-10 h-10 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center font-bold text-blue-800"
                >
                  +
                </button>
                <span className="text-sm text-blue-700 ml-2">Liters</span>
              </div>
              {orderForm.cowQuantity > 0 && (
                <div className="mt-2 text-sm text-blue-700 font-medium">
                  Amount: ₹{(orderForm.cowQuantity * milkRates.cow).toFixed(2)}
                </div>
              )}
            </div>

            {/* Buffalo Milk Selection */}
            <div className="border-2 border-amber-200 rounded-lg p-4 bg-amber-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🐃</span>
                  <div>
                    <div className="font-medium text-amber-800">Buffalo Milk</div>
                    <div className="text-xs text-amber-600">₹{milkRates.buffalo}/L</div>
                  </div>
                </div>
                {milkAvailability && (
                  <div className="text-xs text-green-600 font-medium">
                    Available: {milkAvailability.buffaloMilk}L
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOrderForm({...orderForm, buffaloQuantity: Math.max(0, orderForm.buffaloQuantity - 1)})}
                  className="w-10 h-10 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center font-bold text-amber-800"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  value={orderForm.buffaloQuantity}
                  onChange={(e) => setOrderForm({...orderForm, buffaloQuantity: Math.max(0, parseInt(e.target.value) || 0)})}
                  className="w-20 text-center border-2 border-amber-300 rounded-lg px-3 py-2 font-medium"
                  placeholder="0"
                />
                <button
                  onClick={() => setOrderForm({...orderForm, buffaloQuantity: orderForm.buffaloQuantity + 1})}
                  className="w-10 h-10 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center font-bold text-amber-800"
                >
                  +
                </button>
                <span className="text-sm text-amber-700 ml-2">Liters</span>
              </div>
              {orderForm.buffaloQuantity > 0 && (
                <div className="mt-2 text-sm text-amber-700 font-medium">
                  Amount: ₹{(orderForm.buffaloQuantity * milkRates.buffalo).toFixed(2)}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                {orderForm.cowQuantity > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>🐄 Cow Milk:</span>
                    <span className="font-medium">{orderForm.cowQuantity}L × ₹{milkRates.cow} = ₹{(orderForm.cowQuantity * milkRates.cow).toFixed(2)}</span>
                  </div>
                )}
                {orderForm.buffaloQuantity > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>🐃 Buffalo Milk:</span>
                    <span className="font-medium">{orderForm.buffaloQuantity}L × ₹{milkRates.buffalo} = ₹{(orderForm.buffaloQuantity * milkRates.buffalo).toFixed(2)}</span>
                  </div>
                )}
                {orderForm.cowQuantity === 0 && orderForm.buffaloQuantity === 0 && (
                  <div className="text-center text-gray-500 py-2">
                    No items selected
                  </div>
                )}
                {(orderForm.cowQuantity > 0 || orderForm.buffaloQuantity > 0) && (
                  <>
                    <hr className="my-2 border-green-300" />
                    <div className="flex justify-between font-bold text-lg text-green-600">
                      <span>Total:</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleNextStep}
              disabled={orderForm.cowQuantity === 0 && orderForm.buffaloQuantity === 0}
              className={`w-full font-medium py-3 rounded-lg transition-colors ${
                orderForm.cowQuantity === 0 && orderForm.buffaloQuantity === 0
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {orderForm.cowQuantity === 0 && orderForm.buffaloQuantity === 0 
                ? "Select at least one milk type" 
                : "Continue to Address"}
            </button>
          </div>
        )}

        {/* Step 2: Delivery Address */}
        {step === 2 && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin size={20} />
              Delivery Address
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building/House No. *
                  </label>
                  <input
                    type="text"
                    value={orderForm.deliveryAddress.buildingNo}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      deliveryAddress: {...orderForm.deliveryAddress, buildingNo: e.target.value}
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area/Street *
                  </label>
                  <input
                    type="text"
                    value={orderForm.deliveryAddress.area}
                    onChange={(e) => setOrderForm({
                      ...orderForm,
                      deliveryAddress: {...orderForm.deliveryAddress, area: e.target.value}
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Main Street"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colony/Locality *
                </label>
                <input
                  type="text"
                  value={orderForm.deliveryAddress.colony}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    deliveryAddress: {...orderForm.deliveryAddress, colony: e.target.value}
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Green Valley Colony"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={orderForm.deliveryAddress.landmark}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    deliveryAddress: {...orderForm.deliveryAddress, landmark: e.target.value}
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Near City Mall"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={orderForm.deliveryAddress.phoneNumber}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    deliveryAddress: {...orderForm.deliveryAddress, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)}
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter 10-digit phone number"
                />
              </div>
            </div>

            {/* Live Location Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="text-blue-600" size={20} />
                <h4 className="font-medium text-blue-800">📍 Share Live Location (Optional)</h4>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Share your live location for more accurate delivery. This helps our delivery partner find you easily.
              </p>
              
              {!liveLocation.enabled ? (
                <div className="space-y-3">
                  <button
                    onClick={requestLiveLocation}
                    disabled={liveLocation.loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {liveLocation.loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin size={16} />
                        Share Live Location
                      </>
                    )}
                  </button>
                  {liveLocation.error && (
                    <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                      ❌ {liveLocation.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Live Location Shared</span>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>📍 Lat: {liveLocation.coordinates.latitude.toFixed(6)}</div>
                      <div>📍 Lng: {liveLocation.coordinates.longitude.toFixed(6)}</div>
                      <div>🎯 Accuracy: ~{Math.round(liveLocation.accuracy)}m</div>
                    </div>
                  </div>
                  <button
                    onClick={clearLiveLocation}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} />
                    Remove Live Location
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={!validateAddress()}
                className={`flex-1 font-medium py-3 rounded-lg transition-colors ${
                  validateAddress()
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed"
                }`}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard size={20} />
              Payment Method
            </h3>

            {/* Order Confirmation Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
                <div>
                  <h4 className="font-medium text-yellow-800">Order Cancellation Policy</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You can cancel your order within 10 minutes after payment. 
                    After 10 minutes, cancellation is allowed without refund as the order will be dispatched.
                  </p>
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Final Bill</h4>
              <div className="space-y-2 text-sm">
                {orderForm.cowQuantity > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>🐄 Cow Milk:</span>
                    <span>{orderForm.cowQuantity}L × ₹{milkRates.cow} = ₹{(orderForm.cowQuantity * milkRates.cow).toFixed(2)}</span>
                  </div>
                )}
                {orderForm.buffaloQuantity > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>🐃 Buffalo Milk:</span>
                    <span>{orderForm.buffaloQuantity}L × ₹{milkRates.buffalo} = ₹{(orderForm.buffaloQuantity * milkRates.buffalo).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="text-green-600">Free</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Error Display */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-medium text-red-800">Payment Failed</h4>
                    <p className="text-sm text-red-700 mt-1">{paymentError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code Display */}
            {showQR && (
              <div className="text-center">
                <h4 className="font-semibold mb-3">Scan QR Code to Pay</h4>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateUPIUrl())}`}
                  alt="UPI QR Code"
                  className="mx-auto mb-3 border rounded-lg"
                />
                <p className="text-sm text-gray-600">
                  Scan with any UPI app to pay ₹{calculateTotal().toFixed(2)}
                </p>
                {processingPayment && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 mt-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Processing payment...</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Processing */}
            {processingPayment && paymentMethod === 'card' && !showQR && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="font-medium">Processing card payment...</span>
                </div>
                <p className="text-sm text-gray-600">Please wait while we process your payment</p>
                <div className="mt-3 text-xs text-gray-500">
                  Do not close this window or refresh the page
                </div>
              </div>
            )}

            {processingPayment && paymentMethod === 'cod' && !showQR && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <span className="font-medium">Confirming COD order...</span>
                </div>
                <p className="text-sm text-gray-600">Verifying delivery details and confirming your order</p>
              </div>
            )}

            {/* Payment Options */}
            {!processingPayment && !showQR && (
              <div className="space-y-3">
                <button
                  onClick={() => handlePaymentSelect('cod')}
                  disabled={loading}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl">💵</span>
                  <div className="text-left">
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">Pay when you receive the milk</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentSelect('upi')}
                  disabled={loading}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <div className="font-medium">UPI Payment</div>
                    <div className="text-sm text-gray-600">Pay using UPI QR code</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePaymentSelect('card')}
                  disabled={loading}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl">💳</span>
                  <div className="text-left">
                    <div className="font-medium">Card Payment</div>
                    <div className="text-sm text-gray-600">Pay using debit/credit card</div>
                  </div>
                </button>
              </div>
            )}

            {/* Retry Payment Button */}
            {paymentError && !processingPayment && (
              <button
                onClick={() => {
                  setPaymentError("");
                  setPaymentMethod("");
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Try Different Payment Method
              </button>
            )}

            {!processingPayment && !showQR && !paymentError && (
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back to Address
              </button>
            )}
          </div>
        )}

        {/* Step 4: Success with Receipt */}
        {step === 4 && orderSuccess && (
          <div className="p-6 space-y-6">
            {/* Success Header */}
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Order Placed Successfully!</h3>
              <p className="text-gray-600">
                Your order has been confirmed and will be delivered tomorrow morning.
              </p>
            </div>

            {/* Receipt */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg print:shadow-none print:border-black">
              {/* Receipt Header */}
              <div className="text-center border-b border-gray-200 pb-4 mb-4 print:border-black">
                <h4 className="text-lg font-bold text-gray-800">🥛 DAIRY RECEIPT</h4>
                <p className="text-sm text-gray-600">Order Confirmation</p>
                {orderData && (
                  <p className="text-xs text-gray-500 mt-1">Order ID: #{orderData._id?.slice(-8).toUpperCase()}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleString()}</p>
              </div>

              {/* Order Details */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Date:</span>
                  <span className="font-medium">{new Date(Date.now() + 86400000).toLocaleDateString()}</span>
                </div>
                {orderForm.cowQuantity > 0 && (
                  <>
                    <div className="flex justify-between text-blue-700">
                      <span className="text-gray-600">🐄 Cow Milk:</span>
                      <span className="font-medium">{orderForm.cowQuantity}L</span>
                    </div>
                    <div className="flex justify-between text-blue-700">
                      <span className="text-gray-600 pl-6">Rate:</span>
                      <span className="font-medium">₹{milkRates.cow}/L</span>
                    </div>
                    <div className="flex justify-between text-blue-700">
                      <span className="text-gray-600 pl-6">Amount:</span>
                      <span className="font-medium">₹{(orderForm.cowQuantity * milkRates.cow).toFixed(2)}</span>
                    </div>
                  </>
                )}
                {orderForm.buffaloQuantity > 0 && (
                  <>
                    <div className="flex justify-between text-amber-700">
                      <span className="text-gray-600">🐃 Buffalo Milk:</span>
                      <span className="font-medium">{orderForm.buffaloQuantity}L</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span className="text-gray-600 pl-6">Rate:</span>
                      <span className="font-medium">₹{milkRates.buffalo}/L</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span className="text-gray-600 pl-6">Amount:</span>
                      <span className="font-medium">₹{(orderForm.buffaloQuantity * milkRates.buffalo).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges:</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-3 mb-4 print:border-black">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600 print:text-black">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    {paymentMethod === "cod" ? "💵 Cash on Delivery" :
                     paymentMethod === "upi" ? "📱 UPI Payment" :
                     paymentMethod === "card" ? "💳 Card Payment" : paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-medium ${paymentMethod === "cod" ? "text-orange-600" : "text-green-600"}`}>
                    {paymentMethod === "cod" ? "Pending (COD)" : "Completed"}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h5 className="font-medium text-blue-800 mb-2">📍 Delivery Address</h5>
                <div className="text-sm text-blue-700">
                  <div>{orderForm.deliveryAddress.buildingNo}, {orderForm.deliveryAddress.area}</div>
                  <div>{orderForm.deliveryAddress.colony}</div>
                  {orderForm.deliveryAddress.landmark && (
                    <div>Near {orderForm.deliveryAddress.landmark}</div>
                  )}
                  <div className="mt-1">📞 {orderForm.deliveryAddress.phoneNumber}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 print:hidden">
              <button
                onClick={() => {
                  // Print receipt functionality
                  window.print();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                🖨️ Print Receipt
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  // Refresh the page to update order status if we're on the orders page
                  if (window.location.pathname.includes('order') || window.location.pathname.includes('buyer')) {
                    window.location.reload();
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Done - View My Orders
              </button>
            </div>

            {/* Order Status Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 print:hidden">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">ℹ️</span>
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">What's Next?</p>
                  <p>Your order is now in the system and will be processed for delivery. You can track your order status in the "My Orders" section.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceOrderModal;