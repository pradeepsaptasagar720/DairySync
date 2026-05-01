import Transport from "../models/Transport.model.js";
import Delivery from "../models/Delivery.model.js";
import Billing from "../models/Billing.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import { calculateTodayMilkCollection } from "../utils/milkCalculations.js";

// Calculate transport milk for today
export const calculateTransportMilk = asyncHandler(async (req, res) => {
  // Use IST-aware today date
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
  const istNow = new Date(now.getTime() + istOffset);
  const milkDate = istNow.toISOString().split('T')[0]; // YYYY-MM-DD in IST

  const milkCollectionData = await calculateTodayMilkCollection(milkDate);

  // Orders placed today are for tomorrow's delivery (deliveryDate = tomorrow).
  // "Sales to Buyers" = all active/completed orders created today OR due today/tomorrow.
  const istDayStart = new Date(milkDate + 'T00:00:00.000+05:30');
  const istDayEnd = new Date(milkDate + 'T23:59:59.999+05:30');

  // Tomorrow in IST
  const tomorrowIST = new Date(istNow);
  tomorrowIST.setDate(tomorrowIST.getDate() + 1);
  const tomorrowStr = tomorrowIST.toISOString().split('T')[0];
  const istTomorrowStart = new Date(tomorrowStr + 'T00:00:00.000+05:30');
  const istTomorrowEnd = new Date(tomorrowStr + 'T23:59:59.999+05:30');

  // Query: orders created today OR deliveryDate is today OR deliveryDate is tomorrow
  const allBuyerDeliveries = await Delivery.find({
    $or: [
      { createdAt: { $gte: istDayStart, $lte: istDayEnd } },
      { deliveryDate: { $gte: istDayStart, $lte: istDayEnd } },
      { deliveryDate: { $gte: istTomorrowStart, $lte: istTomorrowEnd } }
    ],
    status: { $nin: ["Cancelled"] }
  });

  console.log(`[Transport] IST Today: ${milkDate}, Tomorrow: ${tomorrowStr}`);
  console.log(`[Transport] Found ${allBuyerDeliveries.length} buyer deliveries`);
  allBuyerDeliveries.forEach(d => console.log(`  - ${d.milkType} ${d.quantity}L status:${d.status} deliveryDate:${d.deliveryDate} createdAt:${d.createdAt}`));

  const cowMilkSold = allBuyerDeliveries
    .filter(d => d.milkType === "cow")
    .reduce((sum, d) => sum + (d.quantity || 0), 0);

  const buffaloMilkSold = allBuyerDeliveries
    .filter(d => d.milkType === "buffalo")
    .reduce((sum, d) => sum + (d.quantity || 0), 0);

  const totalMilkSold = cowMilkSold + buffaloMilkSold;
  const saleAmount = allBuyerDeliveries.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  // Cow/buffalo transport breakdown
  const cowTransportMilk = Math.max(0, milkCollectionData.cowMilk - cowMilkSold);
  const buffaloTransportMilk = Math.max(0, milkCollectionData.buffaloMilk - buffaloMilkSold);
  const transportMilk = cowTransportMilk + buffaloTransportMilk;

  const cowSaleAmount = allBuyerDeliveries
    .filter(d => d.milkType === "cow")
    .reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const buffaloSaleAmount = allBuyerDeliveries
    .filter(d => d.milkType === "buffalo")
    .reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  const cowTransportAmount = Math.max(0, milkCollectionData.cowAmount - cowSaleAmount);
  const buffaloTransportAmount = Math.max(0, milkCollectionData.buffaloAmount - buffaloSaleAmount);
  const transportAmount = cowTransportAmount + buffaloTransportAmount;

  res.json({
    success: true,
    data: {
      date: milkDate,
      // Collection
      totalMilkCollected: milkCollectionData.totalLiters,
      cowMilkCollected: milkCollectionData.cowMilk,
      buffaloMilkCollected: milkCollectionData.buffaloMilk,
      collectionAmount: milkCollectionData.totalAmount,
      cowCollectionAmount: milkCollectionData.cowAmount,
      buffaloCollectionAmount: milkCollectionData.buffaloAmount,
      // Sales to buyers
      totalMilkSold,
      cowMilkSold,
      buffaloMilkSold,
      saleAmount,
      cowSaleAmount,
      buffaloSaleAmount,
      // Transport (remaining)
      transportMilk,
      cowTransportMilk,
      buffaloTransportMilk,
      transportAmount,
      cowTransportAmount,
      buffaloTransportAmount
    },
    message: "Transport milk calculated successfully"
  });
});

