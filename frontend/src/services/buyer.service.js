import api from "./api";

export const BuyerService = {
  getDashboard() {
    return api.get("/api/buyer/dashboard");
  },

  // Order management
  placeOrder(orderData) {
    return api.post("/api/buyer/place-order", orderData);
  },

  getOrders() {
    return api.get("/api/buyer/orders");
  },

  cancelOrder(orderId) {
    return api.delete(`/api/buyer/orders/${orderId}`);
  },

  // Purchase history
  getOrderHistory() {
    return api.get("/api/buyer/order-history");
  },

  getPurchaseHistory() {
    return api.get("/api/buyer/purchase-history");
  },

  // Legacy endpoints (keeping for backward compatibility)
  getMilkBills() {
    return api.get("/api/buyer/bills");
  },

  getPayments() {
    return api.get("/api/buyer/payments");
  },

  requestDelivery(data) {
    return api.post("/api/buyer/delivery-request", data);
  },

  trackDelivery() {
    return api.get("/api/buyer/delivery-tracking");
  },

  downloadReport(type) {
    return api.get(`/api/buyer/reports?type=${type}`, {
      responseType: "blob",
    });
  },
};
