import { Routes, Route, Navigate } from "react-router-dom";
import LoanFeedDashboardMain from "./LoanFeedDashboardMain";

export default function LoanFeedDashboardLayout() {
  return (
    <Routes>
      {/* All routes now handled by the main dashboard with sidebar */}
      <Route path="/*" element={<LoanFeedDashboardMain />} />
      
      {/* Redirect any unknown routes to main dashboard */}
      <Route path="*" element={<Navigate to="/loanfeed" replace />} />
    </Routes>
  );
}