// Get transport records
export const getTransportRecords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const filter = {};
  if (status) filter.status = status;

  const transports = await Transport.find(filter)
    .populate('transportedBy', 'username mobile')
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Transport.countDocuments(filter);

  res.json({
    success: true,
    data: {
      transports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    },
    message: "Transport records retrieved successfully"
  });
});

// Get transport history (completed records only)
export const getTransportHistory = asyncHandler(async (req, res) => {
  const { filter = "all" } = req.query;
  
  let dateFilter = {};
  const now = new Date();

  switch (filter) {
    case "today":
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));
      dateFilter = { date: { $gte: startOfDay, $lte: endOfDay } };
      break;
    case "week":
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      dateFilter = { date: { $gte: startOfWeek } };
      break;
    case "month":
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { date: { $gte: startOfMonth } };
      break;
    default:
      // all - no date filter
      break;
  }

  const transports = await Transport.find({
    status: "completed",
    ...dateFilter
  })
    .populate('transportedBy', 'username mobile')
    .sort({ date: -1 })
    .limit(50);

  res.json({
    success: true,
    data: {
      transports
    },
    message: "Transport history retrieved successfully"
  });
});

// Create transport record
export const createTransportRecord = asyncHandler(async (req, res) => {
  const { date, notes } = req.body;

  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  // Check if transport record already exists for this date
  const existingTransport = await Transport.findOne({
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (existingTransport) {
    return res.status(400).json({
      success: false,
      error: {
        code: "TRANSPORT_EXISTS",
        message: "Transport record already exists for this date"
      }
    });
  }

  // Calculate milk data for the date
  const milkCollectionData = await calculateTodayMilkCollection(targetDate.toISOString().split('T')[0]);

  const allBuyerDeliveries = await Delivery.find({
    $or: [
      { deliveryDate: { $gte: startOfDay, $lte: endOfDay } },
      { createdAt: { $gte: startOfDay, $lte: endOfDay } }
    ],
    status: { $nin: ["Cancelled"] }
  });

  const cowMilkSold = allBuyerDeliveries
    .filter(d => d.milkType === "cow")
    .reduce((sum, d) => sum + (d.quantity || 0), 0);
  const buffaloMilkSold = allBuyerDeliveries
    .filter(d => d.milkType === "buffalo")
    .reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalMilkSold = cowMilkSold + buffaloMilkSold;
  const saleAmount = allBuyerDeliveries.reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  const cowSaleAmount = allBuyerDeliveries
    .filter(d => d.milkType === "cow")
    .reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const buffaloSaleAmount = allBuyerDeliveries
    .filter(d => d.milkType === "buffalo")
    .reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  const cowMilkTransported = Math.max(0, milkCollectionData.cowMilk - cowMilkSold);
  const buffaloMilkTransported = Math.max(0, milkCollectionData.buffaloMilk - buffaloMilkSold);
  
  const cowTransportAmount = Math.max(0, milkCollectionData.cowAmount - cowSaleAmount);
  const buffaloTransportAmount = Math.max(0, milkCollectionData.buffaloAmount - buffaloSaleAmount);

  const transportMilk = Math.max(0, milkCollectionData.totalLiters - totalMilkSold);
  const transportAmount = Math.max(0, milkCollectionData.totalAmount - saleAmount);

  const transport = await Transport.create({
    date: targetDate,
    // Cow milk data
    cowMilkCollected: milkCollectionData.cowMilk,
    cowMilkSold,
    cowMilkTransported,
    cowCollectionAmount: milkCollectionData.cowAmount,
    cowSaleAmount,
    cowTransportAmount,
    // Buffalo milk data
    buffaloMilkCollected: milkCollectionData.buffaloMilk,
    buffaloMilkSold,
    buffaloMilkTransported,
    buffaloCollectionAmount: milkCollectionData.buffaloAmount,
    buffaloSaleAmount,
    buffaloTransportAmount,
    // Legacy totals
    totalMilkCollected: milkCollectionData.totalLiters,
    totalMilkSold,
    transportMilk,
    collectionAmount: milkCollectionData.totalAmount,
    saleAmount,
    transportAmount,
    notes,
    transportedBy: req.user.id
  });

  res.status(201).json({
    success: true,
    data: transport,
    message: "Transport record created successfully"
  });
});

// Update transport status
export const updateTransportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, completionDetails } = req.body;

  if (!["pending", "transported", "completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: "Status must be one of: pending, transported, completed"
      }
    });
  }

  const updateData = { status, transportedBy: req.user.id };
  if (notes) updateData.notes = notes;

  // If marking as completed, require completion details
  if (status === "completed") {
    if (!completionDetails) {
      return res.status(400).json({
        success: false,
        error: {
          code: "COMPLETION_DETAILS_REQUIRED",
          message: "Completion details are required when marking as completed"
        }
      });
    }

    updateData.completionDetails = {
      cow: {
        quantity: completionDetails.cow?.quantity || 0,
        fat: completionDetails.cow?.fat || 0,
        rate: completionDetails.cow?.rate || 0,
        amount: completionDetails.cow?.amount || 0,
      },
      buffalo: {
        quantity: completionDetails.buffalo?.quantity || 0,
        fat: completionDetails.buffalo?.fat || 0,
        rate: completionDetails.buffalo?.rate || 0,
        amount: completionDetails.buffalo?.amount || 0,
      },
      totalAmount: completionDetails.totalAmount || 0,
      completedAt: new Date()
    };
  }

  const transport = await Transport.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).populate('transportedBy', 'username mobile');

  if (!transport) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TRANSPORT_NOT_FOUND",
        message: "Transport record not found"
      }
    });
  }

  res.json({
    success: true,
    data: transport,
    message: "Transport status updated successfully"
  });
});

