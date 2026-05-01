import api from "./api";

export const AdminService = {
  getDashboardStats() {
    return api.get("/api/admin/dashboard");
  },

  getFarmers() {
    return api.get("/api/admin/farmers");
  },

  getBuyers() {
    return api.get("/api/admin/buyers");
  },

  getEmployees() {
    return api.get("/api/admin/employees");
  },

  getUsersByRole(role, params = {}) {
    return api.get(`/api/admin/users/${role}`, { params });
  },

  getPendingApprovals() {
    return api.get("/api/admin/approvals");
  },

  // Reports endpoints
  getTodayReports() {
    return api.get("/api/admin/today-reports");
  },

  getYesterdayReports() {
    return api.get("/api/admin/yesterday-reports");
  },

  getCurrentMonthReports() {
    return api.get("/api/admin/current-month-reports");
  },

  getPreviousMonthReports() {
    return api.get("/api/admin/previous-month-reports");
  },

  getCustomDateReports(dateRange) {
    return api.get("/api/admin/custom-date-reports", { 
      params: { 
        startDate: dateRange.startDate, 
        endDate: dateRange.endDate 
      } 
    });
  },

  getLandingStats() {
    return api.get("/api/admin/landing-stats");
  },

  // Legacy: Get all users with filtering and pagination
  getAllUsers(params = {}) {
    return api.get("/api/admin/all-users", { params });
  },

  // New: Get comprehensive user data with role-specific information
  getComprehensiveUserData(params = {}) {
    return api.get("/api/admin/comprehensive-users", { params });
  },

  // New: Advanced search with comprehensive filtering
  advancedUserSearch(params = {}) {
    return api.get("/api/admin/advanced-search", { params });
  },

  // New: Get search suggestions for autocomplete
  getSearchSuggestions(params = {}) {
    return api.get("/api/admin/search-suggestions", { params });
  },

  // New: Get search analytics and statistics
  getSearchAnalytics(params = {}) {
    return api.get("/api/admin/search-analytics", { params });
  },

  // New: Reset search filters
  resetSearchFilters() {
    return api.post("/api/admin/reset-search-filters");
  },

  // New: Get detailed user profile with activities and transactions
  getUserProfile(userId, params = {}) {
    return api.get(`/api/admin/user-profile/${userId}`, { params });
  },

  // New: Get user activities timeline and analytics
  getUserActivities(userId, params = {}) {
    return api.get(`/api/admin/user-activities/${userId}`, { params });
  },

  // New: Assign unique IDs to existing users
  assignUniqueIds() {
    return api.post("/api/admin/assign-unique-ids");
  },

  approveUser(userId) {
    return api.post(`/api/admin/approve/${userId}`);
  },

  rejectUser(userId) {
    return api.delete(`/api/admin/reject/${userId}`);
  },

  updateMilkRate(rate) {
    return api.post("/api/admin/milk-rate", { rate });
  },

  updateDairyInfo(info) {
    return api.post("/api/admin/dairy-info", info);
  },

  getDairyInfo() {
    return api.get("/api/admin/dairy-info");
  },

  getSellingRates() {
    return api.get("/api/admin/selling-rates");
  },

  updateSellingRates(rates) {
    return api.post("/api/admin/selling-rates", rates);
  },

  // Farmer payments for admin view
  getFarmerPayments(params = {}) {
    return api.get("/api/admin/farmer-payments", { params });
  },
};

export const adminService = AdminService;
