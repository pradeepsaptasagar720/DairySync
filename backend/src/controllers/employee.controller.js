import MilkEntry from "../models/MilkEntry.model.js";
import Payment from "../models/Payment.model.js";
import FarmerPayment from "../models/FarmerPayment.model.js";
import Animal from "../models/Animal.model.js";
import User from "../models/User.model.js";
import Billing from "../models/Billing.model.js";
import Transport from "../models/Transport.model.js";
import RateChart from "../models/RateChart.model.js";
import DairyInfo from "../models/DairyInfo.model.js";
import Notification from "../models/Notification.model.js";
import Delivery from "../models/Delivery.model.js";
import { calculateTodayMilkCollection } from "../utils/milkCalculations.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import { sendNotification, scheduleDairyNotifications, getNotificationHistory } from "../services/notification.service.js";
import billingPeriodValidator from "../utils/billingPeriodValidator.js";

// Check if entry already exists for farmer in session
export const checkDuplicateEntry = asyncHandler(async (req, res) => {
  const { farmerId, date, session } = req.query;
  
  if (!farmerId || !date || !session) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Farmer ID, date, and session are required"
      }
    });
  }

  const existingEntry = await MilkEntry.findOne({
    farmer: farmerId,
    date: date,
    session: session
  });

  res.json({
    success: true,
    data: {
      exists: !!existingEntry,
      entry: existingEntry
    },
    message: existingEntry ? "Entry already exists" : "No existing entry found"
  });
});

// Record new milk entry with session support
export const recordMilkEntry = asyncHandler(async (req, res) => {
  const { 
    date, 
    session, 
    time, 
    farmerId, 
    farmerUniqueId, 
    farmerName, 
    cow, 
    buffalo, 
    totalAmount 
  } = req.body;
  
  const employeeId = req.user.id;

  // Get employee details
  const employee = await User.findById(employeeId);
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found"
      }
    });
  }

  // Validate that at least one milk type is provided
  if ((!cow || !cow.quantity) && (!buffalo || !buffalo.quantity)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "NO_MILK_DATA",
        message: "At least one milk type (cow or buffalo) must be provided"
      }
    });
  }

  // Check billing period protection
  try {
    console.log(`[RecordMilkEntry] Checking billing period protection for farmer ${farmerId}, date ${date}`);
    const validation = await billingPeriodValidator.validateMilkEntryOperation(farmerId, date, 'create');
    
    if (!validation.isAllowed) {
      console.log(`[RecordMilkEntry] Entry blocked due to billing period protection:`, validation.protectedPeriods);
      return res.status(403).json({
        success: false,
        error: validation.error
      });
    }
    
    console.log(`[RecordMilkEntry] Billing period validation passed for farmer ${farmerId}, date ${date}`);
  } catch (error) {
    console.error(`[RecordMilkEntry] Error validating billing period protection:`, error);
    // Continue with entry creation but log the validation error
    console.warn(`[RecordMilkEntry] Proceeding with entry creation despite validation error`);
  }

  // Check for duplicate entry - same farmer, same date, same session
  const existingEntry = await MilkEntry.findOne({
    farmer: farmerId,
    date: date,
    session: session
  });

  if (existingEntry) {
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_ENTRY",
        message: "Already entry recorded",
        details: `Entry already exists for farmer ${farmerName} in ${session} session on ${date}`
      }
    });
  }

  const entry = await MilkEntry.create({
    date,
    session,
    time,
    farmer: farmerId,
    farmerUniqueId,
    farmerName,
    collectedBy: employeeId,
    collectedByUniqueId: employee.uniqueId,
    collectedByName: employee.username,
    collectedByRole: employee.role === 'admin' ? 'admin' : 'milk_collector',
    cow: cow || { quantity: 0, fat: 0, rate: 0, amount: 0 },
    buffalo: buffalo || { quantity: 0, fat: 0, rate: 0, amount: 0 },
    totalAmount,
    receiptGenerated: true
  });

  // Populate farmer details for response
  await entry.populate('farmer', 'username uniqueId');

  res.json({
    success: true,
    data: entry,
    message: "Milk entry recorded successfully"
  });
});

// Get milk entries with session support
export const getMilkEntries = asyncHandler(async (req, res) => {
  const { date, session } = req.query;
  
  let filter = {};
  
  // Filter by date if provided
  if (date) {
    filter.date = date;
  }

  // Filter by session if provided
  if (session) {
    filter.session = session;
  }

  const entries = await MilkEntry.find(filter)
    .populate('farmer', 'username uniqueId')
    .populate('collectedBy', 'username uniqueId')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: entries,
    message: "Milk entries retrieved successfully"
  });
});

// Get session summary
export const getSessionSummary = asyncHandler(async (req, res) => {
  const { date, session } = req.query;
  
  if (!date || !session) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Date and session are required"
      }
    });
  }

  const entries = await MilkEntry.find({ date, session });

  const summary = entries.reduce((acc, entry) => {
    acc.cowMilkTotal += entry.cow?.quantity || 0;
    acc.buffaloMilkTotal += entry.buffalo?.quantity || 0;
    acc.totalAmount += entry.totalAmount || 0;
    acc.entryCount += 1;
    
    // Calculate weighted average fat
    const cowFat = (entry.cow?.quantity || 0) * (entry.cow?.fat || 0);
    const buffaloFat = (entry.buffalo?.quantity || 0) * (entry.buffalo?.fat || 0);
    const totalQuantity = (entry.cow?.quantity || 0) + (entry.buffalo?.quantity || 0);
    
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

  res.json({
    success: true,
    data: summary,
    message: "Session summary retrieved successfully"
  });
});

// Get farmer by ID or mobile
export const getFarmerById = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  
  const farmer = await User.findOne({ 
    uniqueId: farmerId.toUpperCase(),
    role: "farmer",
    approved: true 
  });

  if (!farmer) {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found with this ID"
      }
    });
  }

  res.json({
    success: true,
    data: farmer,
    message: "Farmer retrieved successfully"
  });
});

