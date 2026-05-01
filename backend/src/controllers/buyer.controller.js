import User from "../models/User.model.js";
import Delivery from "../models/Delivery.model.js";
import RateChart from "../models/RateChart.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

// Place a new order
export const placeOrder = asyncHandler(async (req, res) => {
  const { milkType, quantity, rate, totalAmount, address, deliveryDate, paymentMethod, paymentCompleted, liveLocation } = req.body;
  const buyerId = req.user.id;

  // Debug logging
  console.log('=== Place Order Request ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Buyer ID:', buyerId);
  console.log('Extracted fields:', { milkType, quantity, rate, totalAmount, address, deliveryDate, paymentMethod, paymentCompleted });

  // Validation
  if (!milkType || !quantity || !rate || !totalAmount || !address || !deliveryDate) {
    console.log('❌ Validation failed - missing fields');
    console.log('Missing:', {
      milkType: !milkType,
      quantity: !quantity,
      rate: !rate,
      totalAmount: !totalAmount,
      address: !address,
      deliveryDate: !deliveryDate
    });
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "All fields are required: milkType, quantity, rate, totalAmount, address, deliveryDate"
      }
    });
  }

  if (!["cow", "buffalo"].includes(milkType)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_MILK_TYPE",
        message: "Milk type must be either 'cow' or 'buffalo'"
      }
    });
  }

  if (quantity <= 0 || rate <= 0 || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_VALUES",
        message: "Quantity, rate, and total amount must be positive numbers"
      }
    });
  }

  // Verify the buyer exists and is approved
  const buyer = await User.findById(buyerId);
  if (!buyer || buyer.role !== "buyer" || !buyer.approved) {
    return res.status(403).json({
      success: false,
      error: {
        code: "UNAUTHORIZED_BUYER",
        message: "Only approved buyers can place orders"
      }
    });
  }

  // Check milk availability against current session
  try {
    console.log('🔍 Starting milk availability check...');
    const { calculateSessionMilkCollection } = await import("../utils/milkCalculations.js");
    
    // Get current dairy info to determine active session
    const DairyInfo = (await import("../models/DairyInfo.model.js")).default;
    const dairyInfo = await DairyInfo.findOne({});
    console.log('📊 Dairy info found:', dairyInfo ? 'Yes' : 'No');
    
    let currentSession = "Morning";
    let isDairyOpen = false;
    
    if (dairyInfo) {
      const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const currentTimeStr = now.toTimeString().slice(0, 5);
      const currentMinutes = parseInt(currentTimeStr.split(':')[0]) * 60 + parseInt(currentTimeStr.split(':')[1]);
      
      const timeToMinutes = (timeStr) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
      };
      
      const morningStart = timeToMinutes(dairyInfo.morningOpenTime);
      const morningEnd = timeToMinutes(dairyInfo.morningCloseTime);
      const eveningStart = timeToMinutes(dairyInfo.eveningOpenTime);
      const eveningEnd = timeToMinutes(dairyInfo.eveningCloseTime);
      
      // Check morning session (handle midnight crossing)
      if (morningStart !== null && morningEnd !== null) {
        if (morningStart > morningEnd) {
          // Morning session crosses midnight
          if (currentMinutes >= morningStart || currentMinutes < morningEnd) {
            currentSession = "Morning";
            isDairyOpen = true;
          }
        } else {
          // Normal morning session
          if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
            currentSession = "Morning";
            isDairyOpen = true;
          }
        }
      }
      
      // Check evening session (handle midnight crossing)
      if (!isDairyOpen && eveningStart !== null && eveningEnd !== null) {
        if (eveningStart > eveningEnd) {
          // Evening session crosses midnight
          if (currentMinutes >= eveningStart || currentMinutes < eveningEnd) {
            currentSession = "Evening";
            isDairyOpen = true;
          }
        } else {
          // Normal evening session
          if (currentMinutes >= eveningStart && currentMinutes < eveningEnd) {
            currentSession = "Evening";
            isDairyOpen = true;
          }
        }
      }
    }

    console.log('🏪 Dairy status:', { isDairyOpen, currentSession });
    
    if (!isDairyOpen) {
      console.log('❌ Dairy is closed - rejecting order');
      return res.status(400).json({
        success: false,
        error: {
          code: "DAIRY_CLOSED",
          message: "Dairy is currently closed. Orders can only be placed during operating hours."
        }
      });
    }

    // Get current session availability
    const istNow2 = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const pad2 = (n) => String(n).padStart(2, '0');
    const today = `${istNow2.getFullYear()}-${pad2(istNow2.getMonth() + 1)}-${pad2(istNow2.getDate())}`;
    console.log('📅 Checking availability for:', { today, currentSession });
    const sessionData = await calculateSessionMilkCollection(today, currentSession);
    console.log('📦 Session data:', sessionData);
    
    const availableQuantity = milkType === "cow" ? sessionData.cowMilk : sessionData.buffaloMilk;
    console.log('🥛 Available quantity check:', { milkType, availableQuantity, requestedQuantity: quantity });
    
    if (quantity > availableQuantity) {
      console.log('❌ Insufficient milk - rejecting order');
      return res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_MILK",
          message: `Insufficient milk available. Available: ${availableQuantity}L, Requested: ${quantity}L`
        }
      });
    }
    
    console.log('✅ Milk availability check passed');
  } catch (error) {
    console.error("❌ Error checking milk availability:", error);
    console.error("Stack trace:", error.stack);
    // Continue with order if availability check fails (fallback)
  }

  // Create the delivery/order with payment information
  console.log('📝 Creating order data...');
  const orderData = {
    buyer: buyerId,
    milkType,
    quantity,
    rate,
    totalAmount,
    address,
    deliveryDate: new Date(deliveryDate),
    status: "Pending",
    paymentMethod: paymentMethod || "cod",
    paymentCompleted: paymentCompleted || false
  };
  console.log('📦 Order data prepared:', JSON.stringify(orderData, null, 2));

  // Add live location if provided
  if (liveLocation && liveLocation.latitude && liveLocation.longitude) {
    orderData.liveLocation = {
      latitude: liveLocation.latitude,
      longitude: liveLocation.longitude,
      accuracy: liveLocation.accuracy || null,
      timestamp: liveLocation.timestamp ? new Date(liveLocation.timestamp) : new Date(),
      isLive: liveLocation.isLive || false
    };
  }

  // Set payment date if payment is completed
  if (paymentCompleted) {
    orderData.paymentDate = new Date();
  }

  console.log('💾 Saving order to database...');
  const order = new Delivery(orderData);
  await order.save();
  console.log('✅ Order saved successfully:', order._id);

  // Populate buyer information for response
  await order.populate('buyer', 'username mobile email');

  console.log('🎉 Order placement complete - sending success response');
  res.status(201).json({
    success: true,
    data: order,
    message: "Order placed successfully. Awaiting approval."
  });
});

