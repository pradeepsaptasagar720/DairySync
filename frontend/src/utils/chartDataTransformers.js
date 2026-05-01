/**
 * Data transformation utilities for Revenue Analytics charts
 */

/**
 * Transform data for donut charts
 * @param {Array} categories - Array of {name, amount} objects
 * @param {Array} colors - Array of color hex codes
 * @returns {Array} Transformed data for donut chart
 */
export const transformToDonutData = (categories, colors) => {
  return categories
    .map((cat, index) => ({
      name: cat.name,
      value: cat.amount,
      color: colors[index] || '#6B7280'
    }))
    .filter(item => item.value > 0); // Filter out zero values
};

/**
 * Transform data for bar chart (Income vs Expenses)
 * @param {Object} summary - Revenue summary data
 * @returns {Array} Transformed data for bar chart
 */
export const transformToBarData = (summary) => {
  return [
    {
      category: 'Transported Milk',
      income: summary.transportedMilkAmount || 0,
      expense: 0
    },
    {
      category: 'Buyer Payments',
      income: summary.buyerPaymentsReceived || 0,
      expense: 0
    },
    {
      category: 'Feed Sales',
      income: summary.feedSalesToFarmers || 0,
      expense: 0
    },
    {
      category: 'Farmer Payments',
      income: 0,
      expense: summary.farmerPaymentsTotal || 0
    },
    {
      category: 'Employee Salaries',
      income: 0,
      expense: summary.employeeSalariesPaid || 0
    },
    {
      category: 'Other Expenses',
      income: 0,
      expense: summary.otherExpensesTotal || 0
    },
    {
      category: 'Feed Purchases',
      income: 0,
      expense: summary.feedStockPurchases || 0
    }
  ];
};

/**
 * Calculate best performing revenue source
 * @param {Object} summary - Revenue summary data
 * @param {Object} icons - Icon components for each source
 * @returns {Object} Best performing source with details
 */
export const calculateBestPerforming = (summary, icons) => {
  const sources = [
    { 
      name: 'Transported Milk', 
      amount: summary.transportedMilkAmount || 0,
      icon: icons.Truck
    },
    { 
      name: 'Buyer Payments', 
      amount: summary.buyerPaymentsReceived || 0,
      icon: icons.ShoppingCart
    },
    { 
      name: 'Feed Sales', 
      amount: summary.feedSalesToFarmers || 0,
      icon: icons.Wheat
    }
  ];
  
  const best = sources.reduce((max, source) => 
    source.amount > max.amount ? source : max
  );
  
  const total = summary.netCollectedAmount || 1; // Avoid division by zero
  const percentage = (best.amount / total) * 100;
  
  return { ...best, percentage };
};

/**
 * Transform expense data for donut chart
 * @param {Object} summary - Revenue summary data
 * @returns {Array} Expense data with colors
 */
export const transformExpenseData = (summary) => {
  const categories = [
    { name: 'Farmer Payments', amount: summary.farmerPaymentsTotal || 0 },
    { name: 'Employee Salaries', amount: summary.employeeSalariesPaid || 0 },
    { name: 'Other Expenses', amount: summary.otherExpensesTotal || 0 },
    { name: 'Feed Purchases', amount: summary.feedStockPurchases || 0 }
  ];
  
  const colors = ['#F97316', '#A855F7', '#EF4444', '#6366F1'];
  
  return transformToDonutData(categories, colors);
};

/**
 * Transform revenue data for donut chart
 * @param {Object} summary - Revenue summary data
 * @returns {Array} Revenue data with colors
 */
export const transformRevenueData = (summary) => {
  const categories = [
    { name: 'Transported Milk', amount: summary.transportedMilkAmount || 0 },
    { name: 'Buyer Payments', amount: summary.buyerPaymentsReceived || 0 },
    { name: 'Feed Sales', amount: summary.feedSalesToFarmers || 0 }
  ];
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B'];
  
  return transformToDonutData(categories, colors);
};

/**
 * Calculate dairy performance metrics
 * @param {Object} summary - Revenue summary data
 * @returns {Object} Dairy performance metrics
 */
export const calculateDairyPerformance = (summary) => {
  const totalRevenue = summary.netCollectedAmount || 0;
  const totalExpenses = summary.netPaidAmount || 0;
  const netProfit = summary.profitLoss || 0;
  
  // Calculate profit margin
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  // Calculate operational efficiency (revenue to expense ratio)
  const operationalEfficiency = totalExpenses > 0 ? (totalRevenue / totalExpenses) * 100 : 0;
  
  // Calculate dairy efficiency based on multiple factors
  const dairyEfficiency = Math.min(100, Math.max(0, 
    (profitMargin * 0.4) + (operationalEfficiency * 0.6)
  ));
  
  return {
    profitMargin: Math.round(profitMargin * 100) / 100,
    operationalEfficiency: Math.round(operationalEfficiency * 100) / 100,
    dairyEfficiency: Math.round(dairyEfficiency * 100) / 100,
    totalRevenue,
    totalExpenses,
    netProfit
  };
};

/**
 * Generate profit/loss analysis data for chart using real summary totals
 * Distributes the period totals across months up to current month (no random variation)
 * @param {Object} summary - Revenue summary data
 * @returns {Array} Monthly P&L data
 */
export const generateProfitLossData = (summary) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const monthCount = currentMonth + 1;

  const monthlyRevenue = Math.round((summary.netCollectedAmount || 0) / monthCount);
  const monthlyExpenses = Math.round((summary.netPaidAmount || 0) / monthCount);

  return months.slice(0, monthCount).map((month) => {
    const revenue = monthlyRevenue;
    const expenses = monthlyExpenses;
    const profit = revenue - expenses;
    return { month, revenue, expenses, profit };
  });
};

/**
 * Calculate dairy performance categories with P&L
 * @param {Object} summary - Revenue summary data
 * @returns {Array} Performance categories with profit/loss
 */
export const calculatePerformanceCategories = (summary) => {
  // Milk Operations - No expenses deducted
  const milkRevenue = summary.transportedMilkAmount || 0;
  const milkExpenses = 0; // No expenses for milk operations
  const milkProfitLoss = milkRevenue; // Pure revenue
  
  // Feed Operations
  const feedRevenue = summary.feedSalesToFarmers || 0;
  const feedExpenses = summary.feedStockPurchases || 0;
  const feedProfitLoss = feedRevenue - feedExpenses;
  
  // Buyer Operations - No expenses deducted
  const buyerRevenue = summary.buyerPaymentsReceived || 0;
  const buyerExpenses = 0; // No expenses for buyer operations
  const buyerProfitLoss = buyerRevenue; // Pure revenue
  
  // Other Operations
  const otherExpenses = summary.otherExpensesTotal || 0;
  const otherProfitLoss = -otherExpenses; // Pure expense
  
  return {
    milkOperations: {
      revenue: milkRevenue,
      expenses: milkExpenses,
      profitLoss: milkProfitLoss
    },
    feedOperations: {
      revenue: feedRevenue,
      expenses: feedExpenses,
      profitLoss: feedProfitLoss
    },
    buyerOperations: {
      revenue: buyerRevenue,
      expenses: buyerExpenses,
      profitLoss: buyerProfitLoss
    },
    otherOperations: {
      revenue: 0,
      expenses: otherExpenses,
      profitLoss: otherProfitLoss
    }
  };
};
