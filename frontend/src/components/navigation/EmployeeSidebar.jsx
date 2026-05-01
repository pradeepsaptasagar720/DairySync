import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const allLinks = [
  { to: "/employee", label: "Dashboard", icon: "📊", roles: ["milk_collector", "delivery_boy", "loan_feed_manager"] },
  { to: "/employee/milk-collection", label: "Milk Collection", icon: "🥛", roles: ["milk_collector"] },
  { to: "/employee/transport-milk", label: "Transport Milk", icon: "🚚", roles: ["milk_collector"] },
  { to: "/employee/animal-info", label: "See Animal Info", icon: "🐄", roles: ["milk_collector"] },
  { to: "/employee/manage-farmers", label: "View Farmers", icon: "👨‍🌾", roles: ["milk_collector"] },
  { to: "/employee/manage-buyers", label: "View Buyers", icon: "🛍️", roles: ["milk_collector"] },
  { to: "/employee/dairy-time", label: "Custom Updates", icon: "🔧", roles: ["milk_collector"] },
  { to: "/delivery/delivery-requests", label: "Delivery Requests", icon: "🚚", roles: ["delivery_boy"] },
  { to: "/delivery/completed-deliveries", label: "Completed Deliveries", icon: "✅", roles: ["delivery_boy"] },
  { to: "/delivery/earnings", label: "My Earnings", icon: "💰", roles: ["delivery_boy"] },
  { to: "/employee/payment", label: "Payment", icon: "💳", roles: ["milk_collector"] },
  { to: "/employee/payment-history", label: "Payment History", icon: "📜", roles: ["milk_collector"] },
];

export default function EmployeeSidebar() {
  const { user } = useAuth();
  
  // Filter links based on user's employee role
  const userRole = user?.employeeRole;
  const filteredLinks = allLinks.filter(link => 
    link.roles.includes(userRole)
  );

  return (
    <nav className="p-4 space-y-1">
      {filteredLinks.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/employee"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
             ${isActive
               ? "bg-orange-600 text-white shadow-lg"
               : "text-slate-300 hover:bg-slate-800 hover:text-white"}`
          }
        >
          <span className="text-lg">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