export const getFarmerByMobile = asyncHandler(async (req, res) => {
  const { mobile } = req.params;
  
  const farmer = await User.findOne({ 
    mobile: mobile,
    role: "farmer",
    approved: true 
  });

  if (!farmer) {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found with this mobile number"
      }
    });
  }

  res.json({
    success: true,
    data: farmer,
    message: "Farmer retrieved successfully"
  });
});

// Get rate from rate chart
export const getRate = asyncHandler(async (req, res) => {
  const { milkType, fat } = req.query;
  
  if (!milkType || !fat) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Milk type and fat percentage are required"
      }
    });
  }

  try {
    // Get the latest active rate chart
    const rateChart = await RateChart.findOne({ isActive: true })
      .sort({ effectiveFrom: -1 });

    if (!rateChart) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RATE_CHART_NOT_FOUND",
          message: "No active rate chart found"
        }
      });
    }

    let rate = 0;
    const fatPercentage = parseFloat(fat);

    // Get rates based on milk type
    const rates = milkType === 'cow' ? rateChart.cowRates : rateChart.buffaloRates;
    
    if (rates && rates.length > 0) {
      // Find the closest fat percentage match
      const sortedRates = rates.sort((a, b) => Math.abs(a.fat - fatPercentage) - Math.abs(b.fat - fatPercentage));
      rate = sortedRates[0]?.rate || 0;
    } else {
      // Fallback to legacy rates or default
      if (milkType === 'cow') {
        rate = rateChart.cowMilk?.rate || 50;
      } else {
        rate = rateChart.buffaloMilk?.rate || 60;
      }
    }

    res.json({
      success: true,
      data: { rate },
      message: "Rate retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "RATE_FETCH_ERROR",
        message: "Error fetching rate from rate chart"
      }
    });
  }
});

// Update milk entry
export const updateMilkEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    date, 
    session, 
    time, 
    farmerId, 
    farmerUniqueId, 
    farmerName, 
    cow, 
    buffalo, 
    totalAmount 
  } = req.body;

  const entry = await MilkEntry.findById(id);
  if (!entry) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ENTRY_NOT_FOUND",
        message: "Milk entry not found"
      }
    });
  }

  // Check billing period protection for the original entry date
  const originalFarmerId = entry.farmer.toString();
  const originalDate = entry.date;
  
  try {
    console.log(`[UpdateMilkEntry] Checking billing period protection for original entry - farmer ${originalFarmerId}, date ${originalDate}`);
    const originalValidation = await billingPeriodValidator.validateMilkEntryOperation(originalFarmerId, originalDate, 'update');
    
    if (!originalValidation.isAllowed) {
      console.log(`[UpdateMilkEntry] Update blocked due to billing period protection on original date:`, originalValidation.protectedPeriods);
      return res.status(403).json({
        success: false,
        error: originalValidation.error
      });
    }

    // If date is being changed, also check the new date
    const newDate = date || originalDate;
    const newFarmerId = farmerId || originalFarmerId;
    
    if (newDate !== originalDate || newFarmerId !== originalFarmerId) {
      console.log(`[UpdateMilkEntry] Checking billing period protection for new entry data - farmer ${newFarmerId}, date ${newDate}`);
      const newValidation = await billingPeriodValidator.validateMilkEntryOperation(newFarmerId, newDate, 'update');
      
      if (!newValidation.isAllowed) {
        console.log(`[UpdateMilkEntry] Update blocked due to billing period protection on new date:`, newValidation.protectedPeriods);
        return res.status(403).json({
          success: false,
          error: {
            ...newValidation.error,
            message: `Cannot update milk entry to ${newDate}. New date falls within billed period.`
          }
        });
      }
    }
    
    console.log(`[UpdateMilkEntry] Billing period validation passed for entry update`);
  } catch (error) {
    console.error(`[UpdateMilkEntry] Error validating billing period protection:`, error);
    // Continue with update but log the validation error
    console.warn(`[UpdateMilkEntry] Proceeding with entry update despite validation error`);
  }

  // Update the entry with new data
  entry.date = date || entry.date;
  entry.session = session || entry.session;
  entry.time = time || entry.time;
  entry.farmer = farmerId || entry.farmer;
  entry.farmerUniqueId = farmerUniqueId || entry.farmerUniqueId;
  entry.farmerName = farmerName || entry.farmerName;
  entry.cow = cow || entry.cow;
  entry.buffalo = buffalo || entry.buffalo;
  entry.totalAmount = totalAmount || entry.totalAmount;

  await entry.save();

  // Populate farmer details for response
  await entry.populate('farmer', 'username uniqueId');

  res.json({
    success: true,
    data: entry,
    message: "Milk entry updated successfully"
  });
});

// Delete milk entry
export const deleteMilkEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await MilkEntry.findById(id);
  if (!entry) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ENTRY_NOT_FOUND",
        message: "Milk entry not found"
      }
    });
  }

  // Check billing period protection for the entry
  const entryFarmerId = entry.farmer.toString();
  const entryDate = entry.date;
  
  try {
    console.log(`[DeleteMilkEntry] Checking billing period protection for farmer ${entryFarmerId}, date ${entryDate}`);
    const validation = await billingPeriodValidator.validateMilkEntryOperation(entryFarmerId, entryDate, 'delete');
    
    if (!validation.isAllowed) {
      console.log(`[DeleteMilkEntry] Delete blocked due to billing period protection:`, validation.protectedPeriods);
      return res.status(403).json({
        success: false,
        error: validation.error
      });
    }
    
    console.log(`[DeleteMilkEntry] Billing period validation passed for entry deletion`);
  } catch (error) {
    console.error(`[DeleteMilkEntry] Error validating billing period protection:`, error);
    // Continue with deletion but log the validation error
    console.warn(`[DeleteMilkEntry] Proceeding with entry deletion despite validation error`);
  }

  await MilkEntry.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Milk entry deleted successfully"
  });
});

export const confirmCOD = asyncHandler(async (req, res) => {
  await Payment.updateOne(
    { _id: req.params.id },
    { status: "SUCCESS" }
  );

  res.json({ 
    success: true,
    message: "COD confirmed successfully" 
  });
});