// Get today's transport summary for dashboard
export const getTodayTransportSummary = asyncHandler(async (req, res) => {
  const milkCollectionData = await calculateTodayMilkCollection();

  const todayStr = new Date().toISOString().split('T')[0];
  const startOfDay = new Date(todayStr + 'T00:00:00.000Z');
  const endOfDay = new Date(todayStr + 'T23:59:59.999Z');

  const allBuyerDeliveries = await Delivery.find({
    $or: [
      { deliveryDate: { $gte: startOfDay, $lte: endOfDay } },
      { createdAt: { $gte: startOfDay, $lte: endOfDay } }
    ],
    status: { $nin: ["Cancelled"] }
  });

  const totalMilkSold = allBuyerDeliveries.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const saleAmount = allBuyerDeliveries.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const transportMilk = Math.max(0, milkCollectionData.totalLiters - totalMilkSold);
  const transportAmount = Math.max(0, milkCollectionData.totalAmount - saleAmount);

  res.json({
    success: true,
    data: {
      todayMilkCollection: {
        liters: milkCollectionData.totalLiters,
        amount: milkCollectionData.totalAmount
      },
      todaySales: {
        liters: totalMilkSold,
        amount: saleAmount
      },
      transportMilk: {
        liters: transportMilk,
        amount: transportAmount
      }
    },
    message: "Today's transport summary retrieved successfully"
  });
});

// Edit transport record (today only)
export const editTransportRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, status } = req.body;

  // Find the transport record
  const transport = await Transport.findById(id);
  
  if (!transport) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TRANSPORT_NOT_FOUND",
        message: "Transport record not found"
      }
    });
  }

  // Check if record is from today
  const today = new Date();
  const recordDate = new Date(transport.date);
  const isToday = recordDate.toDateString() === today.toDateString();

  if (!isToday) {
    return res.status(400).json({
      success: false,
      error: {
        code: "EDIT_NOT_ALLOWED",
        message: "Only today's records can be edited"
      }
    });
  }

  // Validate status if provided
  if (status && !["pending", "transported", "completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: "Status must be one of: pending, transported, completed"
      }
    });
  }

  // Update the record
  if (notes !== undefined) transport.notes = notes;
  if (status) transport.status = status;
  transport.transportedBy = req.user.id;

  await transport.save();

  const updatedTransport = await Transport.findById(id)
    .populate('transportedBy', 'username mobile');

  res.json({
    success: true,
    data: updatedTransport,
    message: "Transport record updated successfully"
  });
});
