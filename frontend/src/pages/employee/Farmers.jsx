import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

import EmployeeOverview from "./sections/EmployeeOverview";
import Farmers from "./Farmers";
import Buyers from "./Buyers";
import MilkCollection from "./MilkCollection";
import Billing from "./Billing";
import Deliveries from "./Deliveries";
import ProductManagement from "./ProductManagement";
import Settings from "./Settings";

export default function EmployeeDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<EmployeeOverview />} />
        <Route path="farmers" element={<Farmers />} />
        <Route path="buyers" element={<Buyers />} />
        <Route path="milk-collection" element={<MilkCollection />} />
        <Route path="billing" element={<Billing />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </DashboardLayout>
  );
}