// Get buyer's current orders (Active orders + today's completed orders)
export const getOrders = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;

  // Calculate today's midnight timestamp
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Show all active orders (Pending, Accepted, Out for Delivery) 
  // AND Completed orders only if completed today (after midnight)
  const orders = await Delivery.find({ 
    buyer: buyerId,
    $or: [
      // All active orders (no date restriction)
      { status: { $in: ["Pending", "Accepted", "Out for Delivery"] } },
      // Completed orders only if completed today
      { 
        status: "Completed",
        completedAt: { $gte: todayMidnight }
      }
    ]
  })
    .populate("buyer", "name email")
    .populate("handledBy", "name")
    .populate("deliveryPersonId", "username mobile uniqueId")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
    message: "Active orders retrieved successfully"
  });
});

// Get order history (Completed and Cancelled orders only)
export const getOrderHistory = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;

  // Show only terminal state orders: Completed and Cancelled
  const orderHistory = await Delivery.find({ 
    buyer: buyerId,
    status: { $in: ["Completed", "Cancelled"] }
  })
    .populate("buyer", "name email")
    .populate("handledBy", "name")
    .sort({ deliveryDate: -1 });

  res.json({
    success: true,
    data: orderHistory,
    message: "Order history retrieved successfully"
  });
});

// Get purchase history with analytics
export const getPurchaseHistory = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;

  const purchases = await Delivery.find({ 
    buyer: buyerId,
    status: "Completed"
  })
    .populate("buyer", "name email")
    .sort({ deliveryDate: -1 });

  res.json({
    success: true,
    data: purchases,
    message: "Purchase history retrieved successfully"
  });
});

