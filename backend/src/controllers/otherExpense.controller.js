import OtherExpense from '../models/OtherExpense.model.js';

/**
 * Get all other expenses with filters
 * GET /api/admin/other-expenses
 */
export const getAllOtherExpenses = async (req, res) => {
  try {
    const { 
      searchTerm, 
      category, 
      status, 
      vendor, 
      dateFrom, 
      dateTo 
    } = req.query;

    // Build query
    const query = {};

    // Search filter
    if (searchTerm) {
      query.$or = [
        { description: { $regex: searchTerm, $options: 'i' } },
        { vendor: { $regex: searchTerm, $options: 'i' } },
        { invoiceNumber: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Vendor filter
    if (vendor && vendor !== 'all') {
      query.vendor = vendor;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    // Fetch expenses
    const expenses = await OtherExpense.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: expenses,
      message: 'Other expenses fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching other expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch other expenses',
      error: error.message
    });
  }
};

/**
 * Create new other expense
 * POST /api/admin/other-expenses
 */
export const createOtherExpense = async (req, res) => {
  try {
    const {
      description,
      category,
      vendor,
      amount,
      dueDate,
      invoiceNumber,
      notes
    } = req.body;

    // Validation
    if (!description || !category || !vendor || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: description, category, vendor, amount, dueDate'
      });
    }

    // Check if due date is in the past (mark as overdue)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const status = due < today ? 'overdue' : 'pending';

    // Create expense
    const expense = new OtherExpense({
      description,
      category,
      vendor,
      amount: parseFloat(amount),
      dueDate,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      notes,
      status,
      paymentDate: null
    });

    await expense.save();

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

/**
 * Update other expense
 * PUT /api/admin/other-expenses/:id
 */
export const updateOtherExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      description,
      category,
      vendor,
      amount,
      dueDate,
      invoiceNumber,
      notes
    } = req.body;

    // Find expense
    const expense = await OtherExpense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if already paid
    if (expense.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid expense'
      });
    }

    // Update fields
    if (description) expense.description = description;
    if (category) expense.category = category;
    if (vendor) expense.vendor = vendor;
    if (amount) expense.amount = parseFloat(amount);
    if (dueDate) {
      expense.dueDate = dueDate;
      
      // Update status based on due date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      
      if (due < today && expense.status === 'pending') {
        expense.status = 'overdue';
      } else if (due >= today && expense.status === 'overdue') {
        expense.status = 'pending';
      }
    }
    if (invoiceNumber) expense.invoiceNumber = invoiceNumber;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();

    res.status(200).json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

/**
 * Delete other expense
 * DELETE /api/admin/other-expenses/:id
 */
export const deleteOtherExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete expense
    const expense = await OtherExpense.findByIdAndDelete(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

/**
 * Process payment for an expense
 * POST /api/admin/other-expenses/:id/pay
 */
export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod,
      paymentDate,
      transactionId,
      notes
    } = req.body;

    // Validation
    if (!paymentMethod || !paymentDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentMethod, paymentDate'
      });
    }

    // Find expense
    const expense = await OtherExpense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if already paid
    if (expense.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Expense already paid'
      });
    }

    // Update payment details
    expense.status = 'paid';
    expense.paymentDate = paymentDate;
    expense.paymentMethod = paymentMethod;
    if (transactionId) expense.transactionId = transactionId;
    if (notes) expense.notes = notes;

    await expense.save();

    res.status(200).json({
      success: true,
      data: expense,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};
