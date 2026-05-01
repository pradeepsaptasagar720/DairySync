import Loan from "../models/Loan.model.js";
import User from "../models/User.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

// Get farmer loan summary
export const getFarmerLoanSummary = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;

  // Verify farmer exists
  const farmer = await User.findById(farmerId);
  if (!farmer || farmer.role !== "farmer") {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found"
      }
    });
  }

  // Get all loans for this farmer
  const loans = await Loan.find({ farmer: farmerId })
    .populate('approvedBy', 'username')
    .populate('clearedBy', 'username')
    .sort({ requestDate: -1 });

  // Calculate summary statistics
  const summary = {
    totalLoans: loans.length,
    activeLoans: loans.filter(loan => ['approved', 'partially_paid'].includes(loan.status)).length,
    totalApproved: loans.reduce((sum, loan) => sum + (loan.approvedAmount || 0), 0),
    totalRepaid: loans.reduce((sum, loan) => sum + loan.totalReturned, 0),
    currentTotalDue: loans.reduce((sum, loan) => sum + loan.totalDue, 0),
    loans: loans.map(loan => ({
      id: loan._id,
      requestedAmount: loan.requestedAmount,
      loanAmount: loan.approvedAmount || loan.requestedAmount,
      loanPurpose: loan.purpose,
      status: loan.status,
      requestDate: loan.requestDate,
      approvalDate: loan.approvalDate,
      totalReturned: loan.totalReturned,
      totalDue: loan.totalDue,
      description: loan.notes,
      rejectionReason: loan.rejectionReason
    }))
  };

  res.json({
    success: true,
    data: summary,
    message: "Farmer loan summary retrieved successfully"
  });
});

// Create loan request (farmer-side)
export const createLoanRequest = asyncHandler(async (req, res) => {
  const { farmerId, farmerName, farmerPhone, loanAmount, loanPurpose, description } = req.body;

  // Validate required fields
  if (!farmerId || !loanAmount || !loanPurpose) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_REQUIRED_FIELDS",
        message: "Farmer ID, loan amount, and loan purpose are required"
      }
    });
  }

  // Validate loan amount
  if (loanAmount < 1000 || loanAmount > 500000) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_LOAN_AMOUNT",
        message: "Loan amount must be between ₹1,000 and ₹5,00,000"
      }
    });
  }

  // Verify farmer exists
  const farmer = await User.findById(farmerId);
  if (!farmer || farmer.role !== "farmer") {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found"
      }
    });
  }

  // Check for existing pending loan requests
  const existingPendingLoan = await Loan.findOne({
    farmer: farmerId,
    status: 'requested'
  });

  if (existingPendingLoan) {
    return res.status(400).json({
      success: false,
      error: {
        code: "PENDING_LOAN_EXISTS",
        message: "You already have a pending loan request. Please wait for approval or contact support."
      }
    });
  }

  // Create loan request
  const loanRequest = await Loan.create({
    farmer: farmerId,
    requestedAmount: loanAmount,
    purpose: loanPurpose,
    notes: description,
    status: 'requested',
    requestDate: new Date()
  });

  // Populate farmer details for response
  await loanRequest.populate('farmer', 'username mobile uniqueId');

  res.status(201).json({
    success: true,
    data: loanRequest,
    message: "Loan request submitted successfully"
  });
});

// Get farmer's loan history
export const getFarmerLoanHistory = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Verify farmer exists
  const farmer = await User.findById(farmerId);
  if (!farmer || farmer.role !== "farmer") {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found"
      }
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const loans = await Loan.find({ farmer: farmerId })
    .populate('approvedBy', 'username')
    .populate('clearedBy', 'username')
    .populate('history.processedBy', 'username')
    .sort({ requestDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Loan.countDocuments({ farmer: farmerId });

  // Flatten all history entries with loan context
  const allHistory = [];
  loans.forEach(loan => {
    loan.history.forEach(historyEntry => {
      allHistory.push({
        ...historyEntry.toObject(),
        loanId: loan._id,
        loanPurpose: loan.purpose,
        requestedAmount: loan.requestedAmount,
        approvedAmount: loan.approvedAmount
      });
    });
  });

  // Sort by date descending
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    success: true,
    data: {
      farmer,
      loans,
      history: allHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    },
    message: "Farmer loan history retrieved successfully"
  });
});

// Get farmer's active loans
export const getFarmerActiveLoans = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;

  // Verify farmer exists
  const farmer = await User.findById(farmerId);
  if (!farmer || farmer.role !== "farmer") {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found"
      }
    });
  }

  const activeLoans = await Loan.find({
    farmer: farmerId,
    status: { $in: ['requested', 'approved', 'partially_paid'] }
  })
    .populate('approvedBy', 'username')
    .sort({ requestDate: -1 });

  res.json({
    success: true,
    data: {
      farmer,
      activeLoans,
      count: activeLoans.length
    },
    message: "Farmer active loans retrieved successfully"
  });
});