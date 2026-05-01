export const LOAN_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PARTIALLY_PAID: 'partially_paid',
  FULLY_CLEARED: 'fully_cleared',
  CLOSED: 'closed'
};

export const LOAN_PURPOSE_LABELS = {
  cattle_purchase: 'Cattle Purchase',
  feed_purchase: 'Feed Purchase',
  equipment_purchase: 'Equipment Purchase',
  farm_expansion: 'Farm Expansion',
  medical_expenses: 'Medical Expenses',
  infrastructure: 'Infrastructure Development',
  working_capital: 'Working Capital',
  emergency: 'Emergency',
  other: 'Other'
};

export const PAYMENT_MODES = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  UPI: 'upi',
  OTHER: 'other'
};

export const PAYMENT_MODE_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  other: 'Other'
};

export const TRANSACTION_TYPES = {
  LOAN_APPROVED: 'loan_approved',
  PARTIAL_PAYMENT: 'partial_payment',
  FULL_PAYMENT: 'full_payment',
  LOAN_CLEARED: 'loan_cleared',
  LOAN_CLOSED: 'loan_closed'
};

export const TRANSACTION_TYPE_LABELS = {
  loan_approved: 'Loan Approved',
  partial_payment: 'Partial Payment',
  full_payment: 'Full Payment',
  loan_cleared: 'Loan Cleared',
  loan_closed: 'Loan Closed'
};