// Get all animals information
export const getAnimalsInfo = asyncHandler(async (req, res) => {
  const animals = await Animal.find({ isActive: true })
    .populate('farmer', 'name mobile')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: animals,
    message: "Animals information retrieved successfully"
  });
});

// Get farmers for management
export const getFarmers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  
  let filter = { 
    role: "farmer", 
    approved: true 
  };
  
  // Add search functionality
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { uniqueId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const farmers = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  // Get additional farmer statistics
  const farmerStats = await User.aggregate([
    { $match: { role: "farmer" } },
    {
      $group: {
        _id: "$approved",
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    approved: farmerStats.find(s => s._id === true)?.count || 0,
    pending: farmerStats.find(s => s._id === false)?.count || 0
  };
  stats.total = stats.approved + stats.pending;

  res.json({
    success: true,
    data: {
      farmers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    },
    message: "Farmers retrieved successfully"
  });
});

// Get buyers for management
export const getBuyers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  
  let filter = { 
    role: "buyer", 
    approved: true 
  };
  
  // Add search functionality
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { uniqueId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const buyers = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  // Get additional buyer statistics
  const buyerStats = await User.aggregate([
    { $match: { role: "buyer" } },
    {
      $group: {
        _id: "$approved",
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    approved: buyerStats.find(s => s._id === true)?.count || 0,
    pending: buyerStats.find(s => s._id === false)?.count || 0
  };
  stats.total = stats.approved + stats.pending;

  res.json({
    success: true,
    data: {
      buyers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats
    },
    message: "Buyers retrieved successfully"
  });
});

// Get all users data for employee access (farmers and buyers)
export const getAllUsersData = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 50 } = req.query;
  
  let filter = { 
    role: { $in: ["farmer", "buyer"] },
    approved: true 
  };
  
  // Add role filter if specified
  if (role && ["farmer", "buyer"].includes(role)) {
    filter.role = role;
  }
  
  // Add search functionality
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { uniqueId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const users = await User.find(filter)
    .select('-password')
    .sort({ role: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  // Get summary by role
  const summary = await User.aggregate([
    { $match: { role: { $in: ["farmer", "buyer"] }, approved: true } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 }
      }
    }
  ]);

  const stats = {
    farmers: summary.find(s => s._id === "farmer")?.count || 0,
    buyers: summary.find(s => s._id === "buyer")?.count || 0
  };
  stats.total = stats.farmers + stats.buyers;

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: stats
    },
    message: "User data retrieved successfully"
  });
});

// Generate reports
export const generateReports = asyncHandler(async (req, res) => {
  const { startDate, endDate, reportType } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  let reportData = {};

  if (reportType === 'milk' || !reportType) {
    // Milk collection report
    const milkEntries = await MilkEntry.find({
      date: { $gte: start, $lte: end }
    }).populate('farmer', 'name');

    const milkSummary = await MilkEntry.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$milkType",
          totalLiters: { $sum: "$liters" },
          totalAmount: { $sum: "$totalAmount" },
          entryCount: { $sum: 1 }
        }
      }
    ]);

    reportData.milkCollection = {
      entries: milkEntries,
      summary: milkSummary
    };
  }

  // Note: Sales/delivery reports are now handled by delivery staff
  // This employee controller only handles milk collection reports

  res.json({
    success: true,
    data: reportData,
    message: "Reports generated successfully"
  });
});

// Get payment status for farmers
export const getFarmerPayments = asyncHandler(async (req, res) => {
  const farmerPayments = await Billing.find({
    farmer: { $exists: true }
  }).populate('farmer', 'name mobile')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: farmerPayments,
    message: "Farmer payments retrieved successfully"
  });
});

// Get payment status for buyers (from milk orders/deliveries)
export const getBuyerPayments = asyncHandler(async (req, res) => {
  // Get all completed deliveries with payment information
  const buyerPayments = await Delivery.find({
    status: { $in: ["Completed", "Out for Delivery", "Approved"] }
  })
    .populate('buyer', 'username mobile uniqueId')
    .populate('handledBy', 'username')
    .sort({ createdAt: -1 });

  // Format the response to include payment details
  const formattedPayments = buyerPayments.map(delivery => ({
    _id: delivery._id,
    buyer: delivery.buyer,
    milkType: delivery.milkType,
    quantity: delivery.quantity,
    rate: delivery.rate,
    totalAmount: delivery.totalAmount,
    address: delivery.address,
    deliveryDate: delivery.deliveryDate,
    status: delivery.status,
    paymentMethod: delivery.paymentMethod,
    paymentCompleted: delivery.paymentCompleted,
    paymentDate: delivery.paymentDate,
    handledBy: delivery.handledBy,
    completedAt: delivery.completedAt,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt
  }));

  // Calculate summary
  const summary = {
    totalOrders: formattedPayments.length,
    totalAmount: formattedPayments.reduce((sum, p) => sum + p.totalAmount, 0),
    paidAmount: formattedPayments.filter(p => p.paymentCompleted).reduce((sum, p) => sum + p.totalAmount, 0),
    pendingAmount: formattedPayments.filter(p => !p.paymentCompleted).reduce((sum, p) => sum + p.totalAmount, 0),
    onlinePayments: formattedPayments.filter(p => p.paymentMethod !== 'cod' && p.paymentCompleted).length,
    codPayments: formattedPayments.filter(p => p.paymentMethod === 'cod').length,
    codPending: formattedPayments.filter(p => p.paymentMethod === 'cod' && !p.paymentCompleted).length,
    codCompleted: formattedPayments.filter(p => p.paymentMethod === 'cod' && p.paymentCompleted).length
  };

  res.json({
    success: true,
    data: {
      payments: formattedPayments,
      summary
    },
    message: "Buyer payments retrieved successfully"
  });
});

