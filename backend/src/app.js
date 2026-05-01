import express from "express";
import cors from "cors";
import morgan from "morgan";

/* Routes */
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import farmerRoutes from "./routes/farmer.routes.js";
import buyerRoutes from "./routes/buyer.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import employeeAdminRoutes from "./routes/employee.admin.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import loanfeedRoutes from "./routes/loanfeed.routes.js";
import farmerLoanRoutes from "./routes/farmer.loan.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import reportRoutes from "./routes/report.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import transportRoutes from "./routes/transport.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import dairyRoutes from "./routes/dairy.routes.js";
import publicRoutes from "./routes/public.routes.js";
import employeeSalaryRoutes from "./routes/employeeSalary.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import deliveryNotificationRoutes from "./routes/deliveryNotification.routes.js";
import earningsRoutes from "./routes/earnings.routes.js";
import otpRoutes from "./routes/otp.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import milkQualityRatingRoutes from "./routes/milkQualityRating.routes.js";
import revenueAnalyticsRoutes from "./routes/revenueAnalytics.routes.js";
import otherExpenseRoutes from "./routes/otherExpense.routes.js";

/* Middlewares */
import { errorHandler, notFound } from "./middlewares/error.middleware.js";

const app = express();

/* ================================
   GLOBAL MIDDLEWARES
================================ */
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* ================================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dairy Management Backend API is running",
    version: "milk-deduction-v5",
    timestamp: new Date().toISOString()
  });
});

/* ================================
   API ROUTES
================================ */
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/employees", employeeAdminRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/farmer/loans", farmerLoanRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/loanfeed", loanfeedRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dairy", dairyRoutes);
app.use("/api/employee-salary", employeeSalaryRoutes);
app.use("/api", ratingRoutes);
app.use("/api/delivery-notifications", deliveryNotificationRoutes);
app.use("/api", earningsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", milkQualityRatingRoutes);
app.use("/api/admin/revenue-analytics", revenueAnalyticsRoutes);
app.use("/api/admin/other-expenses", otherExpenseRoutes);

/* ================================
   404 HANDLER
================================ */
app.use(notFound);

/* ================================
   GLOBAL ERROR HANDLER
================================ */
app.use(errorHandler);

export default app;
