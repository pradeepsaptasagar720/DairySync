export default function RecentActivity() {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-3">Type</th>
            <th className="p-3">Name</th>
            <th className="p-3">Details</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-t">
            <td className="p-3">Registration</td>
            <td className="p-3">Farmer – Ramesh</td>
            <td className="p-3">Awaiting approval</td>
            <td className="p-3">Today</td>
          </tr>

          <tr className="border-t">
            <td className="p-3">Payment</td>
            <td className="p-3">Buyer – Anand</td>
            <td className="p-3">₹12,500 received</td>
            <td className="p-3">Yesterday</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
