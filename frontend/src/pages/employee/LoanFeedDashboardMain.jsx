import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

import LoanFeedOverview from "./sections/LoanFeedOverview";
import LoanManagement from "./LoanManagement";
import FeedManagement from "./FeedManagement";
import FeedStockManagement from "./FeedStockManagement";
import LoanFeedStats from "./sections/LoanFeedStats";
import LoanFeedHistory from "./sections/LoanFeedHistory";

export default function LoanFeedDashboardMain() {
  return (
    <DashboardLayout role="loanfeed">
      <Routes>
        <Route index element={<LoanFeedOverview />} />
        <Route path="loan-management" element={<LoanManagement />} />
        <Route path="feed-management" element={<FeedManagement />} />
        <Route path="feed-stock-management" element={<FeedStockManagement />} />
        <Route path="analytics" element={<LoanFeedStats />} />
        <Route path="history" element={<LoanFeedHistory />} />
      </Routes>
    </DashboardLayout>
  );
}