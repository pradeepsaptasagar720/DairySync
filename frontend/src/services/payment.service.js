import api from "./api";

export const PaymentService = {
  createOrder(data) {
    return api.post("/api/payment/create-order", data);
  },

  verifyPayment(data) {
    return api.post("/api/payment/verify", data);
  },

  getPaymentHistory() {
    return api.get("/api/payment/history");
  },
};
