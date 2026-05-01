import DashboardLayout from "../../components/layout/DashboardLayout";

export default function Payments() {
  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Payments</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">10-12-2025</td>
              <td className="border p-2">₹4,200</td>
              <td className="border p-2 text-green-600">Paid</td>
            </tr>
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
