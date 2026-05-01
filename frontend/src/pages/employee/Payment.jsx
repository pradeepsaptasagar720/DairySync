import { useState, useEffect, useReducer } from "react";
import { CheckCircle } from "lucide-react";
import { EmployeeService } from "../../services/employee.service";

// Component imports
import PaymentHeader from "./components/PaymentHeader";
import BillGenerator from "./components/BillGenerator";
import PaymentList from "./components/PaymentList";
import PaymentModal from "./components/PaymentModal";

// Payment Lock Manager for bulletproof status persistence
class PaymentLockManager {
  constructor() {
    this.locks = new Map(); // farmerId -> lock info
    this.lockStorage = 'payment_locks';
    this.loadLocks();
  }
  
  // Load locks from localStorage
  loadLocks() {
    try {
      const stored = localStorage.getItem(this.lockStorage);
      if (stored) {
        const lockData = JSON.parse(stored);
        Object.entries(lockData).forEach(([farmerId, lock]) => {
          this.locks.set(farmerId, {
            ...lock,
            timestamp: new Date(lock.timestamp)
          });
        });
        console.log(`[PaymentLockManager] Loaded ${this.locks.size} payment locks from storage`);
      }
    } catch (error) {
      console.error('[PaymentLockManager] Error loading locks:', error);
      this.locks.clear();
    }
  }
  
  // Persist locks to localStorage
  persistLocks() {
    try {
      const lockData = {};
      this.locks.forEach((lock, farmerId) => {
        lockData[farmerId] = {
          ...lock,
          timestamp: lock.timestamp.toISOString()
        };
      });
      localStorage.setItem(this.lockStorage, JSON.stringify(lockData));
      console.log(`[PaymentLockManager] Persisted ${this.locks.size} payment locks to storage`);
    } catch (error) {
      console.error('[PaymentLockManager] Error persisting locks:', error);
    }
  }
  
  // Lock a payment to prevent status changes
  lockPayment(farmerId, amount, timestamp = new Date()) {
    const lock = {
      farmerId,
      amount: parseFloat(amount),
      timestamp: new Date(timestamp),
      locked: true,
      source: 'local_processing'
    };
    
    this.locks.set(farmerId, lock);
    this.persistLocks();
    console.log(`[PaymentLockManager] Locked payment for farmer ${farmerId}:`, lock);
    return lock;
  }
  
  // Check if a payment is locked
  isPaymentLocked(farmerId) {
    const lock = this.locks.get(farmerId);
    return lock && lock.locked;
  }
  
  // Get lock information
  getLock(farmerId) {
    return this.locks.get(farmerId);
  }
  
  // Unlock a specific payment
  unlockPayment(farmerId) {
    if (this.locks.has(farmerId)) {
      this.locks.delete(farmerId);
      this.persistLocks();
      console.log(`[PaymentLockManager] Unlocked payment for farmer ${farmerId}`);
    }
  }
  
  // Clear all locks (used when generating new bill)
  clearAllLocks() {
    const count = this.locks.size;
    this.locks.clear();
    this.persistLocks();
    console.log(`[PaymentLockManager] Cleared all ${count} payment locks`);
  }
  
  // Clean up expired locks (optional, for maintenance)
  cleanupExpiredLocks(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    const before = this.locks.size;
    
    for (const [farmerId, lock] of this.locks.entries()) {
      if (lock.timestamp < cutoff) {
        this.locks.delete(farmerId);
      }
    }
    
    const after = this.locks.size;
    if (before !== after) {
      this.persistLocks();
      console.log(`[PaymentLockManager] Cleaned up ${before - after} expired locks`);
    }
  }
}

// Global payment lock manager instance
const paymentLockManager = new PaymentLockManager();

