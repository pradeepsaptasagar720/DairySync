import revenueAggregationService from '../services/revenueAggregation.service.js';
import Transport from '../models/Transport.model.js';
import EmployeePayment from '../models/EmployeePayment.model.js';
import FarmerPayment from '../models/FarmerPayment.model.js';
import Delivery from '../models/Delivery.model.js';
import OtherExpense from '../models/OtherExpense.model.js';
import FeedSale from '../models/FeedSale.model.js';
import FeedPurchase from '../models/FeedPurchase.model.js';

/**
 * Get revenue analytics data
 * GET /api/admin/revenue-analytics
 */
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { dateFrom, dateTo, month, year } = req.query;

    // Validate date range if provided
    if (dateFrom && dateTo) {
      const start = new Date(dateFrom);
      const end = new Date(dateTo);
      
      if (end < start) {
        return res.status(400).json({
          success: false,
          message: 'End date cannot be before start date'
        });
      }
    }

    // Aggregate revenue data
    const aggregatedData = await revenueAggregationService.aggregateRevenueData({
      dateFrom,
      dateTo,
      month,
      year
    });

    // Get breakdown data
    const breakdown = await getBreakdownData(aggregatedData.dateRange);

    // Get chart data
    const chartData = await getChartData(aggregatedData.dateRange);

    res.status(200).json({
      success: true,
      data: {
        summary: aggregatedData.summary,
        breakdown,
        chartData
      },
      message: 'Revenue analytics data fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics data',
      error: error.message
    });
  }
};

/**
 * Get comparison data for current vs previous period
 * GET /api/admin/revenue-analytics/comparison
 */
export const getComparisonData = async (req, res) => {
  try {
    const { currentPeriodStart, currentPeriodEnd } = req.query;

    if (!currentPeriodStart || !currentPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'Current period start and end dates are required'
      });
    }

    const currentStart = new Date(currentPeriodStart);
    const currentEnd = new Date(currentPeriodEnd);

    // Calculate previous period
    const periodDuration = currentEnd - currentStart;
    const previousStart = new Date(currentStart.getTime() - periodDuration);
    const previousEnd = new Date(currentStart.getTime() - 1);

    // Get current period data
    const currentData = await revenueAggregationService.aggregateRevenueData({
      dateFrom: currentStart.toISOString(),
      dateTo: currentEnd.toISOString()
    });

    // Get previous period data
    const previousData = await revenueAggregationService.aggregateRevenueData({
      dateFrom: previousStart.toISOString(),
      dateTo: previousEnd.toISOString()
    });

    // Calculate changes
    const changes = {
      profitLoss: calculateChange(
        currentData.summary.profitLoss,
        previousData.summary.profitLoss
      ),
      collected: calculateChange(
        currentData.summary.netCollectedAmount,
        previousData.summary.netCollectedAmount
      ),
      paid: calculateChange(
        currentData.summary.netPaidAmount,
        previousData.summary.netPaidAmount
      ),
      feedProfitLoss: calculateChange(
        currentData.summary.feedProfitLoss,
        previousData.summary.feedProfitLoss
      )
    };

    res.status(200).json({
      success: true,
      data: {
        current: currentData.summary,
        previous: previousData.summary,
        changes
      },
      message: 'Comparison data fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparison data',
      error: error.message
    });
  }
};

/**
 * Helper function to get breakdown data
 */
async function getBreakdownData(dateRange) {
  const { startDate, endDate } = dateRange;

  const [
    transportMilk,
    employeeSalaries,
    farmerPayments,
    buyerPayments,
    otherExpenses,
    feedSales,
    feedPurchases
  ] = await Promise.all([
    Transport.find({
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['transported', 'completed'] }
    }).select('date transportAmount transportMilk status').sort({ date: -1 }).limit(100),

    EmployeePayment.find({
      paymentDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).select('employeeName paymentDate netSalary billingPeriod').sort({ paymentDate: -1 }).limit(100),

    FarmerPayment.find({
      paymentDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).select('farmerName paymentDate amount paymentType').sort({ paymentDate: -1 }).limit(100),

    Delivery.find({
      paymentDate: { $gte: startDate, $lte: endDate },
      paymentCompleted: true,
      status: 'Completed'
    }).populate('buyer', 'name').select('paymentDate totalAmount paymentMethod').sort({ paymentDate: -1 }).limit(100),

    OtherExpense.find({
      paymentDate: { $gte: startDate, $lte: endDate },
      status: 'paid'
    }).select('description paymentDate amount category vendor').sort({ paymentDate: -1 }).limit(100),

    FeedSale.find({
      saleDate: { $gte: startDate, $lte: endDate },
      paymentStatus: { $in: ['completed', 'partial'] }
    }).select('farmerName saleDate totalAmount feedType quantity paymentMethod').sort({ saleDate: -1 }).limit(100),

    FeedPurchase.find({
      purchaseDate: { $gte: startDate, $lte: endDate },
      paymentStatus: 'completed'
    }).select('employeeName purchaseDate totalAmount feedType quantity vendor paymentMethod').sort({ purchaseDate: -1 }).limit(100)
  ]);

  return {
    transportMilk,
    employeeSalaries,
    farmerPayments,
    buyerPayments,
    otherExpenses,
    feedSales,
    feedPurchases
  };
}

/**
 * Helper function to get chart data
 */
async function getChartData(dateRange) {
  const { startDate, endDate } = dateRange;
  
  // Generate daily data points
  const chartData = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayData = await revenueAggregationService.aggregateRevenueData({
      dateFrom: dayStart.toISOString(),
      dateTo: dayEnd.toISOString()
    });

    chartData.push({
      date: dayStart.toISOString().split('T')[0],
      profitLoss: dayData.summary.profitLoss,
      collected: dayData.summary.netCollectedAmount,
      paid: dayData.summary.netPaidAmount
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return chartData;
}

/**
 * Helper function to calculate percentage change
 */
function calculateChange(current, previous) {
  if (previous === 0) {
    return {
      value: current,
      percentage: current > 0 ? 100 : 0
    };
  }

  const value = current - previous;
  const percentage = ((current - previous) / Math.abs(previous)) * 100;

  return {
    value,
    percentage: Math.round(percentage * 100) / 100
  };
}
