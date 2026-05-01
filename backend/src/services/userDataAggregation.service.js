import User from "../models/User.model.js";
import MilkEntry from "../models/MilkEntry.model.js";
import Delivery from "../models/Delivery.model.js";
import Animal from "../models/Animal.model.js";

/**
 * User Data Aggregation Service for Admin Comprehensive Data Access
 * Provides comprehensive profile data aggregation for farmers, buyers, and employees
 */
export class UserDataService {
  
  /**
   * Get comprehensive profile data for a user
   * @param {String} userId - User ID
   * @param {Object} options - Options for data aggregation
   * @returns {Object} Comprehensive user profile data
   */
  static async getComprehensiveProfile(userId, options = {}) {
    const { 
      includeActivities = true, 
      activityLimit = 50,
      includeAnalytics = true,
      includeTransactions = true,
      dateRange = null
    } = options;

    try {
      // Get user basic information
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        throw new Error("User not found");
      }

      if (!["farmer", "buyer", "employee"].includes(user.role)) {
        throw new Error("Profile can only be viewed for farmers, buyers, and employees");
      }

      const profileData = {
        user: user.toObject(),
        roleSpecificData: {},
        activities: [],
        analytics: {},
        transactions: []
      };

      // Get role-specific data based on user role
      switch (user.role) {
        case 'farmer':
          profileData.roleSpecificData = await this.getFarmerSpecificData(userId, {
            includeActivities,
            activityLimit,
            includeAnalytics,
            includeTransactions,
            dateRange
          });
          break;
          
        case 'buyer':
          profileData.roleSpecificData = await this.getBuyerSpecificData(userId, {
            includeActivities,
            activityLimit,
            includeAnalytics,
            includeTransactions,
            dateRange
          });
          break;
          
        case 'employee':
          profileData.roleSpecificData = await this.getEmployeeSpecificData(userId, {
            includeActivities,
            activityLimit,
            includeAnalytics,
            includeTransactions,
            dateRange
          });
          break;
      }

      // Generate comprehensive analytics
      if (includeAnalytics) {
        profileData.analytics = await this.generateUserAnalytics(user, profileData.roleSpecificData);
      }

      // Generate activity timeline
      if (includeActivities) {
        profileData.activities = await this.generateActivityTimeline(user, {
          limit: activityLimit,
          dateRange
        });
      }

      return profileData;
    } catch (error) {
      throw new Error(`Profile aggregation failed: ${error.message}`);
    }
  }

  /**
   * Get farmer-specific data aggregation
   * @param {String} farmerId - Farmer user ID
   * @param {Object} options - Aggregation options
   * @returns {Object} Farmer-specific data
   */
  static async getFarmerSpecificData(farmerId, options = {}) {
    const { includeActivities, activityLimit, dateRange } = options;
    
    // Build date filter
    let dateFilter = {};
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      if (dateRange.startDate) dateFilter.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) dateFilter.$lte = new Date(dateRange.endDate);
    }

    // Get milk entries with detailed aggregation
    const milkEntriesFilter = { farmer: farmerId };
    if (Object.keys(dateFilter).length > 0) {
      milkEntriesFilter.date = dateFilter;
    }

    const milkEntries = await MilkEntry.find(milkEntriesFilter)
      .populate('collectedBy', 'username uniqueId')
      .sort({ date: -1 })
      .limit(includeActivities ? activityLimit : 100);

    // Aggregate milk statistics by type
    const milkStats = await MilkEntry.aggregate([
      { $match: { farmer: farmerId, ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}) } },
      {
        $group: {
          _id: "$milkType",
          totalEntries: { $sum: 1 },
          totalLiters: { $sum: "$liters" },
          totalAmount: { $sum: "$totalAmount" },
          avgLiters: { $avg: "$liters" },
          avgRate: { $avg: "$rate" },
          maxLiters: { $max: "$liters" },
          minLiters: { $min: "$liters" },
          lastEntry: { $max: "$date" },
          firstEntry: { $min: "$date" }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await MilkEntry.aggregate([
      { $match: { farmer: farmerId, ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}) } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            milkType: "$milkType"
          },
          totalLiters: { $sum: "$liters" },
          totalAmount: { $sum: "$totalAmount" },
          entryCount: { $sum: 1 },
          avgRate: { $avg: "$rate" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    // Get animals with detailed information
    const animals = await Animal.find({ farmer: farmerId, isActive: true });
    
    // Animal statistics
    const animalStats = animals.reduce((stats, animal) => {
      const type = animal.animalType;
      if (!stats[type]) {
        stats[type] = { count: 0, breeds: new Set(), avgAge: 0, totalAge: 0 };
      }
      stats[type].count++;
      stats[type].breeds.add(animal.breed);
      stats[type].totalAge += animal.age;
      stats[type].avgAge = stats[type].totalAge / stats[type].count;
      return stats;
    }, {});

    // Convert breeds Set to Array for JSON serialization
    Object.keys(animalStats).forEach(type => {
      animalStats[type].breeds = Array.from(animalStats[type].breeds);
    });

    // Performance metrics
    const performanceMetrics = {
      consistency: this.calculateConsistencyScore(milkEntries),
      productivity: this.calculateProductivityScore(milkStats, animals.length),
      growth: this.calculateGrowthTrend(monthlyTrends),
      reliability: this.calculateReliabilityScore(milkEntries)
    };

    return {
      milkEntries: milkEntries,
      milkStatistics: milkStats,
      monthlyTrends: monthlyTrends,
      animals: animals,
      animalStatistics: animalStats,
      totalAnimals: animals.length,
      totalMilkProduced: milkStats.reduce((sum, stat) => sum + stat.totalLiters, 0),
      totalEarnings: milkStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
      averageDailyProduction: this.calculateAverageDailyProduction(milkEntries),
      performanceMetrics: performanceMetrics,
      summary: {
        activeDays: [...new Set(milkEntries.map(entry => entry.date.toDateString()))].length,
        totalEntries: milkEntries.length,
        averageRate: milkStats.length > 0 ? milkStats.reduce((sum, stat) => sum + stat.avgRate, 0) / milkStats.length : 0,
        bestMonth: this.findBestPerformanceMonth(monthlyTrends),
        milkTypeDistribution: milkStats.reduce((dist, stat) => {
          dist[stat._id] = {
            percentage: (stat.totalLiters / milkStats.reduce((sum, s) => sum + s.totalLiters, 0)) * 100,
            liters: stat.totalLiters
          };
          return dist;
        }, {})
      }
    };
  }

  /**
   * Get buyer-specific data aggregation
   * @param {String} buyerId - Buyer user ID
   * @param {Object} options - Aggregation options
   * @returns {Object} Buyer-specific data
   */
  static async getBuyerSpecificData(buyerId, options = {}) {
    const { includeActivities, activityLimit, dateRange } = options;
    
    // Build date filter
    let dateFilter = {};
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      if (dateRange.startDate) dateFilter.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) dateFilter.$lte = new Date(dateRange.endDate);
    }

    // Get deliveries with detailed information
    const deliveriesFilter = { buyer: buyerId };
    if (Object.keys(dateFilter).length > 0) {
      deliveriesFilter.createdAt = dateFilter;
    }

    const deliveries = await Delivery.find(deliveriesFilter)
      .populate('handledBy', 'username uniqueId')
      .sort({ createdAt: -1 })
      .limit(includeActivities ? activityLimit : 100);

    // Aggregate order statistics by status and type
    const orderStats = await Delivery.aggregate([
      { $match: { buyer: buyerId, ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) } },
      {
        $group: {
          _id: { status: "$status", milkType: "$milkType" },
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          avgQuantity: { $avg: "$quantity" },
          avgRate: { $avg: "$rate" },
          maxQuantity: { $max: "$quantity" },
          minQuantity: { $min: "$quantity" }
        }
      }
    ]);

    // Get monthly ordering trends
    const monthlyTrends = await Delivery.aggregate([
      { $match: { buyer: buyerId, ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            milkType: "$milkType"
          },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          avgRate: { $avg: "$rate" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    // Calculate delivery performance metrics
    const deliveryMetrics = {
      onTimeDeliveryRate: this.calculateOnTimeDeliveryRate(deliveries),
      orderFulfillmentRate: this.calculateOrderFulfillmentRate(orderStats),
      averageOrderValue: this.calculateAverageOrderValue(deliveries),
      loyaltyScore: this.calculateLoyaltyScore(deliveries, monthlyTrends)
    };

    // Spending analysis
    const spendingAnalysis = {
      totalSpent: deliveries.reduce((sum, delivery) => sum + delivery.totalAmount, 0),
      averageMonthlySpending: this.calculateAverageMonthlySpending(monthlyTrends),
      spendingTrend: this.calculateSpendingTrend(monthlyTrends),
      preferredMilkType: this.findPreferredMilkType(orderStats),
      seasonalPatterns: this.analyzeSeasonalPatterns(monthlyTrends)
    };

    return {
      orders: deliveries,
      orderStatistics: orderStats,
      monthlyTrends: monthlyTrends,
      deliveryMetrics: deliveryMetrics,
      spendingAnalysis: spendingAnalysis,
      totalOrders: deliveries.length,
      totalSpent: orderStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
      averageOrderValue: deliveries.length > 0 ? 
        deliveries.reduce((sum, delivery) => sum + delivery.totalAmount, 0) / deliveries.length : 0,
      summary: {
        activeMonths: [...new Set(deliveries.map(delivery => 
          `${delivery.createdAt.getFullYear()}-${delivery.createdAt.getMonth() + 1}`
        ))].length,
        statusBreakdown: orderStats.reduce((breakdown, stat) => {
          breakdown[stat._id.status] = (breakdown[stat._id.status] || 0) + stat.count;
          return breakdown;
        }, {}),
        milkTypePreference: orderStats.reduce((pref, stat) => {
          pref[stat._id.milkType] = (pref[stat._id.milkType] || 0) + stat.totalQuantity;
          return pref;
        }, {}),
        bestMonth: this.findBestOrderMonth(monthlyTrends)
      }
    };
  }

  /**
   * Get employee-specific data aggregation
   * @param {String} employeeId - Employee user ID
   * @param {Object} options - Aggregation options
   * @returns {Object} Employee-specific data
   */
  static async getEmployeeSpecificData(employeeId, options = {}) {
    const { includeActivities, activityLimit, dateRange } = options;
    
    // Build date filter
    let dateFilter = {};
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      if (dateRange.startDate) dateFilter.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) dateFilter.$lte = new Date(dateRange.endDate);
    }

    // Get milk collections handled by employee
    const collectionsFilter = { collectedBy: employeeId };
    if (Object.keys(dateFilter).length > 0) {
      collectionsFilter.date = dateFilter;
    }

    const collections = await MilkEntry.find(collectionsFilter)
      .populate('farmer', 'username uniqueId')
      .sort({ date: -1 })
      .limit(includeActivities ? activityLimit : 100);

    // Get deliveries handled by employee
    const deliveriesFilter = { handledBy: employeeId };
    if (Object.keys(dateFilter).length > 0) {
      deliveriesFilter.createdAt = dateFilter;
    }

    const deliveriesHandled = await Delivery.find(deliveriesFilter)
      .populate('buyer', 'username uniqueId')
      .sort({ createdAt: -1 })
      .limit(includeActivities ? activityLimit : 100);

    // Aggregate collection statistics
    const collectionStats = await MilkEntry.aggregate([
      { $match: { collectedBy: employeeId, ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}) } },
      {
        $group: {
          _id: "$milkType",
          totalCollections: { $sum: 1 },
          totalLiters: { $sum: "$liters" },
          totalAmount: { $sum: "$totalAmount" },
          uniqueFarmers: { $addToSet: "$farmer" },
          avgLiters: { $avg: "$liters" },
          avgRate: { $avg: "$rate" }
        }
      }
    ]);

    // Aggregate delivery handling statistics
    const deliveryStats = await Delivery.aggregate([
      { $match: { handledBy: employeeId, ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}) } },
      {
        $group: {
          _id: "$status",
          totalDeliveries: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          uniqueBuyers: { $addToSet: "$buyer" },
          avgQuantity: { $avg: "$quantity" }
        }
      }
    ]);

    // Calculate performance metrics
    const performanceMetrics = {
      efficiency: this.calculateEmployeeEfficiency(collections, deliveriesHandled),
      reliability: this.calculateEmployeeReliability(collections, deliveriesHandled),
      customerSatisfaction: this.calculateCustomerSatisfactionScore(deliveriesHandled),
      workload: this.calculateWorkloadDistribution(collections, deliveriesHandled)
    };

    // Work pattern analysis
    const workPatterns = {
      peakHours: this.analyzeWorkingHours(collections, deliveriesHandled),
      weeklyDistribution: this.analyzeWeeklyWorkDistribution(collections, deliveriesHandled),
      monthlyTrends: this.analyzeMonthlyWorkTrends(collections, deliveriesHandled),
      taskBalance: this.analyzeTaskBalance(collections.length, deliveriesHandled.length)
    };

    return {
      milkCollections: collections,
      deliveriesHandled: deliveriesHandled,
      collectionStatistics: collectionStats,
      deliveryStatistics: deliveryStats,
      performanceMetrics: performanceMetrics,
      workPatterns: workPatterns,
      totalCollections: collections.length,
      totalDeliveries: deliveriesHandled.length,
      uniqueFarmersServed: [...new Set(collections.map(c => c.farmer.toString()))].length,
      uniqueBuyersServed: [...new Set(deliveriesHandled.map(d => d.buyer.toString()))].length,
      summary: {
        totalLitersCollected: collectionStats.reduce((sum, stat) => sum + stat.totalLiters, 0),
        totalDeliveriesProcessed: deliveryStats.reduce((sum, stat) => sum + stat.totalDeliveries, 0),
        averageDailyCollections: this.calculateAverageDailyCollections(collections),
        averageDailyDeliveries: this.calculateAverageDailyDeliveries(deliveriesHandled),
        workEfficiencyScore: performanceMetrics.efficiency
      }
    };
  }

  /**
   * Generate comprehensive user analytics
   * @param {Object} user - User object
   * @param {Object} roleSpecificData - Role-specific data
   * @returns {Object} User analytics
   */
  static async generateUserAnalytics(user, roleSpecificData) {
    const registrationDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));
    
    let activityLevel = 'low';
    let lastActivityDate = null;
    let totalTransactions = 0;
    let totalValue = 0;

    // Calculate role-specific analytics
    switch (user.role) {
      case 'farmer':
        const milkEntries = roleSpecificData.milkEntries || [];
        totalTransactions = milkEntries.length;
        totalValue = roleSpecificData.totalEarnings || 0;
        lastActivityDate = milkEntries.length > 0 ? milkEntries[0].date : null;
        activityLevel = totalTransactions > 50 ? 'high' : totalTransactions > 15 ? 'medium' : 'low';
        break;
        
      case 'buyer':
        const orders = roleSpecificData.orders || [];
        totalTransactions = orders.length;
        totalValue = roleSpecificData.totalSpent || 0;
        lastActivityDate = orders.length > 0 ? orders[0].createdAt : null;
        activityLevel = totalTransactions > 30 ? 'high' : totalTransactions > 10 ? 'medium' : 'low';
        break;
        
      case 'employee':
        const collections = roleSpecificData.milkCollections || [];
        const deliveries = roleSpecificData.deliveriesHandled || [];
        totalTransactions = collections.length + deliveries.length;
        lastActivityDate = this.getLatestDate([
          collections.length > 0 ? collections[0].date : null,
          deliveries.length > 0 ? deliveries[0].createdAt : null
        ]);
        activityLevel = totalTransactions > 100 ? 'high' : totalTransactions > 30 ? 'medium' : 'low';
        break;
    }

    // Engagement metrics
    const engagementMetrics = {
      registrationToFirstActivity: this.calculateRegistrationToFirstActivity(user, roleSpecificData),
      averageActivityFrequency: this.calculateActivityFrequency(totalTransactions, daysSinceRegistration),
      longestInactivePeriod: this.calculateLongestInactivePeriod(roleSpecificData),
      recentActivityTrend: this.calculateRecentActivityTrend(roleSpecificData)
    };

    return {
      registrationDate,
      daysSinceRegistration,
      isActive: totalTransactions > 0,
      lastActivityDate,
      activityLevel,
      totalTransactions,
      totalValue,
      averageTransactionValue: totalTransactions > 0 ? totalValue / totalTransactions : 0,
      engagementMetrics,
      userSegment: this.determineUserSegment(user.role, activityLevel, totalValue, daysSinceRegistration),
      riskScore: this.calculateChurnRiskScore(lastActivityDate, activityLevel, daysSinceRegistration),
      lifetimeValue: this.calculateLifetimeValue(user.role, totalValue, daysSinceRegistration)
    };
  }

  /**
   * Generate activity timeline for a user
   * @param {Object} user - User object
   * @param {Object} options - Timeline options
   * @returns {Array} Activity timeline
   */
  static async generateActivityTimeline(user, options = {}) {
    const { limit = 50, dateRange } = options;
    let activities = [];

    // Build date filter
    let dateFilter = {};
    if (dateRange && (dateRange.startDate || dateRange.endDate)) {
      if (dateRange.startDate) dateFilter.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) dateFilter.$lte = new Date(dateRange.endDate);
    }

    // Get activities based on user role
    switch (user.role) {
      case 'farmer':
        const milkFilter = { farmer: user._id };
        if (Object.keys(dateFilter).length > 0) {
          milkFilter.date = dateFilter;
        }

        const milkEntries = await MilkEntry.find(milkFilter)
          .populate('collectedBy', 'username uniqueId')
          .sort({ date: -1 })
          .limit(limit);

        activities = milkEntries.map(entry => ({
          _id: entry._id,
          type: 'milk_entry',
          date: entry.date,
          description: `Milk collection: ${entry.liters}L ${entry.milkType} milk`,
          amount: entry.totalAmount,
          status: 'completed',
          details: {
            liters: entry.liters,
            rate: entry.rate,
            milkType: entry.milkType,
            collectedBy: entry.collectedBy
          },
          metadata: {
            category: 'production',
            priority: 'normal',
            impact: entry.liters > 20 ? 'high' : entry.liters > 10 ? 'medium' : 'low'
          }
        }));
        break;

      case 'buyer':
        const deliveryFilter = { buyer: user._id };
        if (Object.keys(dateFilter).length > 0) {
          deliveryFilter.createdAt = dateFilter;
        }

        const deliveries = await Delivery.find(deliveryFilter)
          .populate('handledBy', 'username uniqueId')
          .sort({ createdAt: -1 })
          .limit(limit);

        activities = deliveries.map(delivery => ({
          _id: delivery._id,
          type: 'order',
          date: delivery.createdAt,
          description: `Order: ${delivery.quantity}L ${delivery.milkType} milk`,
          amount: delivery.totalAmount,
          status: delivery.status.toLowerCase(),
          details: {
            quantity: delivery.quantity,
            rate: delivery.rate,
            milkType: delivery.milkType,
            deliveryDate: delivery.deliveryDate,
            address: delivery.address,
            handledBy: delivery.handledBy
          },
          metadata: {
            category: 'purchase',
            priority: delivery.status === 'Pending' ? 'high' : 'normal',
            impact: delivery.quantity > 15 ? 'high' : delivery.quantity > 8 ? 'medium' : 'low'
          }
        }));
        break;

      case 'employee':
        // Get both collections and deliveries
        const collectionFilter = { collectedBy: user._id };
        const deliveryHandledFilter = { handledBy: user._id };
        
        if (Object.keys(dateFilter).length > 0) {
          collectionFilter.date = dateFilter;
          deliveryHandledFilter.createdAt = dateFilter;
        }

        const [collections, deliveriesHandled] = await Promise.all([
          MilkEntry.find(collectionFilter)
            .populate('farmer', 'username uniqueId')
            .sort({ date: -1 })
            .limit(Math.floor(limit / 2)),
          Delivery.find(deliveryHandledFilter)
            .populate('buyer', 'username uniqueId')
            .sort({ createdAt: -1 })
            .limit(Math.floor(limit / 2))
        ]);

        const collectionActivities = collections.map(collection => ({
          _id: collection._id,
          type: 'milk_collection',
          date: collection.date,
          description: `Collected ${collection.liters}L ${collection.milkType} milk from ${collection.farmer?.username}`,
          amount: collection.totalAmount,
          status: 'completed',
          details: {
            liters: collection.liters,
            milkType: collection.milkType,
            farmer: collection.farmer
          },
          metadata: {
            category: 'collection',
            priority: 'normal',
            impact: collection.liters > 25 ? 'high' : collection.liters > 12 ? 'medium' : 'low'
          }
        }));

        const deliveryActivities = deliveriesHandled.map(delivery => ({
          _id: delivery._id,
          type: 'delivery_handled',
          date: delivery.createdAt,
          description: `Handled delivery for ${delivery.buyer?.username}`,
          amount: delivery.totalAmount,
          status: delivery.status.toLowerCase(),
          details: {
            quantity: delivery.quantity,
            milkType: delivery.milkType,
            status: delivery.status,
            buyer: delivery.buyer
          },
          metadata: {
            category: 'delivery',
            priority: delivery.status === 'Pending' ? 'high' : 'normal',
            impact: delivery.quantity > 18 ? 'high' : delivery.quantity > 10 ? 'medium' : 'low'
          }
        }));

        activities = [...collectionActivities, ...deliveryActivities]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, limit);
        break;
    }

    // Add timeline metadata
    return activities.map((activity, index) => ({
      ...activity,
      timelinePosition: index + 1,
      relativeTime: this.calculateRelativeTime(activity.date),
      daysSinceActivity: Math.floor((new Date() - new Date(activity.date)) / (1000 * 60 * 60 * 24))
    }));
  }

  // Helper methods for calculations
  static calculateConsistencyScore(milkEntries) {
    if (milkEntries.length < 7) return 0;
    
    const dailyProduction = {};
    milkEntries.forEach(entry => {
      const date = entry.date.toDateString();
      dailyProduction[date] = (dailyProduction[date] || 0) + entry.liters;
    });
    
    const productions = Object.values(dailyProduction);
    const mean = productions.reduce((sum, prod) => sum + prod, 0) / productions.length;
    const variance = productions.reduce((sum, prod) => sum + Math.pow(prod - mean, 2), 0) / productions.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 100 - (stdDev / mean) * 100);
  }

  static calculateProductivityScore(milkStats, animalCount) {
    if (animalCount === 0) return 0;
    
    const totalLiters = milkStats.reduce((sum, stat) => sum + stat.totalLiters, 0);
    const totalEntries = milkStats.reduce((sum, stat) => sum + stat.totalEntries, 0);
    
    if (totalEntries === 0) return 0;
    
    const avgLitersPerAnimalPerEntry = totalLiters / (animalCount * totalEntries);
    return Math.min(100, avgLitersPerAnimalPerEntry * 10);
  }

  static calculateGrowthTrend(monthlyTrends) {
    if (monthlyTrends.length < 2) return 0;
    
    const recent = monthlyTrends.slice(0, 3);
    const older = monthlyTrends.slice(-3);
    
    const recentAvg = recent.reduce((sum, trend) => sum + trend.totalLiters, 0) / recent.length;
    const olderAvg = older.reduce((sum, trend) => sum + trend.totalLiters, 0) / older.length;
    
    return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
  }

  static calculateReliabilityScore(entries) {
    if (entries.length === 0) return 0;
    
    const last30Days = entries.filter(entry => 
      (new Date() - new Date(entry.date)) <= (30 * 24 * 60 * 60 * 1000)
    );
    
    return Math.min(100, (last30Days.length / 30) * 100);
  }

  static calculateAverageDailyProduction(milkEntries) {
    if (milkEntries.length === 0) return 0;
    
    const dailyProduction = {};
    milkEntries.forEach(entry => {
      const date = entry.date.toDateString();
      dailyProduction[date] = (dailyProduction[date] || 0) + entry.liters;
    });
    
    const productions = Object.values(dailyProduction);
    return productions.reduce((sum, prod) => sum + prod, 0) / productions.length;
  }

  static findBestPerformanceMonth(monthlyTrends) {
    if (monthlyTrends.length === 0) return null;
    
    return monthlyTrends.reduce((best, current) => 
      current.totalLiters > (best?.totalLiters || 0) ? current : best
    );
  }

  static calculateOnTimeDeliveryRate(deliveries) {
    if (deliveries.length === 0) return 0;
    
    const onTimeDeliveries = deliveries.filter(delivery => 
      delivery.status === 'Completed' && 
      new Date(delivery.deliveryDate) <= new Date(delivery.createdAt).setDate(new Date(delivery.createdAt).getDate() + 1)
    );
    
    return (onTimeDeliveries.length / deliveries.length) * 100;
  }

  static calculateOrderFulfillmentRate(orderStats) {
    const totalOrders = orderStats.reduce((sum, stat) => sum + stat.count, 0);
    const fulfilledOrders = orderStats
      .filter(stat => ['Completed', 'Approved'].includes(stat._id.status))
      .reduce((sum, stat) => sum + stat.count, 0);
    
    return totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;
  }

  static calculateAverageOrderValue(deliveries) {
    if (deliveries.length === 0) return 0;
    return deliveries.reduce((sum, delivery) => sum + delivery.totalAmount, 0) / deliveries.length;
  }

  static calculateLoyaltyScore(deliveries, monthlyTrends) {
    const monthsActive = monthlyTrends.length;
    const totalOrders = deliveries.length;
    const avgOrdersPerMonth = monthsActive > 0 ? totalOrders / monthsActive : 0;
    
    return Math.min(100, (monthsActive * 10) + (avgOrdersPerMonth * 5));
  }

  static calculateRelativeTime(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  // Additional helper methods would be implemented here...
  static calculateAverageMonthlySpending(monthlyTrends) { return 0; }
  static calculateSpendingTrend(monthlyTrends) { return 0; }
  static findPreferredMilkType(orderStats) { return 'cow'; }
  static analyzeSeasonalPatterns(monthlyTrends) { return {}; }
  static findBestOrderMonth(monthlyTrends) { return null; }
  static calculateEmployeeEfficiency(collections, deliveries) { return 0; }
  static calculateEmployeeReliability(collections, deliveries) { return 0; }
  static calculateCustomerSatisfactionScore(deliveries) { return 0; }
  static calculateWorkloadDistribution(collections, deliveries) { return {}; }
  static analyzeWorkingHours(collections, deliveries) { return {}; }
  static analyzeWeeklyWorkDistribution(collections, deliveries) { return {}; }
  static analyzeMonthlyWorkTrends(collections, deliveries) { return {}; }
  static analyzeTaskBalance(collectionsCount, deliveriesCount) { return {}; }
  static calculateAverageDailyCollections(collections) { return 0; }
  static calculateAverageDailyDeliveries(deliveries) { return 0; }
  static calculateRegistrationToFirstActivity(user, roleData) { return 0; }
  static calculateActivityFrequency(transactions, days) { return 0; }
  static calculateLongestInactivePeriod(roleData) { return 0; }
  static calculateRecentActivityTrend(roleData) { return 0; }
  static determineUserSegment(role, activityLevel, totalValue, daysSinceReg) { return 'standard'; }
  static calculateChurnRiskScore(lastActivity, activityLevel, daysSinceReg) { return 0; }
  static calculateLifetimeValue(role, totalValue, daysSinceReg) { return 0; }
  static getLatestDate(dates) { 
    const validDates = dates.filter(d => d !== null);
    return validDates.length > 0 ? new Date(Math.max(...validDates.map(d => new Date(d)))) : null;
  }
}

export default UserDataService;