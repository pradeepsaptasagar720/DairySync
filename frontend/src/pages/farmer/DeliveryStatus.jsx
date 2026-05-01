import DashboardLayout from "../../components/layout/DashboardLayout";

export default function DeliveryStatus() {
  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Delivery Status</h2>

        <p className="text-gray-700">
          Today's milk delivery status:
          <span className="ml-2 font-semibold text-green-600">Collected</span>
        </p>
      </div>
    </DashboardLayout>
  );
}
