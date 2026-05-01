import User from "../models/User.model.js";
import MilkEntry from "../models/MilkEntry.model.js";
import Delivery from "../models/Delivery.model.js";
import Animal from "../models/Animal.model.js";

/**
 * Comprehensive Search Service for Admin Data Access
 * Provides advanced search and filtering capabilities with MongoDB aggregation pipelines
 */
export class SearchService {
  
  /**
   * Build comprehensive search filter for users
   * @param {Object} searchParams - Search parameters
   * @returns {Object} MongoDB filter object
   */
  static buildUserSearchFilter(searchParams) {
    const { 
      role, 
      approved, 
      search, 
      dateFrom, 
      dateTo, 
      uniqueIdPattern,
      location,
      activityLevel,
      hasAnimals,
      hasOrders,
      hasMilkEntries
    } = searchParams;

    let filter = { role: { $in: ["farmer", "buyer", "employee"] } };
    
    // Role filter
    if (role && ["farmer", "buyer", "employee"].includes(role)) {
      filter.role = role;
    }
    
    // Approval status filter
    if (approved !== undefined) {
      filter.approved = approved === 'true' || approved === true;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    // Text search across multiple fields
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { username: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { address: searchRegex },
        { uniqueId: searchRegex }
      ];
    }
    
    // Unique ID pattern matching
    if (uniqueIdPattern && uniqueIdPattern.trim()) {
      filter.uniqueId = { $regex: uniqueIdPattern.trim(), $options: 'i' };
    }
    
    // Location-based search
    if (location && location.trim()) {
      filter.address = { $regex: location.trim(), $options: 'i' };
    }

    return filter;
  }

  /**
   * Build advanced aggregation pipeline for comprehensive user search
   * @param {Object} searchParams - Search parameters
   * @param {Object} paginationParams - Pagination parameters
   * @returns {Array} MongoDB aggregation pipeline
   */
  static buildUserAggregationPipeline(searchParams, paginationParams) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = paginationParams;
    const { activityLevel, hasAnimals, hasOrders, hasMilkEntries } = searchParams;
    
    const pipeline = [];
    
    // Match basic filters
    const matchFilter = this.buildUserSearchFilter(searchParams);
    pipeline.push({ $match: matchFilter });
    
    // Add role-specific data lookups
    pipeline.push({
      $lookup: {
        from: 'milkentries',
        localField: '_id',
        foreignField: 'farmer',
        as: 'milkEntries'
      }
    });
    
    pipeline.push({
      $lookup: {
        from: 'deliveries',
        localField: '_id',
        foreignField: 'buyer',
        as: 'orders'
      }
    });
    
    pipeline.push({
      $lookup: {
        from: 'animals',
        localField: '_id',
        foreignField: 'farmer',
        as: 'animals'
      }
    });
    
    pipeline.push({
      $lookup: {
        from: 'milkentries',
        localField: '_id',
        foreignField: 'collectedBy',
        as: 'collections'
      }
    });
    
    pipeline.push({
      $lookup: {
        from: 'deliveries',
        localField: '_id',
        foreignField: 'handledBy',
        as: 'deliveriesHandled'
      }
    });
    
    // Add computed fields
    pipeline.push({
      $addFields: {
        totalMilkEntries: { $size: '$milkEntries' },
        totalOrders: { $size: '$orders' },
        totalAnimals: { $size: '$animals' },
        totalCollections: { $size: '$collections' },
        totalDeliveriesHandled: { $size: '$deliveriesHandled' },
        lastActivity: {
          $max: [
            { $max: '$milkEntries.date' },
            { $max: '$orders.createdAt' },
            { $max: '$collections.date' },
            { $max: '$deliveriesHandled.createdAt' }
          ]
        }
      }
    });
    
