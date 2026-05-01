import MilkEntry from "../models/MilkEntry.model.js";

/**
 * Calculate today's milk collection data consistently across all endpoints
 * @param {string} date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @returns {Object} Milk collection data with cow, buffalo, and total quantities
 */
export const calculateTodayMilkCollection = async (date = null) => {
  // Use provided date or default to today
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get today's milk entries
  const milkEntries = await MilkEntry.find({
    date: targetDate
  });

  // Calculate totals from the entries
  let cowMilkTotal = 0;
  let buffaloMilkTotal = 0;
  let cowAmountTotal = 0;
  let buffaloAmountTotal = 0;
  let totalAmount = 0;
  const uniqueFarmers = new Set();

  milkEntries.forEach(entry => {
    const cowQuantity = entry.cow?.quantity || 0;
    const buffaloQuantity = entry.buffalo?.quantity || 0;
    const cowAmount = entry.cow?.amount || 0;
    const buffaloAmount = entry.buffalo?.amount || 0;

    cowMilkTotal += cowQuantity;
    buffaloMilkTotal += buffaloQuantity;
    cowAmountTotal += cowAmount;
    buffaloAmountTotal += buffaloAmount;
    totalAmount += entry.totalAmount || 0;
    
    if (entry.farmer) {
      uniqueFarmers.add(entry.farmer.toString());
    }
  });

  const totalLiters = cowMilkTotal + buffaloMilkTotal;

  return {
    cowMilk: cowMilkTotal,
    buffaloMilk: buffaloMilkTotal,
    totalLiters: totalLiters,
    totalAmount: totalAmount,
    cowAmount: cowAmountTotal,
    buffaloAmount: buffaloAmountTotal,
    entryCount: milkEntries.length,
    farmerCount: uniqueFarmers.size,
    date: targetDate
  };
};

/**
 * Get milk collection data for a specific date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Milk collection data with cow, buffalo, and total quantities
 */
export const calculateDateRangeMilkCollection = async (startDate, endDate) => {
  // Convert dates to YYYY-MM-DD format for comparison
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get milk entries in the date range
  const milkEntries = await MilkEntry.find({
    date: { $gte: startDateStr, $lte: endDateStr }
  });

  // Calculate totals from the entries
  let cowMilkTotal = 0;
  let buffaloMilkTotal = 0;
  let cowAmountTotal = 0;
  let buffaloAmountTotal = 0;
  let totalAmount = 0;
  const uniqueFarmers = new Set();

  milkEntries.forEach(entry => {
    const cowQuantity = entry.cow?.quantity || 0;
    const buffaloQuantity = entry.buffalo?.quantity || 0;
    const cowAmount = entry.cow?.amount || 0;
    const buffaloAmount = entry.buffalo?.amount || 0;

    cowMilkTotal += cowQuantity;
    buffaloMilkTotal += buffaloQuantity;
    cowAmountTotal += cowAmount;
    buffaloAmountTotal += buffaloAmount;
    totalAmount += entry.totalAmount || 0;
    
    if (entry.farmer) {
      uniqueFarmers.add(entry.farmer.toString());
    }
  });

  const totalLiters = cowMilkTotal + buffaloMilkTotal;

  return {
    cowMilk: cowMilkTotal,
    buffaloMilk: buffaloMilkTotal,
    totalLiters: totalLiters,
    totalAmount: totalAmount,
    cowAmount: cowAmountTotal,
    buffaloAmount: buffaloAmountTotal,
    entryCount: milkEntries.length,
    farmerCount: uniqueFarmers.size,
    startDate: startDateStr,
    endDate: endDateStr
  };
};

/**
 * Get milk collection data for a specific session
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} session - 'Morning' or 'Evening'
 * @param {boolean} subtractOrders - Whether to subtract accepted orders from available milk
 * @returns {Object} Session-specific milk collection data
 */