// Get buyer dashboard stats
export const getDashboard = asyncHandler(async (req, res) => {
  const buyerId = req.user.id;

  // Calculate today's date range
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Get order statistics
  const totalOrders = await Delivery.countDocuments({ buyer: buyerId });
  const pendingOrders = await Delivery.countDocuments({ buyer: buyerId, status: "Pending" });
  const completedOrders = await Delivery.countDocuments({ buyer: buyerId, status: "Completed" });

  // Get today's orders
  const todayOrders = await Delivery.countDocuments({
    buyer: buyerId,
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });

  // Calculate total spent
  const totalSpentResult = await Delivery.aggregate([
    {
      $match: {
        buyer: buyerId,
        status: "Completed"
      }
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$totalAmount" },
        totalLiters: { $sum: "$quantity" }
      }
    }
  ]);

  const totalSpent = totalSpentResult[0]?.totalSpent || 0;
  const totalLiters = totalSpentResult[0]?.totalLiters || 0;

  // Get current milk rate
  let currentMilkRate = 0;
  try {
    const rateChart = await RateChart.findOne({});
    currentMilkRate = rateChart ? rateChart.rate : 0;
  } catch (err) {
    console.log("No milk rate found");
  }

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      completedOrders,
      todayOrders,
      totalSpent,
      totalLiters,
      currentMilkRate
    },
    message: "Buyer dashboard data retrieved successfully"
  });
});

// Get milk availability and rates for buyers
export const getMilkAvailability = asyncHandler(async (req, res) => {
  console.log('\n🔍 === GET MILK AVAILABILITY REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Buyer ID:', req.user?.id);
  
  // Get current dairy info to determine active session
  let currentSession = "Morning"; // Default
  let isDairyOpen = false;
  
  try {
    // Import DairyInfo here to avoid circular dependency
    const DairyInfo = (await import("../models/DairyInfo.model.js")).default;
    const dairyInfo = await DairyInfo.findOne({});
    
    if (dairyInfo) {
      // Get current IST time
      const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const currentTimeStr = now.toTimeString().slice(0, 5);
      const currentMinutes = parseInt(currentTimeStr.split(':')[0]) * 60 + parseInt(currentTimeStr.split(':')[1]);
      
      console.log('Current IST Time:', currentTimeStr, `(${currentMinutes} minutes)`);
      
      // Helper function to convert time string to minutes
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
        
        // Handle sessions that span across midnight (e.g., 22:00 - 02:00)
        if (openMinutes > closeMinutes) {
          // Session crosses midnight
          return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
        }
        
        // Normal session within same day
        if (openMinutes >= closeMinutes) return false; // Invalid range (same time)
        
        return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      };
      
      // Check morning session
      const morningStart = timeToMinutes(dairyInfo.morningOpenTime);
      const morningEnd = timeToMinutes(dairyInfo.morningCloseTime);
      const isMorningSessionValid = morningStart !== null && morningEnd !== null && 
        (morningStart < morningEnd || morningStart > morningEnd); // Allow midnight crossing
      
      console.log('Morning Session:', dairyInfo.morningOpenTime, '-', dairyInfo.morningCloseTime, `(Valid: ${isMorningSessionValid})`);
      
      // Check evening session
      const eveningStart = timeToMinutes(dairyInfo.eveningOpenTime);
      const eveningEnd = timeToMinutes(dairyInfo.eveningCloseTime);
      const isEveningSessionValid = eveningStart !== null && eveningEnd !== null && 
        (eveningStart < eveningEnd || eveningStart > eveningEnd); // Allow midnight crossing
      
      console.log('Evening Session:', dairyInfo.eveningOpenTime, '-', dairyInfo.eveningCloseTime, `(Valid: ${isEveningSessionValid})`);
      
      // Determine current session and if dairy is open
      if (isMorningSessionValid && isTimeInRange(currentMinutes, dairyInfo.morningOpenTime, dairyInfo.morningCloseTime)) {
        currentSession = "Morning";
        isDairyOpen = true;
        console.log('✅ Dairy is OPEN - Morning Session');
      } else if (isEveningSessionValid && isTimeInRange(currentMinutes, dairyInfo.eveningOpenTime, dairyInfo.eveningCloseTime)) {
        currentSession = "Evening";
        isDairyOpen = true;
        console.log('✅ Dairy is OPEN - Evening Session');
      } else {
        // Dairy is closed - no milk availability
        isDairyOpen = false;
        console.log('❌ Dairy is CLOSED');
        // Still determine which session for reference, but availability will be empty
        if (eveningStart && currentMinutes >= eveningStart) {
          currentSession = "Evening";
        } else if (morningEnd && currentMinutes >= morningEnd && eveningStart && currentMinutes < eveningStart) {
          currentSession = "Evening"; // Between sessions
        } else {
          currentSession = "Morning";
        }
        console.log('Reference Session:', currentSession);
      }
    }
  } catch (err) {
    console.log("❌ Error getting dairy info:", err);
  }

  // Get current session milk collection data only (not full day)
  let sessionMilkCollection = {
    cowMilk: 0,
    buffaloMilk: 0,
    totalLiters: 0,
    totalAmount: 0,
    entryCount: 0,
    farmerCount: 0,
    session: currentSession,
    date: new Date().toISOString().split('T')[0]
  };

  // Only get session data if dairy is currently open
  if (isDairyOpen) {
    console.log('📊 Calculating session milk collection...');
    const { calculateSessionMilkCollection } = await import("../utils/milkCalculations.js");
    const istNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const pad = (n) => String(n).padStart(2, '0');
    const today = `${istNow.getFullYear()}-${pad(istNow.getMonth() + 1)}-${pad(istNow.getDate())}`;
    console.log('Date:', today, 'Session:', currentSession);
    sessionMilkCollection = await calculateSessionMilkCollection(today, currentSession);
    console.log('📦 Session Milk Collection Result:');
    console.log('  Cow Milk Available:', sessionMilkCollection.cowMilk, 'L');
    console.log('  Buffalo Milk Available:', sessionMilkCollection.buffaloMilk, 'L');
    console.log('  Total Available:', sessionMilkCollection.totalLiters, 'L');
    console.log('  Cow Reserved:', sessionMilkCollection.cowMilkReserved, 'L');
    console.log('  Buffalo Reserved:', sessionMilkCollection.buffaloMilkReserved, 'L');
    console.log('  Entry Count:', sessionMilkCollection.entryCount);
  } else {
    console.log('⚠️  Dairy closed - returning empty availability');
  }

  // Get current milk rates from admin selling rates
  let milkRates = { cow: 50, buffalo: 60 }; // Default rates
  try {
    // Import DairyInfo here to avoid circular dependency
    const DairyInfo = (await import("../models/DairyInfo.model.js")).default;
    const dairyInfo = await DairyInfo.findOne({});
    
    if (dairyInfo && dairyInfo.sellingRates) {
      const sellingRates = dairyInfo.sellingRates;
      milkRates = {
        cow: parseFloat(sellingRates.cowMilk.rate) || 50,
        buffalo: parseFloat(sellingRates.buffaloMilk.rate) || 60
      };
      console.log('💰 Milk Rates:', milkRates);
    }
  } catch (err) {
    console.log("No selling rates found, using defaults");
  }

  console.log('✅ Sending response to buyer');
  console.log('='.repeat(80), '\n');

  res.json({
    success: true,
    data: {
      sessionMilkCollection,
      currentSession,
      isDairyOpen,
      milkRates
    },
    message: "Current session milk availability retrieved successfully"
  });
});