    // Activity level filter
    if (activityLevel) {
      const activityFilters = {
        high: { $expr: { $gt: [{ $add: ['$totalMilkEntries', '$totalOrders', '$totalCollections'] }, 20] } },
        medium: { $expr: { $and: [
          { $gt: [{ $add: ['$totalMilkEntries', '$totalOrders', '$totalCollections'] }, 5] },
          { $lte: [{ $add: ['$totalMilkEntries', '$totalOrders', '$totalCollections'] }, 20] }
        ] } },
        low: { $expr: { $lte: [{ $add: ['$totalMilkEntries', '$totalOrders', '$totalCollections'] }, 5] } }
      };
      
      if (activityFilters[activityLevel]) {
        pipeline.push({ $match: activityFilters[activityLevel] });
      }
    }
    
    // Has animals filter
    if (hasAnimals !== undefined) {
      const hasAnimalsFilter = hasAnimals === 'true' || hasAnimals === true;
      pipeline.push({
        $match: hasAnimalsFilter 
          ? { $expr: { $gt: ['$totalAnimals', 0] } }
          : { $expr: { $eq: ['$totalAnimals', 0] } }
      });
    }
    
    // Has orders filter
    if (hasOrders !== undefined) {
      const hasOrdersFilter = hasOrders === 'true' || hasOrders === true;
      pipeline.push({
        $match: hasOrdersFilter 
          ? { $expr: { $gt: ['$totalOrders', 0] } }
          : { $expr: { $eq: ['$totalOrders', 0] } }
      });
    }
    
    // Has milk entries filter
    if (hasMilkEntries !== undefined) {
      const hasMilkEntriesFilter = hasMilkEntries === 'true' || hasMilkEntries === true;
      pipeline.push({
        $match: hasMilkEntriesFilter 
          ? { $expr: { $gt: ['$totalMilkEntries', 0] } }
          : { $expr: { $eq: ['$totalMilkEntries', 0] } }
      });
    }
    
    // Remove password field
    pipeline.push({
      $project: {
        password: 0,
        milkEntries: 0,
        orders: 0,
        animals: 0,
        collections: 0,
        deliveriesHandled: 0
      }
    });
    
