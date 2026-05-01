// src/components/navigation/AdminSidebar.jsx
import { NavLink } from "react-router-dom";

const linkClass = "block px-3 py-2 rounded hover:bg-slate-800";

export default function AdminSidebar() {
  return (
    <nav className="p-4 space-y-6">
      <div>
        <p className="text-slate-400 text-xs mb-2">Dashboard</p>
        <NavLink to="/admin" end className={linkClass}>
          Overview
        </NavLink>
        <NavLink to="/admin/dairy-info" className={linkClass}>
          Dairy Info
        </NavLink>
      </div>

      <div>
        <p className="text-slate-400 text-xs mb-2">Management</p>
        <NavLink to="/admin/employee-hiring" className={linkClass}>
          Employee Hiring
        </NavLink>
        <NavLink to="/admin/transport-milk" className={linkClass}>
          Transport Milk
        </NavLink>
      </div>

      <div>
        <p className="text-slate-400 text-xs mb-2">Business</p>
        <NavLink to="/admin/milk-rate" className={linkClass}>
          Rate Charts
        </NavLink>
        <NavLink to="/admin/milk-selling-rate" className={linkClass}>
          Milk Selling Rate
        </NavLink>
        <NavLink to="/admin/payments" className={linkClass}>
          Payments
        </NavLink>
      </div>

      <div>
        <p className="text-slate-400 text-xs mb-2">Reports & Control</p>
        <NavLink to="/admin/reports" className={linkClass}>
          Reports
        </NavLink>
        <NavLink to="/admin/approvals" className={linkClass}>
          Approvals
        </NavLink>
        <NavLink to="/admin/milk-quality-ratings" className={linkClass}>
          Milk Quality Ratings
        </NavLink>
      </div>
    </nav>
  );
}
