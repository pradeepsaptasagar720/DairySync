import { NavLink } from "react-router-dom";
import { Home, Package, History, BarChart3 } from "lucide-react";

const links = [
  { to: "/buyer", label: "Dashboard", icon: Home },
  { to: "/buyer/order-status", label: "Order Status", icon: Package },
  { to: "/buyer/order-history", label: "Order History", icon: History },
  { to: "/buyer/purchase-history", label: "Purchase Analytics", icon: BarChart3 },
];

export default function BuyerSidebar() {
  return (
    <nav className="p-4 space-y-3">
      {links.map((link) => {
        const IconComponent = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/buyer"}
            className={({ isActive }) =>
              `flex items-center gap-4 px-5 py-4 rounded-xl text-base font-bold transition-all duration-300 shadow-md ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl transform scale-105 border-2 border-blue-400"
                  : "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-lg hover:transform hover:scale-102 border-2 border-gray-200 hover:border-blue-400"
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
