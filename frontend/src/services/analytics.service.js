import api from "./api";

export const AnalyticsService = {
  adminAnalytics() {
    return api.get("/api/analytics/admin");
  },

  farmerAnalytics() {
    return api.get("/api/analytics/farmer");
  },

  buyerAnalytics() {
    return api.get("/api/analytics/buyer");
  },

  employeeAnalytics() {
    return api.get("/api/analytics/employee");
  },
};
