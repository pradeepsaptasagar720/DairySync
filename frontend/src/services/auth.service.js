import api from "./api";

export const AuthService = {
  login(data) {
    return api.post("/api/auth/login", data);
  },

  register(data) {
    return api.post("/api/auth/register", data);
  },

  verifyOtp(data) {
    return api.post("/api/auth/verify-otp", data);
  },

  forgotPassword(mobile) {
    return api.post("/api/auth/forgot-password", { mobile });
  },

  resetPassword(data) {
    return api.post("/api/auth/reset-password", data);
  },

  logout() {
    localStorage.clear();
  },
};
