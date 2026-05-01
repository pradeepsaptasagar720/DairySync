import DashboardLayout from "../../components/layout/DashboardLayout";
import EmptyState from "../../components/common/EmptyState";

export default function MilkBills() {
  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Milk Bills</h2>

        <EmptyState message="No bills available yet" />
      </div>
    </DashboardLayout>
  );
}
