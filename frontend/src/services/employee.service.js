import api from "./api";

export const EmployeeService = {
  getDashboard() {
    return api.get("/api/employee/dashboard");
  },

  getFarmers(params = {}) {
    return api.get("/api/employee/farmers", { params });
  },

  getBuyers(params = {}) {
    return api.get("/api/employee/buyers", { params });
  },

  // New: Get all users data (farmers and buyers)
  getAllUsersData(params = {}) {
    return api.get("/api/employee/all-users", { params });
  },

  recordMilkCollection(data) {
    return api.post("/api/employee/milk-collection", data);
  },

  getBillingTasks() {
    return api.get("/api/employee/billing");
  },

  confirmCOD(paymentId) {
    return api.post(`/api/employee/confirm-cod/${paymentId}`);
  },

  getDeliveries() {
    return api.get("/api/employee/deliveries");
  },

  addProduct(data) {
    return api.post("/api/employee/products", data);
  },

  // Additional methods for comprehensive employee functionality
  getMilkEntries(params = {}) {
    return api.get("/api/employee/milk-entries", { params });
  },

  recordMilk(data) {
    return api.post("/api/employee/milk-entry", data);
  },

  updateMilkEntry(id, data) {
    return api.put(`/api/employee/milk-entry/${id}`, data);
  },

  getAnimalsInfo() {
    return api.get("/api/employee/animals");
  },

  generateReports(params = {}) {
    return api.get("/api/employee/reports", { params });
  },

  getFarmerPayments() {
    return api.get("/api/employee/payments/farmers");
  },

  getBuyerPayments() {
    return api.get("/api/employee/payments/buyers");
  },

  getDeliveryRequests(params = {}) {
    return api.get("/api/employee/delivery-requests", { params });
  },

  updateDeliveryStatus(id, data) {
    return api.put(`/api/employee/delivery-requests/${id}`, data);
  },

  sendManualNotification(data) {
    return api.post("/api/employee/notifications/send", data);
  },

  getNotifications(params = {}) {
    return api.get("/api/employee/notifications", { params });
  },

  getDairyTime() {
    return api.get("/api/employee/dairy-time");
  },

  updateDairyTime(data) {
    return api.put("/api/employee/dairy-time", data);
  },

  // Farmer Bill Generation and Payment Processing
  generateFarmerBill(params = {}) {
    return api.get("/api/employee/farmer-bill", { params });
  },

  processPayment(data) {
    return api.post("/api/employee/process-payment", data);
  },

  getPaymentHistory(params = {}) {
    return api.get("/api/employee/payment-history", { params });
  },

  // Pending Payment Management
  updatePendingPayment(paymentId, data) {
    return api.put(`/api/employee/pending-payment/${paymentId}`, data);
  },

  completePendingPayment(paymentId, data) {
    return api.post(`/api/employee/complete-pending-payment/${paymentId}`, data);
  },

  getPendingPayments(params = {}) {
    return api.get("/api/employee/pending-payments", { params });
  },
};
