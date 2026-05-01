// src/components/layout/DashboardLayout.jsx
import { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDairyInfo } from "../../hooks/useDairyInfo";
import AdminSidebar from "../navigation/AdminSidebar";
import FarmerSidebar from "../navigation/FarmerSidebar";
import BuyerSidebar from "../navigation/BuyerSidebar";
import EmployeeSidebar from "../navigation/EmployeeSidebar";
import LoanFeedSidebar from "../navigation/LoanFeedSidebar";
import ProfileModal from "../common/ProfileModal";
import NotificationBell from "../notification/NotificationBell";

export default function DashboardLayout({ role, children }) {
  const { logout } = useAuth();
  const { getDairyDisplayName, getDairyLocation } = useDairyInfo();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const renderSidebar = () => {
    switch (role) {
      case "admin":
        return <AdminSidebar />;
      case "farmer":
        return <FarmerSidebar />;
      case "buyer":
        return <BuyerSidebar />;
      case "employee":
        return <EmployeeSidebar />;
      case "delivery":
        return <EmployeeSidebar />;
      case "loanfeed":
        return <LoanFeedSidebar />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 bg-slate-900 text-white">
        <div className="p-4 border-b border-slate-700">
          <div className="text-xl font-bold mb-1">
            {getDairyDisplayName()}
          </div>
          <div className="text-sm text-slate-300">
            {getDairyLocation()}
          </div>
        </div>
        {renderSidebar()}
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-3 flex justify-between items-center">
          <h1 className="font-semibold capitalize">{role} Dashboard</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Profile Settings"
            >
              <User size={18} />
              Profile
            </button>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">{children}</main>

        {/* Profile Modal */}
        <ProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)} 
        />
      </div>
    </div>
  );
}