    // Sorting
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortField = sortBy === 'lastActivity' ? 'lastActivity' : sortBy;
    pipeline.push({ $sort: { [sortField]: sortDirection } });
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });
    
    return pipeline;
  }

  /**
   * Perform comprehensive user search with advanced filtering
   * @param {Object} searchParams - Search parameters
   * @param {Object} paginationParams - Pagination parameters
   * @returns {Object} Search results with users and metadata
   */
  static async searchUsers(searchParams, paginationParams) {
    try {
      // Get total count pipeline (without pagination)
      const countPipeline = this.buildUserAggregationPipeline(searchParams, { ...paginationParams, page: 1, limit: 999999 });
      // Remove pagination stages for count
      const countPipelineForCount = countPipeline.slice(0, -2);
      countPipelineForCount.push({ $count: "total" });
      
      // Get search results pipeline
      const searchPipeline = this.buildUserAggregationPipeline(searchParams, paginationParams);
      
      // Execute both pipelines
      const [countResult, users] = await Promise.all([
        User.aggregate(countPipelineForCount),
        User.aggregate(searchPipeline)
      ]);
      
      const total = countResult[0]?.total || 0;
      const { page = 1, limit = 20 } = paginationParams;
      
      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        searchMetadata: {
          searchParams,
          resultsFound: users.length,
          totalMatches: total
        }
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Build filter combinations with logical operators
   * @param {Array} filterGroups - Array of filter group objects
   * @param {String} operator - Logical operator ('AND' or 'OR')
   * @returns {Object} Combined filter object
   */
  static combineFilters(filterGroups, operator = 'AND') {
    if (!filterGroups || filterGroups.length === 0) {
      return {};
    }
    
    if (filterGroups.length === 1) {
      return filterGroups[0];
    }
    
    if (operator === 'OR') {
      return { $or: filterGroups };
    } else {
      return { $and: filterGroups };
    }
  }

  /**
   * Get search suggestions based on partial input
   * @param {String} query - Partial search query
   * @param {String} field - Field to search in
   * @param {Number} limit - Maximum suggestions to return
   * @returns {Array} Array of suggestions
   */
  static async getSearchSuggestions(query, field = 'username', limit = 10) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const searchRegex = { $regex: `^${query.trim()}`, $options: 'i' };
    const filter = {
      role: { $in: ["farmer", "buyer", "employee"] },
      [field]: searchRegex
    };
    
    try {
      const suggestions = await User.find(filter)
        .select(`${field} role uniqueId`)
        .limit(parseInt(limit))
        .sort({ [field]: 1 });
      
      return suggestions.map(user => ({
        value: user[field],
        label: `${user[field]} (${user.role}${user.uniqueId ? ` - ${user.uniqueId}` : ''})`,
        role: user.role,
        uniqueId: user.uniqueId
      }));
    } catch (error) {
      throw new Error(`Suggestions failed: ${error.message}`);
    }
  }

  /**
   * Reset and clear all search filters
   * @returns {Object} Empty filter object
   */
  static resetFilters() {
    return {
      role: undefined,
      approved: undefined,
      search: '',
      dateFrom: undefined,
      dateTo: undefined,
      uniqueIdPattern: '',
      location: '',
      activityLevel: undefined,
      hasAnimals: undefined,
      hasOrders: undefined,
      hasMilkEntries: undefined
    };
  }

  /**
   * Validate search parameters
   * @param {Object} searchParams - Search parameters to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateSearchParams(searchParams) {
    const errors = [];
    const { role, dateFrom, dateTo, activityLevel } = searchParams;
    
    // Validate role
    if (role && !["farmer", "buyer", "employee"].includes(role)) {
      errors.push("Invalid role specified. Must be 'farmer', 'buyer', or 'employee'");
    }
    
    // Validate date range
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      if (isNaN(fromDate.getTime())) {
        errors.push("Invalid 'dateFrom' format");
      }
      
      if (isNaN(toDate.getTime())) {
        errors.push("Invalid 'dateTo' format");
      }
      
      if (fromDate > toDate) {
        errors.push("'dateFrom' cannot be later than 'dateTo'");
      }
    }
    
    // Validate activity level
    if (activityLevel && !["low", "medium", "high"].includes(activityLevel)) {
      errors.push("Invalid activity level. Must be 'low', 'medium', or 'high'");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get search analytics and statistics
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Search analytics data
   */
  static async getSearchAnalytics(searchParams) {
    try {
      const filter = this.buildUserSearchFilter(searchParams);
      
      // Get role distribution
      const roleDistribution = await User.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            approved: { $sum: { $cond: ["$approved", 1, 0] } },
            pending: { $sum: { $cond: ["$approved", 0, 1] } }
          }
        }
      ]);
      
      // Get registration trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const registrationTrends = await User.aggregate([
        { 
          $match: { 
            ...filter,
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              role: "$role"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.date": 1 } }
      ]);
      
      // Get activity statistics
      const activityStats = await User.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'milkentries',
            localField: '_id',
            foreignField: 'farmer',
            as: 'milkEntries'
          }
        },
        {
          $lookup: {
            from: 'deliveries',
            localField: '_id',
            foreignField: 'buyer',
            as: 'orders'
          }
        },
        {
          $addFields: {
            totalActivities: { $add: [{ $size: '$milkEntries' }, { $size: '$orders' }] }
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $gt: ['$totalActivities', 0] }, 1, 0] } },
            averageActivities: { $avg: '$totalActivities' },
            maxActivities: { $max: '$totalActivities' }
          }
        }
      ]);
      
      return {
        roleDistribution,
        registrationTrends,
        activityStats: activityStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          averageActivities: 0,
          maxActivities: 0
        }
      };
    } catch (error) {
      throw new Error(`Analytics failed: ${error.message}`);
    }
  }
}

export default SearchService;