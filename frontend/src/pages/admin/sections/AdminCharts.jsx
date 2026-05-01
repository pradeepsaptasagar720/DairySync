import MilkCollectionChart from "../../../components/charts/MilkCollectionChart";
import RevenueChart from "../../../components/charts/RevenueChart";

export default function AdminCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MilkCollectionChart />
      <RevenueChart />
    </div>
  );
}
