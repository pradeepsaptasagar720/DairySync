import { useAuth } from "../../hooks/useAuth";

import AdminSidebar from "./AdminSidebar";
import FarmerSidebar from "./FarmerSidebar";
import BuyerSidebar from "./BuyerSidebar";
import EmployeeSidebar from "./EmployeeSidebar";

export default function RoleSidebar() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "admin":
      return <AdminSidebar />;
    case "farmer":
      return <FarmerSidebar />;
    case "buyer":
      return <BuyerSidebar />;
    case "employee":
      return <EmployeeSidebar />;
    default:
      return null;
  }
}
