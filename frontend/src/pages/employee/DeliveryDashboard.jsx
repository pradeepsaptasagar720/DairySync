import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

import DeliveryOverview from "./sections/DeliveryOverview";
import DeliveryRequests from "./DeliveryRequests";
import CompletedDeliveries from "./CompletedDeliveries";
import DeliveryStats from "./sections/DeliveryStats";
import DeliveryHistory from "./sections/DeliveryHistory";
import EarningsDashboard from "./EarningsDashboard";

export default function DeliveryDashboard() {
  return (
    <DashboardLayout role="delivery">
      <Routes>
        <Route index element={<DeliveryOverview />} />
        <Route path="delivery-requests" element={<DeliveryRequests />} />
        <Route path="completed-deliveries" element={<CompletedDeliveries />} />
        <Route path="earnings" element={<EarningsDashboard />} />
        <Route path="stats" element={<DeliveryStats />} />
        <Route path="history" element={<DeliveryHistory />} />
      </Routes>
    </DashboardLayout>
  );
}