import api from "./api";

export const FarmerService = {
  getDashboard() {
    return api.get("/api/farmer/dashboard");
  },

  // Animal Management
  getAnimals() {
    return api.get("/api/farmer/animals");
  },

  addAnimal(data) {
    return api.post("/api/farmer/animals", data);
  },

  updateAnimal(animalId, data) {
    return api.put(`/api/farmer/animals/${animalId}`, data);
  },

  deleteAnimal(animalId) {
    return api.delete(`/api/farmer/animals/${animalId}`);
  },

  getAnimalStats() {
    return api.get("/api/farmer/animals/stats");
  },

  saveAnimalInfo(data) {
    return api.post("/api/farmer/animal-info", data);
  },

  addMilkEntry(data) {
    return api.post("/api/farmer/milk-entry", data);
  },

  getBills() {
    return api.get("/api/farmer/bills");
  },

  getPayments() {
    return api.get("/api/farmer/payments");
  },

  getDeliveryStatus() {
    return api.get("/api/farmer/delivery-status");
  },

  downloadReport(type) {
    return api.get(`/api/farmer/reports?type=${type}`, {
      responseType: "blob",
    });
  },

  // Milk History
  getTodayMilkEntries() {
    return api.get("/api/farmer/today-milk-entries");
  },

  getMilkHistory(params) {
    return api.get(`/api/farmer/milk-history?${params}`);
  },

  // Loan and Feed History
  getLoanHistory(params) {
    return api.get(`/api/farmer/loan-history?${params}`);
  },

  getFeedHistory(params) {
    return api.get(`/api/farmer/feed-history?${params}`);
  },
};

export const farmerService = FarmerService;
