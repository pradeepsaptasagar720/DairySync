import Payment from "../models/Payment.model.js";

/**
 * Create payment record
 */
export async function createPaymentRecord(data) {
  return Payment.create(data);
}

/**
 * Confirm COD payment
 */
export async function confirmCODPayment(paymentId) {
  return Payment.findByIdAndUpdate(
    paymentId,
    { status: "Success" },
    { new: true }
  );
}
