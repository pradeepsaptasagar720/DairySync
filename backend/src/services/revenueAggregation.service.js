import Transport from '../models/Transport.model.js';
import EmployeePayment from '../models/EmployeePayment.model.js';
import FarmerPayment from '../models/FarmerPayment.model.js';
import Delivery from '../models/Delivery.model.js';
import OtherExpense from '../models/OtherExpense.model.js';
import FeedSale from '../models/FeedSale.model.js';
import FeedPurchase from '../models/FeedPurchase.model.js';

class RevenueAggregationService {
  /**
   * Get transported milk total amount for a date range
   */
  async getTransportedMilkAmount(dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      const result = await Transport.aggregate([
        {
          $match: {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: { $in: ['transported', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$transportAmount' }
          }
        }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error fetching transported milk amount:', error);
      return 0;
    }
  }

  /**
   * Get employee salaries paid for a date range
   */
  async getEmployeeSalariesPaid(dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      const result = await EmployeePayment.aggregate([
        {
          $match: {
            paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$netPay' }
          }
        }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error fetching employee salaries:', error);
      return 0;
    }
  }

  /**
   * Get farmer payments total for a date range
   */
  async getFarmerPaymentsTotal(dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      const result = await FarmerPayment.aggregate([
        {
          $match: {
            paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error fetching farmer payments:', error);
      return 0;
    }
  }

  /**
   * Get buyer payments received for a date range
   */
  async getBuyerPaymentsReceived(dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      const result = await Delivery.aggregate([
        {
          $match: {
            paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            paymentCompleted: true,
            status: 'Completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error fetching buyer payments:', error);
      return 0;
    }
  }

  /**
   * Get other expenses total for a date range
   */
  async getOtherExpensesTotal(dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      const result = await OtherExpense.aggregate([
        {
          $match: {
            paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error fetching other expenses:', error);
      return 0;
    }
  }

  /**
   * Get feed sales to farmers total for a date range
   */
  async getFeedSalesToFarmers(dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      const result = await FeedSale.aggregate([
        {
          $match: {
            saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            paymentStatus: { $in: ['completed', 'partial'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error fetching feed sales:', error);
      return 0;
    }
  }

  /**
   * Get feed stock purchases total for a date range
   */
  async getFeedStockPurchases(dateRange) {
    try {
      const { startDate, endDate } = dateRange;
      
      const result = await FeedPurchase.aggregate([
        {
          $match: {
            purchaseDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      console.error('Error fetching feed purchases:', error);
      return 0;
    }
  }

  /**
   * Calculate net collected amount
   */
  calculateNetCollected(transportAmount, buyerPayments, feedSales) {
    return transportAmount + buyerPayments + feedSales;
  }

  /**
   * Calculate net paid amount
   */
  calculateNetPaid(farmerPayments, employeeSalaries, otherExpenses, feedPurchases) {
    return farmerPayments + employeeSalaries + otherExpenses + feedPurchases;
  }

  /**
   * Calculate feed profit/loss
   */
  calculateFeedProfitLoss(feedSales, feedPurchases) {
    return feedSales - feedPurchases;
  }

  /**
   * Calculate overall profit/loss
   */
  calculateProfitLoss(netCollected, netPaid) {
    return netCollected - netPaid;
  }

  /**
   * Aggregate all financial data for a given period
   */
  async aggregateRevenueData(filters) {
    const dateRange = this.parseDateFilters(filters);
    
    // Fetch all data sources in parallel
    const [
      transportedMilkAmount,
      employeeSalariesPaid,
      farmerPaymentsTotal,
      buyerPaymentsReceived,
      otherExpensesTotal,
      feedSalesToFarmers,
      feedStockPurchases
    ] = await Promise.all([
      this.getTransportedMilkAmount(dateRange),
      this.getEmployeeSalariesPaid(dateRange),
      this.getFarmerPaymentsTotal(dateRange),
      this.getBuyerPaymentsReceived(dateRange),
      this.getOtherExpensesTotal(dateRange),
      this.getFeedSalesToFarmers(dateRange),
      this.getFeedStockPurchases(dateRange)
    ]);

    // Calculate metrics
    const netCollectedAmount = this.calculateNetCollected(
      transportedMilkAmount,
      buyerPaymentsReceived,
      feedSalesToFarmers
    );

    const netPaidAmount = this.calculateNetPaid(
      farmerPaymentsTotal,
      employeeSalariesPaid,
      otherExpensesTotal,
      feedStockPurchases
    );

    const feedProfitLoss = this.calculateFeedProfitLoss(
      feedSalesToFarmers,
      feedStockPurchases
    );

    const profitLoss = this.calculateProfitLoss(netCollectedAmount, netPaidAmount);

    return {
      summary: {
        transportedMilkAmount,
        employeeSalariesPaid,
        farmerPaymentsTotal,
        buyerPaymentsReceived,
        otherExpensesTotal,
        feedSalesToFarmers,
        feedStockPurchases,
        netCollectedAmount,
        netPaidAmount,
        feedProfitLoss,
        profitLoss
      },
      dateRange
    };
  }

  /**
   * Parse date filters into a date range
   */
  parseDateFilters(filters) {
    const { dateFrom, dateTo, month, year } = filters;

    if (dateFrom && dateTo) {
      return {
        startDate: new Date(dateFrom),
        endDate: new Date(dateTo)
      };
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    // No filters - return all-time data (from beginning to now)
    const startDate = new Date('2000-01-01'); // Far past date to capture all data
    const endDate = new Date(); // Current date
    return { startDate, endDate };
  }
}

export default new RevenueAggregationService();
