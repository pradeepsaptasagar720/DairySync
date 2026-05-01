import { NavLink } from "react-router-dom";

const links = [
  { to: "/loanfeed", label: "Dashboard", icon: "📊" },
  { to: "/loanfeed/loan-management", label: "Loan Management", icon: "💰" },
  { to: "/loanfeed/feed-management", label: "Feed Management", icon: "🌾" },
  { to: "/loanfeed/feed-stock-management", label: "Feed Stock Management", icon: "📦" },
  { to: "/loanfeed/analytics", label: "Analytics & Reports", icon: "📈" },
  { to: "/loanfeed/history", label: "Transaction History", icon: "📋" },
];

export default function LoanFeedSidebar() {
  return (
    <nav className="p-4 space-y-1">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === "/loanfeed"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
             ${isActive
               ? "bg-purple-600 text-white shadow-lg"
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