export const calculateSessionMilkCollection = async (date, session, subtractOrders = true) => {
  console.log('\n🔍 === CALCULATE SESSION MILK COLLECTION ===');
  console.log('Date:', date);
  console.log('Session:', session);
  console.log('Subtract Orders:', subtractOrders);
  
  const milkEntries = await MilkEntry.find({
    date: date,
    session: session
  });

  console.log('📊 Found', milkEntries.length, 'milk entries for this session');

  let cowMilkTotal = 0;
  let buffaloMilkTotal = 0;
  let totalAmount = 0;
  const uniqueFarmers = new Set();

  milkEntries.forEach(entry => {
    cowMilkTotal += entry.cow?.quantity || 0;
    buffaloMilkTotal += entry.buffalo?.quantity || 0;
    totalAmount += entry.totalAmount || 0;
    
    if (entry.farmer) {
      uniqueFarmers.add(entry.farmer.toString());
    }
  });

  console.log('🥛 Total Collected:');
  console.log('  Cow:', cowMilkTotal, 'L');
  console.log('  Buffalo:', buffaloMilkTotal, 'L');
  console.log('  Total:', (cowMilkTotal + buffaloMilkTotal), 'L');

  // Subtract accepted/approved orders from available milk
  let cowMilkReserved = 0;
  let buffaloMilkReserved = 0;
  
  if (subtractOrders) {
    console.log('[v5] 📦 Checking for active orders to subtract...');
    const Delivery = (await import("../models/Delivery.model.js")).default;
    
    // Find ALL non-cancelled, non-completed orders regardless of date.
    // These represent milk that is committed/reserved.
    const activeOrders = await Delivery.find({
      status: { $in: ["Pending", "Accepted", "Out for Delivery"] }
    }).lean();
    
    console.log('[v5] Found', activeOrders.length, 'total active orders');
    
    // Calculate reserved milk quantities
    activeOrders.forEach((order, index) => {
      const deliveryDateStr = order.deliveryDate 
        ? new Date(order.deliveryDate).toISOString().split('T')[0] 
        : 'unknown';
      console.log(`  [v5] Order ${index + 1}: milkType=${order.milkType} qty=${order.quantity}L status=${order.status} deliveryDate=${deliveryDateStr}`);
      if (order.milkType === "cow") {
        cowMilkReserved += order.quantity || 0;
      } else if (order.milkType === "buffalo") {
        buffaloMilkReserved += order.quantity || 0;
      }
    });
    
    console.log('[v5] 🔒 Total Reserved: Cow=' + cowMilkReserved + 'L Buffalo=' + buffaloMilkReserved + 'L Total=' + (cowMilkReserved + buffaloMilkReserved) + 'L');
  }

  // Calculate available milk (total collected - reserved for orders)
  const cowMilkAvailable = Math.max(0, cowMilkTotal - cowMilkReserved);
  const buffaloMilkAvailable = Math.max(0, buffaloMilkTotal - buffaloMilkReserved);

  console.log('✅ Available Milk:');
  console.log('  Cow:', cowMilkAvailable, 'L (', cowMilkTotal, '-', cowMilkReserved, ')');
  console.log('  Buffalo:', buffaloMilkAvailable, 'L (', buffaloMilkTotal, '-', buffaloMilkReserved, ')');
  console.log('  Total:', (cowMilkAvailable + buffaloMilkAvailable), 'L');
  console.log('='.repeat(80), '\n');

  return {
    cowMilk: cowMilkAvailable,
    buffaloMilk: buffaloMilkAvailable,
    cowMilkTotal: cowMilkTotal,
    buffaloMilkTotal: buffaloMilkTotal,
    cowMilkReserved: cowMilkReserved,
    buffaloMilkReserved: buffaloMilkReserved,
    totalLiters: cowMilkAvailable + buffaloMilkAvailable,
    totalAmount: totalAmount,
    entryCount: milkEntries.length,
    farmerCount: uniqueFarmers.size,
    session: session,
    date: date
  };
};

/**
 * Calculate yesterday's milk collection data
 * @returns {Object} Yesterday's milk collection data
 */
export const calculateYesterdayMilkCollection = async () => {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return await calculateTodayMilkCollection(yesterdayStr);
};

/**
 * Calculate current month's milk collection data
 * @returns {Object} Current month's milk collection data
 */
export const calculateCurrentMonthMilkCollection = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return await calculateDateRangeMilkCollection(startOfMonth, endOfMonth);
};

/**
 * Calculate previous month's milk collection data
 * @returns {Object} Previous month's milk collection data
 */
export const calculatePreviousMonthMilkCollection = async () => {
  const now = new Date();
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return await calculateDateRangeMilkCollection(startOfPreviousMonth, endOfPreviousMonth);
};