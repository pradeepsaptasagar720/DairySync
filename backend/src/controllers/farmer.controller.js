import Animal from "../models/Animal.model.js";
import MilkEntry from "../models/MilkEntry.model.js";
import Loan from "../models/Loan.model.js";
import Feed from "../models/Feed.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

// Get farmer's milk history with filters
export const getMilkHistory = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;
  const { 
    dateFrom, 
    dateTo, 
    session, 
    milkType, 
    page = 1, 
    limit = 20 
  } = req.query;

  try {
    // Build filter object
    let filter = { farmer: farmerId };

    // Date range filter
    if (dateFrom && dateTo) {
      filter.date = { $gte: dateFrom, $lte: dateTo };
    } else if (dateFrom) {
      filter.date = { $gte: dateFrom };
    } else if (dateTo) {
      filter.date = { $lte: dateTo };
    }

    // Session filter
    if (session && session !== 'both') {
      filter.session = session;
    }

    // Get milk entries with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let milkEntries = await MilkEntry.find(filter)
      .populate('collectedBy', 'username uniqueId')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by milk type if specified
    if (milkType && milkType !== 'both') {
      milkEntries = milkEntries.filter(entry => {
        if (milkType === 'cow') {
          return entry.cow && entry.cow.quantity > 0;
        } else if (milkType === 'buffalo') {
          return entry.buffalo && entry.buffalo.quantity > 0;
        }
        return true;
      });
    }

    // Get total count for pagination
    const totalEntries = await MilkEntry.countDocuments(filter);

    // Calculate summary for the filtered results
    const summary = milkEntries.reduce((acc, entry) => {
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
      data: {
        entries: milkEntries,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalEntries,
          pages: Math.ceil(totalEntries / parseInt(limit))
        },
        filters: {
          dateFrom,
          dateTo,
          session,
          milkType
        }
      },
      message: "Milk history retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching milk history:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});

// Get farmer's milk entries for today
export const getTodayMilkEntries = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  try {
    // Get today's milk entries for this farmer
    const milkEntries = await MilkEntry.find({
      farmer: farmerId,
      date: todayString
    })
    .populate('collectedBy', 'username uniqueId')
    .sort({ createdAt: -1 });

    // Calculate summary
    const summary = milkEntries.reduce((acc, entry) => {
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
      data: {
        entries: milkEntries,
        summary,
        date: todayString
      },
      message: "Today's milk entries retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching today's milk entries:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});

// Get dairy time info for farmers
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

// Get farmer's animals
export const getAnimals = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;

  const animals = await Animal.find({ 
    farmer: farmerId,
    isActive: true 
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: animals,
    message: "Animals retrieved successfully"
  });
});

// Add new animal
export const addAnimal = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;
  const {
    tagNumber,
    animalType,
    breed,
    age,
    weight,
    milkCapacity,
    healthStatus,
    purchaseDate,
    purchasePrice,
    lastVaccination,
    notes
  } = req.body;

  // Validation
  if (!tagNumber || !animalType || !breed || !age || !weight || !milkCapacity || !purchaseDate || !purchasePrice) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "All required fields must be provided"
      }
    });
  }

  // Check if tag number already exists
  const existingAnimal = await Animal.findOne({ tagNumber });
  if (existingAnimal) {
    return res.status(400).json({
      success: false,
      error: {
        code: "TAG_EXISTS",
        message: "An animal with this tag number already exists"
      }
    });
  }

  // Create new animal
  const animal = new Animal({
    farmer: farmerId,
    tagNumber,
    animalType,
    breed,
    age: Number(age),
    weight: Number(weight),
    milkCapacity: Number(milkCapacity),
    healthStatus: healthStatus || "healthy",
    purchaseDate: new Date(purchaseDate),
    purchasePrice: Number(purchasePrice),
    lastVaccination: lastVaccination ? new Date(lastVaccination) : undefined,
    notes
  });

  await animal.save();

  res.status(201).json({
    success: true,
    data: animal,
    message: "Animal added successfully"
  });
});

// Update animal
export const updateAnimal = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;
  const { animalId } = req.params;
  const updateData = req.body;

  // Find animal and verify ownership
  const animal = await Animal.findOne({ 
    _id: animalId, 
    farmer: farmerId,
    isActive: true 
  });

  if (!animal) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ANIMAL_NOT_FOUND",
        message: "Animal not found"
      }
    });
  }

  // Check if tag number is being changed and if it already exists
  if (updateData.tagNumber && updateData.tagNumber !== animal.tagNumber) {
    const existingAnimal = await Animal.findOne({ 
      tagNumber: updateData.tagNumber,
      _id: { $ne: animalId }
    });
    if (existingAnimal) {
      return res.status(400).json({
        success: false,
        error: {
          code: "TAG_EXISTS",
          message: "An animal with this tag number already exists"
        }
      });
    }
  }

  // Update animal
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined && updateData[key] !== '') {
      if (['age', 'weight', 'milkCapacity', 'purchasePrice'].includes(key)) {
        animal[key] = Number(updateData[key]);
      } else if (['purchaseDate', 'lastVaccination'].includes(key)) {
        animal[key] = new Date(updateData[key]);
      } else {
        animal[key] = updateData[key];
      }
    }
  });

  await animal.save();

  res.json({
    success: true,
    data: animal,
    message: "Animal updated successfully"
  });
});