// Payment state reducer for atomic operations
const paymentStateReducer = (state, action) => {
  console.log(`[PaymentStateReducer] Action: ${action.type}`, action);
  
  switch (action.type) {
    case 'PROCESS_PAYMENT_START':
      return {
        ...state,
        processing: new Set([...state.processing, action.farmerId]),
        errors: new Map([...state.errors].filter(([id]) => id !== action.farmerId))
      };
      
    case 'PROCESS_PAYMENT_SUCCESS': {
      const newPaymentStatus = new Map(state.paymentStatus);
      const newPendingFarmers = new Set(state.pendingFarmers);
      
      // Lock the payment to prevent future changes
      paymentLockManager.lockPayment(
        action.farmerId, 
        action.amount, 
        action.timestamp
      );
      
      // Update payment status atomically
      newPaymentStatus.set(action.farmerId, action.amount);
      newPendingFarmers.delete(action.farmerId);
      
      console.log(`[PaymentStateReducer] Payment success for farmer ${action.farmerId}, amount: ${action.amount}`);
      
      return {
        ...state,
        paymentStatus: newPaymentStatus,
        pendingFarmers: newPendingFarmers,
        processing: new Set([...state.processing].filter(id => id !== action.farmerId)),
        lastUpdate: action.timestamp
      };
    }
    
    case 'PROCESS_PAYMENT_FAILED':
      return {
        ...state,
        processing: new Set([...state.processing].filter(id => id !== action.farmerId)),
        errors: new Map([...state.errors, [action.farmerId, action.error]])
      };
      
    case 'API_RESPONSE_RECEIVED':
      return mergeApiResponse(state, action.payments, action.timestamp);
      
    case 'NEW_BILL_GENERATED': {
      // Clear all locks when generating new bill
      paymentLockManager.clearAllLocks();
      
      return {
        ...state,
        paymentStatus: new Map(),
        pendingFarmers: new Set(),
        processing: new Set(),
        errors: new Map(),
        lastUpdate: action.timestamp,
        lastApiSync: action.timestamp
      };
    }
    
    case 'RESET_STATE':
      return {
        paymentStatus: new Map(),
        pendingFarmers: new Set(),
        processing: new Set(),
        errors: new Map(),
        lastUpdate: new Date(),
        lastApiSync: new Date()
      };
      
    default:
      console.warn(`[PaymentStateReducer] Unknown action type: ${action.type}`);
      return state;
  }
};

// Smart API response merging that respects payment locks
const mergeApiResponse = (currentState, apiPayments, apiTimestamp) => {
  console.log(`[MergeApiResponse] Processing ${apiPayments.length} API payments`);
  
  const newPaymentStatus = new Map(currentState.paymentStatus);
  const newPendingFarmers = new Set(currentState.pendingFarmers);
  let lockedCount = 0;
  let updatedCount = 0;
  let syncedCount = 0;
  
  apiPayments.forEach(payment => {
    const farmerId = payment.farmer?._id;
    if (!farmerId) return;
    
    // Check if payment is locked (processed locally)
    const isLocked = paymentLockManager.isPaymentLocked(farmerId);
    const lock = paymentLockManager.getLock(farmerId);
    
    if (isLocked) {
      lockedCount++;
      
      // If API shows completed payment matching our lock, sync the lock with API data
      if (payment.status === 'completed') {
        const apiAmount = payment.amount || 0;
        const lockAmount = lock.amount;
        
        // If amounts match (within small tolerance), consider it synced
        if (Math.abs(apiAmount - lockAmount) < 0.01) {
          syncedCount++;
          console.log(`[MergeApiResponse] Lock synced with API for farmer ${farmerId} (amount: ${apiAmount})`);
          // Keep the locked status but ensure payment status is set
          newPaymentStatus.set(farmerId, lockAmount);
          newPendingFarmers.delete(farmerId);
        } else {
          console.log(`[MergeApiResponse] Lock amount mismatch for farmer ${farmerId} - API: ${apiAmount}, Lock: ${lockAmount}`);
          // Keep local lock value
          newPaymentStatus.set(farmerId, lockAmount);
        }
      } else {
        console.log(`[MergeApiResponse] Preserving locked payment for farmer ${farmerId} (API status: ${payment.status})`);
        // Preserve locked payment status
        newPaymentStatus.set(farmerId, lock.amount);
        newPendingFarmers.delete(farmerId);
      }
      return;
    }
    
    // For non-locked payments, apply API updates
    updatedCount++;
    if (payment.status === 'completed') {
      const currentPaid = newPaymentStatus.get(farmerId) || 0;
      const newAmount = currentPaid + (payment.amount || 0);
      newPaymentStatus.set(farmerId, newAmount);
      newPendingFarmers.delete(farmerId);
      console.log(`[MergeApiResponse] Updated payment for farmer ${farmerId}: ${newAmount}`);
    } else if (payment.status === 'pending') {
      newPendingFarmers.add(farmerId);
      console.log(`[MergeApiResponse] Marked farmer ${farmerId} as pending`);
    }
  });
  
  console.log(`[MergeApiResponse] Summary - Locked: ${lockedCount}, Synced: ${syncedCount}, Updated: ${updatedCount}`);
  
  return {
    ...currentState,
    paymentStatus: newPaymentStatus,
    pendingFarmers: newPendingFarmers,
    lastApiSync: apiTimestamp
  };
};

