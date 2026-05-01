export default function FarmerActivity() {
  return (
    <div className="bg-white rounded-xl shadow border col-span-2">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Activity</th>
            <th className="p-3 text-left">Details</th>
            <th className="p-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3">Milk Entry</td>
            <td className="p-3">48 L recorded</td>
            <td className="p-3">Today</td>
          </tr>
          <tr className="border-t">
            <td className="p-3">Payment Received</td>
            <td className="p-3">₹12,400 credited</td>
            <td className="p-3">3 days ago</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
