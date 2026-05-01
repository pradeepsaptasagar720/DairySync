import { NavLink } from "react-router-dom";
import { Home, PawPrint, Eye, FileText, CreditCard, Truck, BarChart3, Settings, Package, DollarSign, History } from "lucide-react";

const links = [
  { to: "/farmer", label: "Dashboard", icon: Home },
  { to: "/farmer/animals", label: "Animal Info", icon: PawPrint },
  { to: "/farmer/milk-entry", label: "Today Milk Status", icon: Eye },
  { to: "/farmer/book-feed", label: "Book Feed", icon: Package },
  { to: "/farmer/request-loan", label: "Request Loan", icon: DollarSign },
  { to: "/farmer/bills", label: "Milk History", icon: History },
  { to: "/farmer/payments", label: "Payments", icon: CreditCard },
  { to: "/farmer/delivery-status", label: "Delivery Status", icon: Truck },
  { to: "/farmer/reports", label: "Reports", icon: BarChart3 },
  { to: "/farmer/settings", label: "Settings", icon: Settings },
];

export default function FarmerSidebar() {
  return (
    <nav className="p-4 space-y-3">
      {links.map((link) => {
        const IconComponent = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/farmer"}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-xl text-base font-bold transition-all duration-300 shadow-md ${
                isActive
                  ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl transform scale-105 border-2 border-green-400"
                  : "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white hover:shadow-lg hover:transform hover:scale-102 border-2 border-gray-200 hover:border-green-400"
              }`
            }
          >
            <IconComponent size={24} className="flex-shrink-0" />
            <span className="font-bold text-lg">{link.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
