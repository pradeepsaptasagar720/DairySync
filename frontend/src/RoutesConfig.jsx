import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

/* Pages */
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import OtpVerify from "./pages/auth/OtpVerify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

/* Dashboards */
import AdminDashboard from "./pages/admin/AdminDashboard";
import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import DeliveryDashboard from "./pages/employee/DeliveryDashboard";
import LoanFeedDashboardLayout from "./pages/employee/LoanFeedDashboardLayout";

export default function RoutesConfig() {
  const { user } = useAuth();

  // Helper function to get employee dashboard based on role
  const getEmployeeDashboard = () => {
    if (user?.role !== "employee") {
      return <Navigate to="/login" replace />;
    }

    switch (user?.employeeRole) {
      case "delivery_boy":
        return <DeliveryDashboard />;
      case "loan_feed_manager":
        return <LoanFeedDashboardLayout />;
      case "milk_collector":
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/otp-verify" element={<OtpVerify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          user?.role === "admin"
            ? <AdminDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* Farmer Routes */}
      <Route
        path="/farmer/*"
        element={
          user?.role === "farmer"
            ? <FarmerDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* Buyer Routes */}
      <Route
        path="/buyer/*"
        element={
          user?.role === "buyer"
            ? <BuyerDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* Employee Routes - Role-based routing */}
      <Route
        path="/employee/*"
        element={getEmployeeDashboard()}
      />

      {/* Delivery Staff Routes */}
      <Route
        path="/delivery/*"
        element={
          user?.role === "employee" && user?.employeeRole === "delivery_boy"
            ? <DeliveryDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* Loan & Feed Manager Routes */}
      <Route
        path="/loanfeed/*"
        element={
          user?.role === "employee" && user?.employeeRole === "loan_feed_manager"
            ? <LoanFeedDashboardLayout />
            : <Navigate to="/login" replace />
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
