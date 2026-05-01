import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

/* Overview */
import FarmerOverview from "./sections/FarmerOverview";

/* Sub Pages */
import AnimalInfo from "./AnimalInfo";
import TodayMilkStatus from "./MilkEntry";
import BookFeed from "./BookFeed";
import LoanRequest from "./LoanRequest";
import MilkHistory from "./Bills";
import Payments from "./Payments";
import DeliveryStatus from "./DeliveryStatus";
import Reports from "./Reports";
import Settings from "./Settings";

export default function FarmerDashboard() {
  return (
    <DashboardLayout role="farmer">
      <Routes>
        {/* MAIN DASHBOARD */}
        <Route index element={<FarmerOverview />} />

        {/* SUB PAGES */}
        <Route path="animals" element={<AnimalInfo />} />
        <Route path="milk-entry" element={<TodayMilkStatus />} />
        <Route path="book-feed" element={<BookFeed />} />
        <Route path="request-loan" element={<LoanRequest />} />
        <Route path="bills" element={<MilkHistory />} />
        <Route path="payments" element={<Payments />} />
        <Route path="delivery-status" element={<DeliveryStatus />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </DashboardLayout>
  );
}