export default function Payment() {
  // Core state
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [billData, setBillData] = useState(null);
  const [showBill, setShowBill] = useState(false);
  
  // Payment history
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  // Atomic payment state management
  const [paymentState, dispatch] = useReducer(paymentStateReducer, {
    paymentStatus: new Map(),
    pendingFarmers: new Set(),
    processing: new Set(),
    errors: new Map(),
    lastUpdate: new Date(),
    lastApiSync: new Date()
  });
  
  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [animationType, setAnimationType] = useState('');
  
  // Form state
  const [billFilters, setBillFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    farmerType: 'all',
    farmerMobile: '',
    selectedFarmerId: ''
  });

  const [paymentData, setPaymentData] = useState({
    farmerId: '',
    farmerName: '',
    totalAmount: 0,
    paymentType: 'cash',
    notes: ''
  });

  // Initialize component
  useEffect(() => {
    fetchFarmers();
    // Clean up expired locks on component mount
    paymentLockManager.cleanupExpiredLocks();
  }, []);

  // Debug function for payment status inspection
  const debugPaymentStatus = () => {
    console.group('[PaymentStatus Debug]');
    console.log('Payment Status Map:', Array.from(paymentState.paymentStatus.entries()));
    console.log('Pending Farmers:', Array.from(paymentState.pendingFarmers));
    console.log('Payment Locks:', Array.from(paymentLockManager.locks.entries()));
    console.log('Processing Queue:', Array.from(paymentState.processing));
    console.log('Errors:', Array.from(paymentState.errors.entries()));
    console.log('Last Update:', paymentState.lastUpdate);
    console.log('Last API Sync:', paymentState.lastApiSync);
    console.groupEnd();
  };

  // Add debug function to window for easy access (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugPaymentStatus = debugPaymentStatus;
      console.log('Debug function available: window.debugPaymentStatus()');
    }
  }, [paymentState]);

  // Fetch farmers list
  const fetchFarmers = async () => {
    try {
      const response = await EmployeeService.getFarmers();
      setFarmers(response.data.data?.farmers || []);
    } catch (err) {
      console.error('Error fetching farmers:', err);
    }
  };

  // Calculate payment status for a farmer
  const getPaymentStatus = (farmer) => {
    const farmerId = farmer.farmerId;
    const totalBillAmount = farmer.totalAmount;
    const paidAmount = paymentState.paymentStatus.get(farmerId) || 0;
    const remainingAmount = Math.max(0, totalBillAmount - paidAmount);
    const isLocked = paymentLockManager.isPaymentLocked(farmerId);
    const isProcessing = paymentState.processing.has(farmerId);
    
    console.log(`Payment status for farmer ${farmerId}:`, {
      farmerName: farmer.farmerName,
      totalBillAmount,
      paidAmount,
      remainingAmount,
      isPending: paymentState.pendingFarmers.has(farmerId),
      isLocked,
      isProcessing,
      billPeriod: { dateFrom: billFilters.dateFrom, dateTo: billFilters.dateTo }
    });
    
    if (isProcessing) {
      return { status: 'processing', remainingAmount: totalBillAmount };
    } else if (isLocked || remainingAmount <= 0.01) {
      return { status: 'paid', remainingAmount: 0 };
    } else if (paymentState.pendingFarmers.has(farmerId)) {
      return { status: 'pending', remainingAmount: totalBillAmount };
    } else {
      return { status: 'unpaid', remainingAmount };
    }
  };

  // Fetch payment history and update status
  const fetchPaymentHistory = async (customFilters = null) => {
    try {
      // Use custom filters if provided, otherwise use current bill filters
      const filters = customFilters || {
        dateFrom: billFilters.dateFrom,
        dateTo: billFilters.dateTo
      };
      
      console.log('[FetchPaymentHistory] Fetching payment history for period:', filters);
      
      const response = await EmployeeService.getPaymentHistory(filters);
      const payments = response.data.data?.payments || [];
      setPaymentHistory(payments);
      
      console.log(`[FetchPaymentHistory] Found ${payments.length} payments for period`);
      
      // Always use merge logic to preserve locks
      // The mergeApiResponse function will respect locked payments
      dispatch({
        type: 'API_RESPONSE_RECEIVED',
        payments,
        timestamp: new Date()
      });
      
      // Log locked payments for debugging
      const lockedPayments = Array.from(paymentLockManager.locks.keys());
      if (lockedPayments.length > 0) {
        console.log(`[FetchPaymentHistory] ${lockedPayments.length} payments are locked and protected from API updates:`, lockedPayments);
      }
      
    } catch (err) {
      console.error('[FetchPaymentHistory] Error fetching payment history:', err);
      throw err;
    }
  };



  // Generate bill
  const generateBill = async (filters) => {
    if (!filters.dateFrom || !filters.dateTo) {
      alert('Please select both start and end dates');
      return;
    }

    if (filters.farmerType === 'specific' && !filters.farmerMobile && !filters.selectedFarmerId) {
      alert('Please enter farmer mobile number or select a farmer');
      return;
    }

    setLoading(true);
    try {
      const params = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        farmerType: filters.farmerType
      };

      if (filters.farmerType === 'specific') {
        if (filters.farmerMobile) {
          params.farmerMobile = filters.farmerMobile;
        } else if (filters.selectedFarmerId) {
          params.farmerId = filters.selectedFarmerId;
        }
      }

      const response = await EmployeeService.generateFarmerBill(params);
      setBillData(response.data.data);
      setShowBill(true);
      
      // Check if date range changed - only clear locks if it did
      const dateRangeChanged = 
        billFilters.dateFrom !== filters.dateFrom || 
        billFilters.dateTo !== filters.dateTo;
      
      if (dateRangeChanged) {
        console.log('[GenerateBill] Date range changed - clearing all locks');
        // Reset state for new bill period (clears all locks)
        dispatch({
          type: 'NEW_BILL_GENERATED',
          billData: response.data.data,
          timestamp: new Date()
        });
      } else {
        console.log('[GenerateBill] Same date range - preserving payment locks');
        // Don't clear locks, just fetch fresh payment history
      }
      
      // Fetch fresh payment history (will respect existing locks)
      await fetchPaymentHistory(); // Use merge logic to preserve locks
    } catch (err) {
      console.error('Error generating bill:', err);
      alert(`Failed to generate bill: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Process payment with atomic state management
  const processPayment = async (paymentInfo) => {
    const farmerId = paymentInfo.farmerId;
    const amount = paymentInfo.totalAmount;
    
    // Start processing (atomic state update)
    dispatch({
      type: 'PROCESS_PAYMENT_START',
      farmerId,
      timestamp: new Date()
    });
    
    setLoading(true);
    
    try {
      // Find farmer data for cow/buffalo amounts
      const farmer = billData?.farmers?.find(f => f.farmerId === paymentInfo.farmerId) || 
                    billData?.farmer;
      
      const paymentPayload = {
        farmerId: paymentInfo.farmerId,
        amount: paymentInfo.totalAmount,
        cowMilkAmount: farmer?.cowMilk?.amount || 0,
        buffaloMilkAmount: farmer?.buffaloMilk?.amount || 0,
        paymentType: paymentInfo.paymentType,
        notes: paymentInfo.notes,
        billPeriod: {
          dateFrom: billFilters.dateFrom,
          dateTo: billFilters.dateTo
        },
        status: 'completed'
      };

      console.log('[ProcessPayment] Starting payment processing:', paymentPayload);

      const response = await EmployeeService.processPayment(paymentPayload);
      
      console.log('[ProcessPayment] Payment processed successfully:', response.data);
      
      // Success - lock payment and update state atomically
      dispatch({
        type: 'PROCESS_PAYMENT_SUCCESS',
        farmerId,
        amount,
        timestamp: new Date(),
        response: response.data
      });

      // Set animation and show confirmation
      setAnimationType(paymentInfo.paymentType);
      setPaymentData(paymentInfo);
      setShowConfirmationModal(true);
      setShowPaymentModal(false);
      
      // Schedule delayed API refresh (locked payments won't be overwritten)
      setTimeout(() => {
        console.log('[ProcessPayment] Starting delayed API refresh...');
        fetchPaymentHistory().catch(err => {
          console.error('Failed to refresh payment history:', err);
        });
      }, 3000); // Increased delay for better reliability
      
    } catch (err) {
      console.error('Error processing payment:', err);
      
      // Failure - revert state and show error
      dispatch({
        type: 'PROCESS_PAYMENT_FAILED',
        farmerId,
        error: err.message,
        timestamp: new Date()
      });
      
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open payment modal
  const openPaymentModal = (farmer) => {
    const status = getPaymentStatus(farmer);
    setSelectedFarmer(farmer);
    setPaymentData({
      farmerId: farmer.farmerId,
      farmerName: farmer.farmerName,
      totalAmount: status.remainingAmount,
      paymentType: 'cash',
      notes: ''
    });
    setShowPaymentModal(true);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <PaymentHeader />

      {/* Bill Generator */}
      <BillGenerator
        filters={billFilters}
        onFiltersChange={setBillFilters}
        onGenerateBill={generateBill}
        loading={loading}
        farmers={farmers}
      />

      {/* Payment List */}
      {showBill && billData && (
        <PaymentList
          billData={billData}
          paymentStatus={paymentState.paymentStatus}
          pendingFarmers={paymentState.pendingFarmers}
          onProcessPayment={openPaymentModal}
          getPaymentStatus={getPaymentStatus}
          filters={billFilters}
        />
      )}

      {/* No Data Message */}
      {!showBill && !loading && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Farmer Payment Processing</h2>
          <p className="text-gray-600">
            Generate bills and process payments for farmers efficiently.
          </p>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        farmer={selectedFarmer}
        paymentData={paymentData}
        onPaymentDataChange={setPaymentData}
        onClose={() => setShowPaymentModal(false)}
        onProcessPayment={processPayment}
        loading={loading}
      />

      {/* Payment Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-4 text-center">
            <div className="mb-6">
              {/* Payment Type Animations */}
              {animationType === 'cash' && (
                <div className="text-6xl mb-4 animate-bounce">💵</div>
              )}
              {animationType === 'upi' && (
                <div className="text-6xl mb-4 animate-pulse">📱</div>
              )}
              {animationType === 'bank_transfer' && (
                <div className="text-6xl mb-4 animate-pulse">🏦</div>
              )}
              {(animationType === 'cheque' || animationType === 'other') && (
                <div className="text-6xl mb-4 animate-pulse">📄</div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle size={24} />
                <h3 className="text-xl font-semibold">Payment Processed Successfully!</h3>
              </div>
              
              <div className="text-gray-600">
                <p className="font-medium">{paymentData.farmerName}</p>
                <p className="text-sm">₹{paymentData.totalAmount.toFixed(2)} via {paymentData.paymentType.replace('_', ' ').toUpperCase()}</p>
              </div>

              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setPaymentData({
                    farmerId: '',
                    farmerName: '',
                    totalAmount: 0,
                    paymentType: 'cash',
                    notes: ''
                  });
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}