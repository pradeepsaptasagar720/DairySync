import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

import Overview from "./Overview";
import DairyInfo from "./DairyInfo";
import Approvals from "./Approvals";
import TransportMilk from "./TransportMilk";
import MilkRateChart from "./MilkRateChart";
import MilkSellingRate from "./MilkSellingRate";
import Reports from "./Reports";
import EmployeeHiring from "./EmployeeHiring";
import Payments from "./Payments";
import FarmerPayments from "./FarmerPayments";
import BuyerPayments from "./BuyerPayments";
import OtherPayments from "./OtherPayments";
import FeedPayments from "./FeedPayments";
import EmployeeSalaryManagement from "./EmployeeSalaryManagement";
import EmployeeSalaryProfile from "./EmployeeSalaryProfile";
import MilkQualityRatings from "./MilkQualityRatings";

export default function AdminDashboard() {
  return (
    <DashboardLayout role="admin">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="dairy-info" element={<DairyInfo />} />
        <Route path="employee-hiring" element={<EmployeeHiring />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="transport-milk" element={<TransportMilk />} />
        <Route path="milk-rate" element={<MilkRateChart />} />
        <Route path="milk-selling-rate" element={<MilkSellingRate />} />
        <Route path="reports" element={<Reports />} />
        <Route path="payments" element={<Payments />} />
        <Route path="payments/farmers" element={<FarmerPayments />} />
        <Route path="payments/buyers" element={<BuyerPayments />} />
        <Route path="payments/employee-salary" element={<EmployeeSalaryManagement />} />
        <Route path="employee/:employeeId/salary" element={<EmployeeSalaryProfile />} />
        <Route path="payments/feed" element={<FeedPayments />} />
        <Route path="payments/others" element={<OtherPayments />} />
        <Route path="milk-quality-ratings" element={<MilkQualityRatings />} />
      </Routes>
    </DashboardLayout>
  );
}