// Employee dashboard stats
export const getEmployeeDashboard = asyncHandler(async (req, res) => {
  // Use the shared utility to get consistent milk collection data
  const todayMilkCollection = await calculateTodayMilkCollection();

  // Active farmers and buyers
  const activeFarmers = await User.countDocuments({ role: "farmer", approved: true });
  const activeBuyers = await User.countDocuments({ role: "buyer", approved: true });

  // Total animals
  const totalAnimals = await Animal.countDocuments({ isActive: true });

  // Pending payments
  const pendingPayments = await Billing.countDocuments({ status: "Pending" });

  // Get current milk rates
  let milkRates = { cow: 50, buffalo: 60 }; // Default rates
  try {
    const rateChart = await RateChart.findOne({});
    if (rateChart) {
      milkRates.cow = rateChart.rate;
      milkRates.buffalo = rateChart.rate + 10; // Buffalo typically costs more
    }
  } catch (err) {
    console.log("No milk rate found, using defaults");
  }

  res.json({
    success: true,
    data: {
      todayMilkCollection,
      milkRates,
      activeFarmers,
      activeBuyers,
      totalAnimals,
      pendingPayments
    },
    message: "Employee dashboard data retrieved successfully"
  });
});

// Send manual notification
export const sendManualNotification = asyncHandler(async (req, res) => {
  const { title, message, recipients } = req.body;
  const employeeId = req.user.id;

  if (!title || !message || !recipients || !Array.isArray(recipients)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "Title, message, and recipients are required"
      }
    });
  }

  const validRecipients = ["farmers", "buyers", "employees", "all"];
  const invalidRecipients = recipients.filter(r => !validRecipients.includes(r));
  
  if (invalidRecipients.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_RECIPIENTS",
        message: `Invalid recipients: ${invalidRecipients.join(", ")}. Valid options: ${validRecipients.join(", ")}`
      }
    });
  }

  try {
    const notification = await sendNotification({
      type: "manual",
      title,
      message,
      recipients,
      createdBy: employeeId
    });

    res.json({
      success: true,
      data: notification,
      message: "Notification sent successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "NOTIFICATION_FAILED",
        message: error.message
      }
    });
  }
});

