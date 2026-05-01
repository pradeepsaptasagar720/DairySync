import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

import EmployeeOverview from "./sections/EmployeeOverview";
import MilkCollection from "./MilkCollection";
import TransportMilk from "./TransportMilk";
import AnimalInfo from "./AnimalInfo";
import ManageFarmers from "./ManageFarmers";
import ManageBuyers from "./ManageBuyers";
import TodaysDeliveries from "./TodaysDeliveries";
import SendNotifications from "./SendNotifications";
import Payment from "./Payment";
import PaymentHistory from "./PaymentHistory";
import PaymentStatus from "./PaymentStatus";

export default function EmployeeDashboard() {
  return (
    <DashboardLayout role="employee">
      <Routes>
        <Route index element={<EmployeeOverview />} />
        <Route path="milk-collection" element={<MilkCollection />} />
        <Route path="transport-milk" element={<TransportMilk />} />
        <Route path="animal-info" element={<AnimalInfo />} />
        <Route path="manage-farmers" element={<ManageFarmers />} />
        <Route path="manage-buyers" element={<ManageBuyers />} />
        <Route path="todays-deliveries" element={<TodaysDeliveries />} />
        <Route path="dairy-time" element={<SendNotifications />} />
        <Route path="payment" element={<Payment />} />
        <Route path="payment-history" element={<PaymentHistory />} />
        <Route path="payment-status" element={<PaymentStatus />} />
      </Routes>
    </DashboardLayout>
  );
}
