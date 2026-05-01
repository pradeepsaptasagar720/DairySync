import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

import BuyerOverview from "./sections/BuyerOverview";
import Orders from "./Orders";
import OrderStatus from "./OrderStatus";
import OrderHistory from "./OrderHistory";
import PurchaseHistory from "./PurchaseHistory";

export default function BuyerDashboard() {
  return (
    <DashboardLayout role="buyer">
      <Routes>
        <Route index element={<BuyerOverview />} />
        <Route path="orders" element={<Orders />} />
        <Route path="order-status" element={<OrderStatus />} />
        <Route path="order-history" element={<OrderHistory />} />
        <Route path="purchase-history" element={<PurchaseHistory />} />
      </Routes>
    </DashboardLayout>
  );
}
