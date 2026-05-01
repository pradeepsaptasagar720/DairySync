import DashboardLayout from "../../components/layout/DashboardLayout";

export default function DeliveryTracking() {
  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Delivery Tracking</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">13-12-2025</td>
              <td className="border p-2">5 L</td>
              <td className="border p-2 text-yellow-600">Pending</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