// Delete animal (soft delete)
export const deleteAnimal = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;
  const { animalId } = req.params;

  // Find animal and verify ownership
  const animal = await Animal.findOne({ 
    _id: animalId, 
    farmer: farmerId,
    isActive: true 
  });

  if (!animal) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ANIMAL_NOT_FOUND",
        message: "Animal not found"
      }
    });
  }

  // Soft delete
  animal.isActive = false;
  await animal.save();

  res.json({
    success: true,
    message: "Animal deleted successfully"
  });
});

// Get animal statistics
export const getAnimalStats = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;

  const stats = await Animal.aggregate([
    {
      $match: { 
        farmer: farmerId, 
        isActive: true 
      }
    },
    {
      $group: {
        _id: null,
        totalAnimals: { $sum: 1 },
        totalCows: { 
          $sum: { $cond: [{ $eq: ["$animalType", "cow"] }, 1, 0] }
        },
        totalBuffaloes: { 
          $sum: { $cond: [{ $eq: ["$animalType", "buffalo"] }, 1, 0] }
        },
        totalMilkCapacity: { $sum: "$milkCapacity" },
        averageAge: { $avg: "$age" },
        totalInvestment: { $sum: "$purchasePrice" },
        healthyAnimals: {
          $sum: { $cond: [{ $eq: ["$healthStatus", "healthy"] }, 1, 0] }
        },
        sickAnimals: {
          $sum: { $cond: [{ $eq: ["$healthStatus", "sick"] }, 1, 0] }
        },
        pregnantAnimals: {
          $sum: { $cond: [{ $eq: ["$healthStatus", "pregnant"] }, 1, 0] }
        },
        dryAnimals: {
          $sum: { $cond: [{ $eq: ["$healthStatus", "dry"] }, 1, 0] }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalAnimals: 0,
    totalCows: 0,
    totalBuffaloes: 0,
    totalMilkCapacity: 0,
    averageAge: 0,
    totalInvestment: 0,
    healthyAnimals: 0,
    sickAnimals: 0,
    pregnantAnimals: 0,
    dryAnimals: 0
  };

  res.json({
    success: true,
    data: result,
    message: "Animal statistics retrieved successfully"
  });
});

// Get farmer's loan history
export const getLoanHistory = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;
  const { 
    dateFrom, 
    dateTo, 
    status, 
    page = 1, 
    limit = 20 
  } = req.query;

  try {
    // Build filter object
    let filter = { farmer: farmerId };

    // Date range filter
    if (dateFrom && dateTo) {
      filter.requestDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (dateFrom) {
      filter.requestDate = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.requestDate = { $lte: new Date(dateTo) };
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get loans with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const loans = await Loan.find(filter)
      .populate('approvedBy', 'username uniqueId')
      .populate('clearedBy', 'username uniqueId')
      .populate('closedBy', 'username uniqueId')
      .populate('history.processedBy', 'username uniqueId')
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalLoans = await Loan.countDocuments(filter);

    // Calculate summary for the filtered results
    const summary = loans.reduce((acc, loan) => {
      acc.totalRequested += loan.requestedAmount || 0;
      acc.totalApproved += loan.approvedAmount || 0;
      acc.totalReturned += loan.totalReturned || 0;
      acc.totalDue += loan.totalDue || 0;
      acc.loanCount += 1;
      
      // Count by status
      acc.statusCounts[loan.status] = (acc.statusCounts[loan.status] || 0) + 1;
      
      return acc;
    }, {
      totalRequested: 0,
      totalApproved: 0,
      totalReturned: 0,
      totalDue: 0,
      loanCount: 0,
      statusCounts: {}
    });

    res.json({
      success: true,
      data: {
        loans,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalLoans,
          pages: Math.ceil(totalLoans / parseInt(limit))
        },
        filters: {
          dateFrom,
          dateTo,
          status
        }
      },
      message: "Loan history retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching loan history:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});

// Get farmer's feed history
export const getFeedHistory = asyncHandler(async (req, res) => {
  const farmerId = req.user.id;
  const { 
    dateFrom, 
    dateTo, 
    feedType, 
    status, 
    page = 1, 
    limit = 20 
  } = req.query;

  try {
    // Build filter object
    let filter = { farmer: farmerId };

    // Date range filter
    if (dateFrom && dateTo) {
      filter.requestDate = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
    } else if (dateFrom) {
      filter.requestDate = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.requestDate = { $lte: new Date(dateTo) };
    }

    // Feed type filter
    if (feedType && feedType !== 'all') {
      filter.feedType = feedType;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Get feeds with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const feeds = await Feed.find(filter)
      .populate('managedBy', 'username uniqueId')
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalFeeds = await Feed.countDocuments(filter);

    // Calculate summary for the filtered results
    const summary = feeds.reduce((acc, feed) => {
      acc.totalQuantity += feed.quantity || 0;
      acc.totalAmount += feed.totalAmount || 0;
      acc.totalPaid += feed.paidAmount || 0;
      acc.totalDue += feed.remainingAmount || 0;
      acc.feedCount += 1;
      
      // Count by status
      acc.statusCounts[feed.status] = (acc.statusCounts[feed.status] || 0) + 1;
      
      // Count by feed type
      acc.feedTypeCounts[feed.feedType] = (acc.feedTypeCounts[feed.feedType] || 0) + 1;
      
      return acc;
    }, {
      totalQuantity: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      feedCount: 0,
      statusCounts: {},
      feedTypeCounts: {}
    });

    res.json({
      success: true,
      data: {
        feeds,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalFeeds,
          pages: Math.ceil(totalFeeds / parseInt(limit))
        },
        filters: {
          dateFrom,
          dateTo,
          feedType,
          status
        }
      },
      message: "Feed history retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching feed history:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});