import Delivery from "../models/Delivery.model.js";

/**
 * Create delivery request
 */
export async function createDelivery(buyerId, data) {
  return Delivery.create({
    buyer: buyerId,
    quantity: data.quantity,
    address: data.address,
    deliveryDate: data.deliveryDate,
    frequency: data.frequency,
  });
}

/**
 * Update delivery status
 */
export async function updateDeliveryStatus(id, status, employeeId) {
  return Delivery.findByIdAndUpdate(
    id,
    { status, handledBy: employeeId },
    { new: true }
  );
}