// Cancel an order (only if status is Pending)
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const buyerId = req.user.id;

  const order = await Delivery.findOne({ _id: orderId, buyer: buyerId });
  
  if (!order) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found"
      }
    });
  }

  if (order.status === "Accepted" || order.status === "Out for Delivery" || order.status === "Completed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "CANNOT_CANCEL",
        message: "Orders that are accepted, out for delivery or completed cannot be cancelled"
      }
    });
  }

  if (order.status === "Cancelled") {
    return res.status(400).json({
      success: false,
      error: {
        code: "ALREADY_CANCELLED",
        message: "Order is already cancelled"
      }
    });
  }

  await Delivery.updateOne({ _id: orderId }, { status: "Cancelled" });

  res.json({
    success: true,
    message: "Order cancelled successfully"
  });
});

// Get dairy time info for buyers
export const getDairyTime = asyncHandler(async (req, res) => {
  // Import DairyInfo here to avoid circular dependency
  const DairyInfo = (await import("../models/DairyInfo.model.js")).default;
  
  try {
    const dairyInfo = await DairyInfo.findOne({});
    
    if (!dairyInfo) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DAIRY_INFO_NOT_FOUND",
          message: "Dairy information not found"
        }
      });
    }

    // Calculate current status
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    let status = "closed";
    if (currentTime >= dairyInfo.openingTime && currentTime <= dairyInfo.closingTime) {
      status = "open";
    }

    res.json({
      success: true,
      data: {
        dairyName: dairyInfo.dairyName,
        openingTime: dairyInfo.openingTime,
        closingTime: dairyInfo.closingTime,
        currentStatus: status,
        currentTime: currentTime
      },
      message: "Dairy time information retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});