// Update dairy time and schedule notifications
export const updateDairyTime = asyncHandler(async (req, res) => {
  const { openingTime, closingTime, sendNotifications = true } = req.body;
  const employeeId = req.user.id;

  if (!openingTime || !closingTime) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "Opening time and closing time are required"
      }
    });
  }

  try {
    // Get current dairy info
    let dairyInfo = await DairyInfo.findOne({});
    
    if (!dairyInfo) {
      return res.status(404).json({
        success: false,
        error: {
          code: "DAIRY_INFO_NOT_FOUND",
          message: "Dairy information not found. Please set up dairy info first."
        }
      });
    }

    // Update dairy time
    dairyInfo.openingTime = openingTime;
    dairyInfo.closingTime = closingTime;
    await dairyInfo.save();

    // Schedule automatic notifications if requested
    let scheduledNotifications = [];
    if (sendNotifications) {
      try {
        scheduledNotifications = await scheduleDairyNotifications(dairyInfo, employeeId);
      } catch (notificationError) {
        console.error("Error scheduling notifications:", notificationError);
        // Don't fail the time update if notifications fail
      }
    }

    res.json({
      success: true,
      data: {
        dairyInfo,
        scheduledNotifications: scheduledNotifications.length
      },
      message: `Dairy time updated successfully. ${scheduledNotifications.length} notifications scheduled.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: error.message
      }
    });
  }
});

// Get notification history
export const getNotifications = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, limit } = req.query;

  try {
    const filters = {};
    
    if (type) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (limit) filters.limit = parseInt(limit);

    const notifications = await getNotificationHistory(filters);

    res.json({
      success: true,
      data: notifications,
      message: "Notification history retrieved successfully"
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

// Get dairy time info
export const getDairyTime = asyncHandler(async (req, res) => {
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

// Generate farmer bill and payment report
export const generateFarmerBill = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, farmerType, farmerMobile, farmerId } = req.query;
  
  if (!dateFrom || !dateTo) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Date from and date to are required"
      }
    });
  }

  try {
    const startDate = dateFrom; // Keep as string since date field is string
    const endDate = dateTo;     // Keep as string since date field is string

    // Create a more flexible filter that handles both date formats
    let filter = {
      $or: [
        // Handle YYYY-MM-DD format
        { date: { $gte: startDate, $lte: endDate } },
        // Handle full datetime string format by using regex
        { date: { $regex: new RegExp(`${startDate.split('-')[0]}.*${startDate.split('-')[1]}.*${startDate.split('-')[2]}`) } }
      ]
    };

    // Query with date range directly in DB for performance
    const allEntries = await MilkEntry.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('farmer', 'username uniqueId mobile')
      .sort({ date: 1, session: 1 });

    // Filter out entries with null farmer (deleted users)
    const milkEntries = allEntries.filter(entry => {
      if (!entry.farmer || !entry.farmer._id) return false;
      if (!entry.date) return false;
      return true;
    });

    // Apply farmer filter if needed
    let filteredEntries = milkEntries;
    if (farmerType === 'specific') {
      if (farmerMobile) {
        // Find farmer by mobile
        const farmer = await User.findOne({ 
          mobile: farmerMobile, 
          role: "farmer", 
          approved: true 
        });
        if (!farmer) {
          return res.status(404).json({
            success: false,
            error: {
              code: "FARMER_NOT_FOUND",
              message: "Farmer not found with this mobile number"
            }
          });
        }
        filteredEntries = milkEntries.filter(entry => entry.farmer?._id?.toString() === farmer._id.toString());
      } else if (farmerId) {
        filteredEntries = milkEntries.filter(entry => entry.farmer?._id?.toString() === farmerId);
      }
    }

    console.log("Found milk entries after filtering:", filteredEntries.length);

    if (farmerType === 'all') {
      // Generate report for all farmers
      const farmerGroups = {};
      
      filteredEntries.forEach(entry => {
        if (!entry.farmer || !entry.farmer._id) return; // extra safety guard
        const entryFarmerId = entry.farmer._id.toString();
        const farmerId = entryFarmerId;
        if (!farmerGroups[farmerId]) {
          farmerGroups[farmerId] = {
            farmerId: farmerId,
            farmerName: entry.farmerName,
            farmerUniqueId: entry.farmerUniqueId,
            farmerMobile: entry.farmer.mobile,
            totalEntries: 0,
            totalAmount: 0,
            cowMilk: { quantity: 0, amount: 0 },
            buffaloMilk: { quantity: 0, amount: 0 },
            transactions: []
          };
        }

        const farmer = farmerGroups[farmerId];
        farmer.totalEntries += 1;
        farmer.totalAmount += entry.totalAmount;
        farmer.transactions.push(entry);

        if (entry.cow && entry.cow.quantity > 0) {
          farmer.cowMilk.quantity += entry.cow.quantity;
          farmer.cowMilk.amount += entry.cow.amount;
        }

        if (entry.buffalo && entry.buffalo.quantity > 0) {
          farmer.buffaloMilk.quantity += entry.buffalo.quantity;
          farmer.buffaloMilk.amount += entry.buffalo.amount;
        }
      });

      // Only include farmers who have at least one entry
      const farmers = Object.values(farmerGroups).filter(farmer => farmer.totalEntries > 0);
      
      // If no farmers have entries, return appropriate message
      if (farmers.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NO_ENTRIES_FOUND",
            message: "No milk entries found for any farmer in the specified date range"
          }
        });
      }

      const summary = {
        totalFarmers: farmers.length,
        totalEntries: filteredEntries.length,
        totalLiters: farmers.reduce((sum, f) => sum + f.cowMilk.quantity + f.buffaloMilk.quantity, 0),
        grandTotal: farmers.reduce((sum, f) => sum + f.totalAmount, 0)
      };

      res.json({
        success: true,
        data: {
          farmers,
          summary
        },
        message: "Farmer bills generated successfully"
      });

    } else {
      // Generate report for specific farmer
      if (filteredEntries.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NO_ENTRIES_FOUND",
            message: "No milk entries found for the specified farmer and date range"
          }
        });
      }

      const farmerInfo = filteredEntries[0].farmer;
      if (!farmerInfo || !farmerInfo._id) {
        return res.status(500).json({
          success: false,
          error: { code: "FARMER_DATA_MISSING", message: "Farmer data could not be loaded for this entry" }
        });
      }
      const farmer = {
        farmerId: farmerInfo._id,
        farmerName: filteredEntries[0].farmerName,
        farmerUniqueId: filteredEntries[0].farmerUniqueId,
        farmerMobile: farmerInfo.mobile,
        totalEntries: filteredEntries.length,
        totalAmount: 0,
        cowMilk: { 
          quantity: 0, 
          amount: 0, 
          avgFat: 0, 
          avgRate: 0,
          entries: 0
        },
        buffaloMilk: { 
          quantity: 0, 
          amount: 0, 
          avgFat: 0, 
          avgRate: 0,
          entries: 0
        },
        transactions: filteredEntries
      };

      let cowTotalFat = 0, cowTotalRate = 0;
      let buffaloTotalFat = 0, buffaloTotalRate = 0;

      filteredEntries.forEach(entry => {
        farmer.totalAmount += entry.totalAmount;

        if (entry.cow && entry.cow.quantity > 0) {
          farmer.cowMilk.quantity += entry.cow.quantity;
          farmer.cowMilk.amount += entry.cow.amount;
          farmer.cowMilk.entries += 1;
          cowTotalFat += entry.cow.fat;
          cowTotalRate += entry.cow.rate;
        }

        if (entry.buffalo && entry.buffalo.quantity > 0) {
          farmer.buffaloMilk.quantity += entry.buffalo.quantity;
          farmer.buffaloMilk.amount += entry.buffalo.amount;
          farmer.buffaloMilk.entries += 1;
          buffaloTotalFat += entry.buffalo.fat;
          buffaloTotalRate += entry.buffalo.rate;
        }
      });

      // Calculate averages
      if (farmer.cowMilk.entries > 0) {
        farmer.cowMilk.avgFat = cowTotalFat / farmer.cowMilk.entries;
        farmer.cowMilk.avgRate = cowTotalRate / farmer.cowMilk.entries;
      }

      if (farmer.buffaloMilk.entries > 0) {
        farmer.buffaloMilk.avgFat = buffaloTotalFat / farmer.buffaloMilk.entries;
        farmer.buffaloMilk.avgRate = buffaloTotalRate / farmer.buffaloMilk.entries;
      }

      res.json({
        success: true,
        data: {
          farmer
        },
        message: "Farmer bill generated successfully"
      });
    }

  } catch (error) {
    console.error("Error in generateFarmerBill:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "BILL_GENERATION_FAILED",
        message: error.message
      }
    });
  }
});
// Process payment for farmer
export const processPayment = asyncHandler(async (req, res) => {
  const { farmerId, amount, paymentType, notes, billPeriod, status = 'completed', cowMilkAmount = 0, buffaloMilkAmount = 0 } = req.body;
  const employeeId = req.user.id;

  if (!farmerId || !amount || !paymentType) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "Farmer ID, amount, and payment type are required"
      }
    });
  }

  try {
    // Get farmer details
    const farmer = await User.findById(farmerId);
    if (!farmer || farmer.role !== 'farmer') {
      return res.status(404).json({
        success: false,
        error: {
          code: "FARMER_NOT_FOUND",
          message: "Farmer not found"
        }
      });
    }

    let payment;
    let isUpdate = false;

    // Check for existing pending payment for the same farmer and bill period
    if (billPeriod && billPeriod.dateFrom && billPeriod.dateTo) {
      const existingPayment = await FarmerPayment.findOne({
        farmer: farmerId,
        status: 'pending',
        'billPeriod.dateFrom': billPeriod.dateFrom,
        'billPeriod.dateTo': billPeriod.dateTo
      });

      if (existingPayment && status === 'completed') {
        // Update existing pending payment to completed
        existingPayment.amount = parseFloat(amount);
        existingPayment.cowMilkAmount = parseFloat(cowMilkAmount) || 0;
        existingPayment.buffaloMilkAmount = parseFloat(buffaloMilkAmount) || 0;
        existingPayment.paymentType = paymentType;
        existingPayment.notes = notes || '';
        existingPayment.paymentDate = new Date();
        existingPayment.processedBy = employeeId;
        existingPayment.status = 'completed';
        
        payment = await existingPayment.save();
        isUpdate = true;
        
        console.log(`Updated existing pending payment ${existingPayment._id} to completed`);
      } else if (existingPayment && status === 'pending') {
        // Update existing pending payment details
        existingPayment.amount = parseFloat(amount);
        existingPayment.cowMilkAmount = parseFloat(cowMilkAmount) || 0;
        existingPayment.buffaloMilkAmount = parseFloat(buffaloMilkAmount) || 0;
        existingPayment.paymentType = paymentType;
        existingPayment.notes = notes || '';
        existingPayment.processedBy = employeeId;
        
        payment = await existingPayment.save();
        isUpdate = true;
        
        console.log(`Updated existing pending payment ${existingPayment._id} details`);
      }
    }

    // If no existing payment found or no bill period provided, create new payment
    if (!payment) {
      payment = new FarmerPayment({
        farmer: farmerId,
        farmerName: farmer.username,
        farmerMobile: farmer.mobile,
        amount: parseFloat(amount),
        cowMilkAmount: parseFloat(cowMilkAmount) || 0,
        buffaloMilkAmount: parseFloat(buffaloMilkAmount) || 0,
        paymentType,
        notes: notes || '',
        paymentDate: new Date(),
        processedBy: employeeId,
        billPeriod: billPeriod || null,
        status: status // Can be 'pending' or 'completed'
      });

      payment = await payment.save();
      console.log(`Created new payment ${payment._id} with status ${status}`);
    }

    // Populate the processedBy field for response
    await payment.populate('processedBy', 'username uniqueId');

    const message = isUpdate 
      ? (status === 'completed' ? "Pending payment updated to completed successfully" : "Pending payment details updated successfully")
      : (status === 'pending' ? "Payment marked as pending successfully" : "Payment processed successfully");

    res.json({
      success: true,
      data: payment,
      message
    });

  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PAYMENT_PROCESSING_FAILED",
        message: error.message
      }
    });
  }
});

// Update pending payment
export const updatePendingPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { amount, paymentType, notes, status } = req.body;
  const employeeId = req.user.id;

  try {
    const payment = await FarmerPayment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PAYMENT_NOT_FOUND",
          message: "Payment not found"
        }
      });
    }

    // Update payment details
    if (amount !== undefined) payment.amount = parseFloat(amount);
    if (paymentType) payment.paymentType = paymentType;
    if (notes !== undefined) payment.notes = notes;
    if (status) payment.status = status;
    
    // Update processed by if completing the payment
    if (status === 'completed') {
      payment.processedBy = employeeId;
      payment.paymentDate = new Date();
    }

    await payment.save();
    await payment.populate('processedBy', 'username uniqueId');

    res.json({
      success: true,
      data: payment,
      message: status === 'completed' ? "Payment completed successfully" : "Pending payment updated successfully"
    });

  } catch (error) {
    console.error("Error updating pending payment:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: error.message
      }
    });
  }
});

// Complete pending payment
export const completePendingPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { notes } = req.body;
  const employeeId = req.user.id;

  try {
    const payment = await FarmerPayment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PAYMENT_NOT_FOUND",
          message: "Payment not found"
        }
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Payment is not in pending status"
        }
      });
    }

    // Complete the payment
    payment.status = 'completed';
    payment.processedBy = employeeId;
    payment.paymentDate = new Date();
    if (notes) payment.notes = notes;

    await payment.save();
    await payment.populate('processedBy', 'username uniqueId');

    res.json({
      success: true,
      data: payment,
      message: "Pending payment completed successfully"
    });

  } catch (error) {
    console.error("Error completing pending payment:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "COMPLETION_FAILED",
        message: error.message
      }
    });
  }
});

// Get pending payments
export const getPendingPayments = asyncHandler(async (req, res) => {
  const { 
    dateFrom, 
    dateTo, 
    farmerId, 
    paymentType, 
    page = 1, 
    limit = 50 
  } = req.query;

  try {
    let filter = { status: 'pending' };

    // Date range filter
    if (dateFrom && dateTo) {
      filter.createdAt = { 
        $gte: new Date(dateFrom), 
        $lte: new Date(dateTo + 'T23:59:59.999Z') 
      };
    } else if (dateFrom) {
      filter.createdAt = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.createdAt = { $lte: new Date(dateTo + 'T23:59:59.999Z') };
    }

    // Farmer filter
    if (farmerId) {
      filter.farmer = farmerId;
    }

    // Payment type filter
    if (paymentType && paymentType !== 'all') {
      filter.paymentType = paymentType;
    }

    // Get payments with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await FarmerPayment.find(filter)
      .populate('farmer', 'username uniqueId mobile')
      .populate('processedBy', 'username uniqueId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalPayments = await FarmerPayment.countDocuments(filter);

    // Calculate summary
    const summary = payments.reduce((acc, payment) => {
      acc.totalAmount += payment.amount || 0;
      acc.paymentCount += 1;
      
      // Count by payment type
      acc.paymentTypeCounts[payment.paymentType] = (acc.paymentTypeCounts[payment.paymentType] || 0) + 1;
      
      return acc;
    }, {
      totalAmount: 0,
      paymentCount: 0,
      paymentTypeCounts: {}
    });

    res.json({
      success: true,
      data: {
        payments,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPayments,
          pages: Math.ceil(totalPayments / parseInt(limit))
        },
        filters: {
          dateFrom,
          dateTo,
          farmerId,
          paymentType
        }
      },
      message: "Pending payments retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});

// Get payment history
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { 
    dateFrom, 
    dateTo, 
    farmerId, 
    paymentType, 
    page = 1, 
    limit = 50,
    removeDuplicates = 'true' // Add option to remove duplicates
  } = req.query;

  try {
    let filter = {};

    // Date range filter
    if (dateFrom && dateTo) {
      filter.paymentDate = { 
        $gte: new Date(dateFrom), 
        $lte: new Date(dateTo + 'T23:59:59.999Z') 
      };
    } else if (dateFrom) {
      filter.paymentDate = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.paymentDate = { $lte: new Date(dateTo + 'T23:59:59.999Z') };
    }

    // Farmer filter
    if (farmerId) {
      filter.farmer = farmerId;
    }

    // Payment type filter
    if (paymentType && paymentType !== 'all') {
      filter.paymentType = paymentType;
    }

    // Get payments with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let payments = await FarmerPayment.find(filter)
      .populate('farmer', 'username uniqueId mobile')
      .populate('processedBy', 'username uniqueId')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Remove duplicates if requested (default: true)
    if (removeDuplicates === 'true') {
      const paymentMap = new Map();
      
      payments.forEach(payment => {
        if (payment.farmer && payment.billPeriod) {
          const key = `${payment.farmer._id}-${payment.billPeriod.dateFrom}-${payment.billPeriod.dateTo}`;
          
          // Keep the most recent payment (completed status takes priority over pending)
          const existing = paymentMap.get(key);
          if (!existing || 
              payment.status === 'completed' && existing.status === 'pending' ||
              payment.paymentDate > existing.paymentDate) {
            paymentMap.set(key, payment);
          }
        } else {
          // Keep payments without bill period (shouldn't happen but just in case)
          const key = `${payment.farmer?._id || 'unknown'}-${payment._id}`;
          paymentMap.set(key, payment);
        }
      });
      
      payments = Array.from(paymentMap.values()).sort((a, b) => 
        new Date(b.paymentDate) - new Date(a.paymentDate)
      );
      
      console.log(`Removed duplicates: ${payments.length} unique payments from original set`);
    }

    // Attach daily milk entries for each payment's bill period
    const paymentsWithEntries = await Promise.all(
      payments.map(async (payment) => {
        const paymentObj = payment.toObject ? payment.toObject() : payment;
        if (payment.billPeriod?.dateFrom && payment.billPeriod?.dateTo) {
          const fromDate = new Date(payment.billPeriod.dateFrom).toISOString().split('T')[0];
          const toDate = new Date(payment.billPeriod.dateTo).toISOString().split('T')[0];
          const dailyEntries = await MilkEntry.find({
            farmer: payment.farmer?._id || payment.farmer,
            date: { $gte: fromDate, $lte: toDate }
          }).sort({ date: 1, session: 1 }).lean();
          paymentObj.dailyEntries = dailyEntries;
        } else {
          paymentObj.dailyEntries = [];
        }
        return paymentObj;
      })
    );

    // Get total count for pagination (before deduplication)
    const totalPayments = await FarmerPayment.countDocuments(filter);

    // Calculate summary
    const summary = paymentsWithEntries.reduce((acc, payment) => {
      acc.totalAmount += payment.amount || 0;
      acc.paymentCount += 1;
      
      // Count by payment type
      acc.paymentTypeCounts[payment.paymentType] = (acc.paymentTypeCounts[payment.paymentType] || 0) + 1;
      
      return acc;
    }, {
      totalAmount: 0,
      paymentCount: 0,
      paymentTypeCounts: {}
    });

    res.json({
      success: true,
      data: {
        payments: paymentsWithEntries,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPayments,
          pages: Math.ceil(totalPayments / parseInt(limit)),
          deduplicatedCount: paymentsWithEntries.length
        },
        filters: {
          dateFrom,
          dateTo,
          farmerId,
          paymentType,
          removeDuplicates
        }
      },
      message: "Payment history retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});
// Clean up duplicate payments (utility function)
export const cleanupDuplicatePayments = asyncHandler(async (req, res) => {
  try {
    console.log('Starting duplicate payment cleanup...');
    
    // Find all payments grouped by farmer and bill period
    const duplicateGroups = await FarmerPayment.aggregate([
      {
        $match: {
          billPeriod: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            farmer: "$farmer",
            dateFrom: "$billPeriod.dateFrom",
            dateTo: "$billPeriod.dateTo"
          },
          payments: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only groups with duplicates
        }
      }
    ]);

    let cleanedCount = 0;
    let keptCount = 0;

    for (const group of duplicateGroups) {
      const payments = group.payments;
      
      // Sort payments: completed status first, then by most recent date
      payments.sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (b.status === 'completed' && a.status !== 'completed') return 1;
        return new Date(b.paymentDate) - new Date(a.paymentDate);
      });

      // Keep the first payment (best one), delete the rest
      const paymentToKeep = payments[0];
      const paymentsToDelete = payments.slice(1);

      console.log(`Farmer ${group._id.farmer}: Keeping payment ${paymentToKeep._id} (${paymentToKeep.status}), deleting ${paymentsToDelete.length} duplicates`);

      // Delete duplicate payments
      for (const payment of paymentsToDelete) {
        await FarmerPayment.findByIdAndDelete(payment._id);
        cleanedCount++;
      }
      
      keptCount++;
    }

    console.log(`Cleanup complete: Kept ${keptCount} payments, removed ${cleanedCount} duplicates`);

    res.json({
      success: true,
      data: {
        duplicateGroupsFound: duplicateGroups.length,
        paymentsKept: keptCount,
        paymentsRemoved: cleanedCount
      },
      message: `Cleanup complete: Removed ${cleanedCount} duplicate payments, kept ${keptCount} unique payments`
    });

  } catch (error) {
    console.error("Error cleaning up duplicate payments:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CLEANUP_FAILED",
        message: error.message
      }
    });
  }
});

// Check billing period protection for a specific date and farmer
export const checkBillingPeriodProtection = asyncHandler(async (req, res) => {
  const { farmerId, entryDate } = req.query;

  if (!farmerId || !entryDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Farmer ID and entry date are required"
      }
    });
  }

  try {
    console.log(`[BillingProtection] Checking protection for farmer ${farmerId}, date ${entryDate}`);
    
    const validation = await billingPeriodValidator.validateMilkEntryOperation(farmerId, entryDate, 'check');
    
    console.log(`[BillingProtection] Validation result:`, {
      isProtected: validation.isProtected,
      protectedPeriodsCount: validation.protectedPeriods.length
    });

    res.json({
      success: true,
      data: {
        farmerId,
        entryDate,
        isProtected: validation.isProtected,
        isAllowed: validation.isAllowed,
        protectedPeriods: validation.protectedPeriods,
        message: validation.isProtected 
          ? billingPeriodValidator.generateErrorMessage(entryDate, validation.protectedPeriods, 'create entry for')
          : "Date is not protected by any billing period"
      },
      message: "Billing period protection check completed"
    });

  } catch (error) {
    console.error("Error checking billing period protection:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PROTECTION_CHECK_FAILED",
        message: "Failed to check billing period protection",
        details: error.message
      }
    });
  }
});

// Get all protected periods for a farmer
export const getFarmerProtectedPeriods = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;

  if (!farmerId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Farmer ID is required"
      }
    });
  }

  try {
    console.log(`[BillingProtection] Getting all protected periods for farmer ${farmerId}`);
    
    const billPeriods = await billingPeriodValidator.getBillPeriodsForFarmer(farmerId);
    
    const protectedPeriods = billPeriods.map(period => ({
      dateFrom: period.billPeriod.dateFrom,
      dateTo: period.billPeriod.dateTo,
      billId: period._id,
      generatedAt: period.paymentDate || period.createdAt,
      amount: period.amount,
      status: period.status
    }));

    console.log(`[BillingProtection] Found ${protectedPeriods.length} protected periods for farmer ${farmerId}`);

    res.json({
      success: true,
      data: {
        farmerId,
        protectedPeriods,
        totalPeriods: protectedPeriods.length
      },
      message: `Found ${protectedPeriods.length} protected billing periods`
    });

  } catch (error) {
    console.error("Error getting farmer protected periods:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "PROTECTED_PERIODS_FETCH_FAILED",
        message: "Failed to get protected periods",
        details: error.message
      }
    });
  }
});

// Batch check billing period protection for multiple dates
export const batchCheckBillingProtection = asyncHandler(async (req, res) => {
  const { farmerId, entryDates } = req.body;

  if (!farmerId || !entryDates || !Array.isArray(entryDates)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Farmer ID and array of entry dates are required"
      }
    });
  }

  try {
    console.log(`[BillingProtection] Batch checking protection for farmer ${farmerId}, ${entryDates.length} dates`);
    
    const batchValidation = await billingPeriodValidator.validateMultipleDates(farmerId, entryDates);
    
    console.log(`[BillingProtection] Batch validation result:`, {
      totalDates: entryDates.length,
      hasAnyProtected: batchValidation.hasAnyProtected,
      protectedPeriodsCount: batchValidation.allProtectedPeriods.length
    });

    res.json({
      success: true,
      data: {
        farmerId,
        entryDates,
        results: batchValidation.results,
        hasAnyProtected: batchValidation.hasAnyProtected,
        allProtectedPeriods: batchValidation.allProtectedPeriods,
        summary: {
          totalDates: entryDates.length,
          protectedDates: Object.values(batchValidation.results).filter(r => r.isProtected).length,
          allowedDates: Object.values(batchValidation.results).filter(r => r.isAllowed).length
        }
      },
      message: "Batch billing period protection check completed"
    });

  } catch (error) {
    console.error("Error in batch billing protection check:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "BATCH_PROTECTION_CHECK_FAILED",
        message: "Failed to perform batch billing protection check",
        details: error.message
      }
    });
  }
});

// Get today's deliveries for analytics
export const getTodaysDeliveries = asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  // Use provided date or default to today
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Get ONLY deliveries created today (not scheduled for delivery today)
    const deliveries = await Delivery.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
      .populate('buyer', 'username mobile uniqueId')
      .populate('deliveryPersonId', 'username uniqueId role')
      .populate('handledBy', 'username uniqueId role')
      .sort({ createdAt: 1 }); // Sort by creation time ascending

    // Add session information based on creation time
    const deliveriesWithSession = deliveries.map(delivery => {
      const createdHour = new Date(delivery.createdAt).getHours();
      // Morning session: 12 AM to 12 PM (0-11)
      // Evening session: 12 PM to 11:59 PM (12-23)
      const session = createdHour < 12 ? 'Morning' : 'Evening';
      
      return {
        ...delivery.toObject(),
        session
      };
    });

    // Calculate summary statistics - only count Accepted/Out for Delivery/Completed orders for revenue
    const summary = deliveriesWithSession.reduce((acc, delivery) => {
      acc.totalDeliveries += 1;
      
      // Only count Accepted, Out for Delivery, and Completed orders for revenue and milk totals
      if (delivery.status === 'Accepted' || delivery.status === 'Out for Delivery' || delivery.status === 'Completed') {
        acc.totalAmount += delivery.totalAmount || 0;
        acc.acceptedDeliveries += 1;
        
        // Count by milk type
        if (delivery.milkType === 'cow') {
          acc.totalCowMilk += delivery.quantity || 0;
        } else if (delivery.milkType === 'buffalo') {
          acc.totalBuffaloMilk += delivery.quantity || 0;
        }
      }
      
      // Count by status
      if (delivery.status === 'Completed') {
        acc.completedDeliveries += 1;
      } else if (delivery.status === 'Pending') {
        acc.pendingDeliveries += 1;
      }
      
      return acc;
    }, {
      totalDeliveries: 0,
      totalCowMilk: 0,
      totalBuffaloMilk: 0,
      totalAmount: 0,
      completedDeliveries: 0,
      pendingDeliveries: 0,
      acceptedDeliveries: 0
    });

    res.json({
      success: true,
      data: {
        deliveries: deliveriesWithSession,
        summary,
        date: targetDate.toISOString().split('T')[0]
      },
      message: "Today's deliveries retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching today's deliveries:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});
