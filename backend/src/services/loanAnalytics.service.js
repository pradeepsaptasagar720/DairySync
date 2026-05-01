import Loan from "../models/Loan.model.js";
import User from "../models/User.model.js";

/**
 * Loan Analytics Service
 * Provides comprehensive loan analytics for admin dashboard
 */
class LoanAnalyticsService {
  
  /**
   * Get comprehensive loan overview statistics
   * @param {Object} dateRange - Optional date range filter
   * @returns {Object} Loan overview statistics
   */
  static async getLoanOverviewStats(dateRange = {}) {
    try {
      // Build date filter
      let dateFilter = {};
      if (dateRange.start || dateRange.end) {
        dateFilter.requestDate = {};
        if (dateRange.start) dateFilter.requestDate.$gte = new Date(dateRange.start);
        if (dateRange.end) dateFilter.requestDate.$lte = new Date(dateRange.end);
      }

      // Get comprehensive loan statistics
      const [overviewStats] = await Loan.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRequested: { $sum: "$requestedAmount" },
            totalApproved: { $sum: { $ifNull: ["$approvedAmount", 0] } },
            totalReturned: { $sum: "$totalReturned" },
            totalOutstanding: { $sum: "$totalDue" },
            totalLoans: { $sum: 1 },
            approvedLoans: {
              $sum: { $cond: [{ $ne: ["$approvedAmount", null] }, 1, 0] }
            },
            clearedLoans: {
              $sum: { $cond: [{ $eq: ["$status", "fully_cleared"] }, 1, 0] }
            },
            activeLoans: {
              $sum: { $cond: [{ $in: ["$status", ["approved", "partially_paid"]] }, 1, 0] }
            }
          }
        }
      ]);

      // Get unique farmer counts
      const [farmerStats] = await Loan.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$farmer",
            hasApprovedLoan: { $max: { $cond: [{ $ne: ["$approvedAmount", null] }, 1, 0] } },
            hasActiveLoan: { $max: { $cond: [{ $in: ["$status", ["approved", "partially_paid"]] }, 1, 0] } },
            hasClearedLoan: { $max: { $cond: [{ $eq: ["$status", "fully_cleared"] }, 1, 0] } }
          }
        },
        {
          $group: {
            _id: null,
            totalBorrowers: { $sum: 1 },
            activeBorrowers: { $sum: "$hasActiveLoan" },
            clearedBorrowers: { $sum: "$hasClearedLoan" }
          }
        }
      ]);

      const stats = overviewStats || {};
      const farmers = farmerStats || {};

      // Calculate rates
      const approvalRate = stats.totalLoans > 0 
        ? ((stats.approvedLoans / stats.totalLoans) * 100).toFixed(1)
        : 0;
      
      const recoveryRate = stats.totalApproved > 0 
        ? ((stats.totalReturned / stats.totalApproved) * 100).toFixed(1)
        : 0;

      return {
        totalRequested: stats.totalRequested || 0,
        totalApproved: stats.totalApproved || 0,
        totalReturned: stats.totalReturned || 0,
        totalOutstanding: stats.totalOutstanding || 0,
        approvalRate: parseFloat(approvalRate),
        recoveryRate: parseFloat(recoveryRate),
        activeBorrowers: farmers.activeBorrowers || 0,
        clearedBorrowers: farmers.clearedBorrowers || 0,
        totalBorrowers: farmers.totalBorrowers || 0,
        totalLoans: stats.totalLoans || 0,
        approvedLoans: stats.approvedLoans || 0,
        activeLoans: stats.activeLoans || 0,
        clearedLoans: stats.clearedLoans || 0
      };
    } catch (error) {
      console.error('Error in getLoanOverviewStats:', error);
      return {
        totalRequested: 0,
        totalApproved: 0,
        totalReturned: 0,
        totalOutstanding: 0,
        approvalRate: 0,
        recoveryRate: 0,
        activeBorrowers: 0,
        clearedBorrowers: 0,
        totalBorrowers: 0,
        totalLoans: 0,
        approvedLoans: 0,
        activeLoans: 0,
        clearedLoans: 0
      };
    }
  }

  /**
   * Get loan distribution by status
   * @returns {Array} Loan status distribution
   */
  static async getLoanStatusDistribution() {
    try {
      const statusDistribution = await Loan.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ["$approvedAmount", "$requestedAmount"] } },
            avgAmount: { $avg: { $ifNull: ["$approvedAmount", "$requestedAmount"] } }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Calculate total for percentages
      const totalLoans = statusDistribution.reduce((sum, item) => sum + item.count, 0);

      return statusDistribution.map(item => ({
        status: item._id,
        count: item.count,
        amount: item.totalAmount || 0,
        avgAmount: Math.round(item.avgAmount || 0),
        percentage: totalLoans > 0 ? ((item.count / totalLoans) * 100).toFixed(1) : 0
      }));
    } catch (error) {
      console.error('Error in getLoanStatusDistribution:', error);
      return [];
    }
  }

  /**
   * Get loan trends over time
   * @param {string} period - Time period ('week', 'month', 'quarter')
   * @returns {Object} Loan trends data
   */
  static async getLoanTrends(period = 'month') {
    try {
      // Calculate date range based on period
      const now = new Date();
      let startDate;
      let groupFormat;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupFormat = "%Y-%m-%d";
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          groupFormat = "%Y-%m";
          break;
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          groupFormat = "%Y-%m-%d";
      }

      // Get request trends
      const requestTrends = await Loan.aggregate([
        { $match: { requestDate: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: "$requestDate" } },
            count: { $sum: 1 },
            amount: { $sum: "$requestedAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get approval trends
      const approvalTrends = await Loan.aggregate([
        { 
          $match: { 
            approvalDate: { $gte: startDate },
            approvedAmount: { $ne: null }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: "$approvalDate" } },
            count: { $sum: 1 },
            amount: { $sum: "$approvedAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get payment trends from loan history
      const paymentTrends = await Loan.aggregate([
        { $unwind: "$history" },
        {
          $match: {
            "history.date": { $gte: startDate },
            "history.transactionType": { $in: ["partial_payment", "full_payment"] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: "$history.date" } },
            count: { $sum: 1 },
            amount: { $sum: { $abs: "$history.transactionAmount" } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        requests: requestTrends.map(item => ({
          date: item._id,
          count: item.count,
          amount: item.amount
        })),
        approvals: approvalTrends.map(item => ({
          date: item._id,
          count: item.count,
          amount: item.amount
        })),
        payments: paymentTrends.map(item => ({
          date: item._id,
          count: item.count,
          amount: item.amount
        }))
      };
    } catch (error) {
      console.error('Error in getLoanTrends:', error);
      return {
        requests: [],
        approvals: [],
        payments: []
      };
    }
  }

  /**
   * Get farmer-specific loan analytics
   * @param {number} limit - Number of top farmers to return
   * @returns {Array} Top borrowers data
   */
  static async getFarmerLoanAnalytics(limit = 10) {
    try {
      const topBorrowers = await Loan.aggregate([
        {
          $group: {
            _id: "$farmer",
            totalRequested: { $sum: "$requestedAmount" },
            totalApproved: { $sum: { $ifNull: ["$approvedAmount", 0] } },
            totalReturned: { $sum: "$totalReturned" },
            totalOutstanding: { $sum: "$totalDue" },
            loanCount: { $sum: 1 },
            approvedCount: { $sum: { $cond: [{ $ne: ["$approvedAmount", null] }, 1, 0] } },
            clearedCount: { $sum: { $cond: [{ $eq: ["$status", "fully_cleared"] }, 1, 0] } },
            lastLoanDate: { $max: "$requestDate" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "farmerInfo"
          }
        },
        {
          $addFields: {
            farmer: { $arrayElemAt: ["$farmerInfo", 0] },
            creditScore: {
              $cond: [
                { $gt: ["$approvedCount", 0] },
                { $multiply: [{ $divide: ["$clearedCount", "$approvedCount"] }, 100] },
                0
              ]
            }
          }
        },
        { $sort: { totalApproved: -1 } },
        { $limit: limit },
        {
          $project: {
            farmer: {
              _id: "$farmer._id",
              username: "$farmer.username",
              uniqueId: "$farmer.uniqueId"
            },
            totalRequested: 1,
            totalApproved: 1,
            totalReturned: 1,
            totalOutstanding: 1,
            loanCount: 1,
            approvedCount: 1,
            clearedCount: 1,
            creditScore: { $round: ["$creditScore", 1] },
            lastLoanDate: 1
          }
        }
      ]);

      return topBorrowers;
    } catch (error) {
      console.error('Error in getFarmerLoanAnalytics:', error);
      return [];
    }
  }

  /**
   * Get employee performance in loan management
   * @returns {Array} Employee loan performance data
   */
  static async getEmployeeLoanPerformance() {
    try {
      const employeePerformance = await Loan.aggregate([
        { $match: { approvedBy: { $ne: null } } },
        {
          $group: {
            _id: "$approvedBy",
            loansApproved: { $sum: 1 },
            totalAmount: { $sum: "$approvedAmount" },
            avgAmount: { $avg: "$approvedAmount" },
            processingTimes: {
              $push: {
                $divide: [
                  { $subtract: ["$approvalDate", "$requestDate"] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "employeeInfo"
          }
        },
        {
          $addFields: {
            employee: { $arrayElemAt: ["$employeeInfo", 0] },
            avgProcessingTime: { $avg: "$processingTimes" }
          }
        },
        { $sort: { loansApproved: -1 } },
        {
          $project: {
            employee: {
              _id: "$employee._id",
              username: "$employee.username",
              uniqueId: "$employee.uniqueId"
            },
            loansApproved: 1,
            totalAmount: 1,
            avgAmount: { $round: ["$avgAmount", 0] },
            avgProcessingTime: { $round: ["$avgProcessingTime", 1] }
          }
        }
      ]);

      return employeePerformance;
    } catch (error) {
      console.error('Error in getEmployeeLoanPerformance:', error);
      return [];
    }
  }

  /**
   * Get loan purpose analysis
   * @returns {Array} Loan purpose analytics
   */
  static async getLoanPurposeAnalysis() {
    try {
      const purposeAnalysis = await Loan.aggregate([
        { $match: { purpose: { $ne: null, $ne: "" } } },
        {
          $group: {
            _id: "$purpose",
            count: { $sum: 1 },
            totalAmount: { $sum: { $ifNull: ["$approvedAmount", "$requestedAmount"] } },
            avgAmount: { $avg: { $ifNull: ["$approvedAmount", "$requestedAmount"] } },
            approvedCount: { $sum: { $cond: [{ $ne: ["$approvedAmount", null] }, 1, 0] } },
            clearedCount: { $sum: { $cond: [{ $eq: ["$status", "fully_cleared"] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            approvalRate: {
              $cond: [
                { $gt: ["$count", 0] },
                { $multiply: [{ $divide: ["$approvedCount", "$count"] }, 100] },
                0
              ]
            },
            successRate: {
              $cond: [
                { $gt: ["$approvedCount", 0] },
                { $multiply: [{ $divide: ["$clearedCount", "$approvedCount"] }, 100] },
                0
              ]
            }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            purpose: "$_id",
            count: 1,
            totalAmount: 1,
            avgAmount: { $round: ["$avgAmount", 0] },
            approvalRate: { $round: ["$approvalRate", 1] },
            successRate: { $round: ["$successRate", 1] }
          }
        }
      ]);

      return purposeAnalysis;
    } catch (error) {
      console.error('Error in getLoanPurposeAnalysis:', error);
      return [];
    }
  }

  /**
   * Get loan risk assessment metrics
   * @returns {Object} Risk assessment data
   */
  static async getLoanRiskAssessment() {
    try {
      // Get overdue loans (loans with outstanding dues)
      const [riskMetrics] = await Loan.aggregate([
        {
          $group: {
            _id: null,
            totalActiveLoans: {
              $sum: { $cond: [{ $in: ["$status", ["approved", "partially_paid"]] }, 1, 0] }
            },
            overdueLoans: {
              $sum: { $cond: [{ $gt: ["$totalDue", 0] }, 1, 0] }
            },
            totalOutstanding: { $sum: "$totalDue" },
            totalApproved: { $sum: { $ifNull: ["$approvedAmount", 0] } },
            highRiskLoans: {
              $sum: { $cond: [{ $gt: ["$totalDue", 50000] }, 1, 0] }
            }
          }
        }
      ]);

      // Calculate concentration risk (top 5 borrowers' share)
      const topBorrowers = await this.getFarmerLoanAnalytics(5);
      const topBorrowersOutstanding = topBorrowers.reduce((sum, borrower) => sum + borrower.totalOutstanding, 0);
      
      const metrics = riskMetrics || {};
      const totalOutstanding = metrics.totalOutstanding || 0;
      
      const concentrationRisk = totalOutstanding > 0 
        ? ((topBorrowersOutstanding / totalOutstanding) * 100).toFixed(1)
        : 0;

      const riskScore = metrics.totalActiveLoans > 0 
        ? ((metrics.overdueLoans / metrics.totalActiveLoans) * 100).toFixed(1)
        : 0;

      return {
        overdueLoans: metrics.overdueLoans || 0,
        totalActiveLoans: metrics.totalActiveLoans || 0,
        riskScore: parseFloat(riskScore),
        concentrationRisk: parseFloat(concentrationRisk),
        highRiskLoans: metrics.highRiskLoans || 0,
        totalOutstanding: totalOutstanding,
        portfolioHealth: riskScore < 10 ? 'Good' : riskScore < 25 ? 'Moderate' : 'High Risk'
      };
    } catch (error) {
      console.error('Error in getLoanRiskAssessment:', error);
      return {
        overdueLoans: 0,
        totalActiveLoans: 0,
        riskScore: 0,
        concentrationRisk: 0,
        highRiskLoans: 0,
        totalOutstanding: 0,
        portfolioHealth: 'Unknown'
      };
    }
  }

  /**
   * Get comprehensive loan analytics for admin dashboard
   * @param {Object} options - Analytics options
   * @returns {Object} Complete loan analytics data
   */
  static async getComprehensiveLoanAnalytics(options = {}) {
    try {
      const [
        overview,
        statusDistribution,
        trends,
        topBorrowers,
        employeePerformance,
        purposeAnalysis,
        riskAssessment
      ] = await Promise.all([
        this.getLoanOverviewStats(options.dateRange),
        this.getLoanStatusDistribution(),
        this.getLoanTrends(options.period || 'month'),
        this.getFarmerLoanAnalytics(options.topBorrowersLimit || 10),
        this.getEmployeeLoanPerformance(),
        this.getLoanPurposeAnalysis(),
        this.getLoanRiskAssessment()
      ]);

      return {
        overview,
        statusDistribution,
        trends,
        topBorrowers,
        employeePerformance,
        purposeAnalysis,
        riskAssessment,
        metadata: {
          generatedAt: new Date().toISOString(),
          period: options.period || 'month',
          dateRange: options.dateRange || null
        }
      };
    } catch (error) {
      console.error('Error in getComprehensiveLoanAnalytics:', error);
      throw new Error('Failed to generate loan analytics');
    }
  }
}

export default LoanAnalyticsService;