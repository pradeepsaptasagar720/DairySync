export default function EmployeeActivity() {
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
            <th className="p-3 text-left">Time</th>
          </tr>
        </thead>

        <tbody>
          <tr className="border-t">
            <td className="p-3">Milk Collection</td>
            <td className="p-3">Farmer Ramesh – 42 L</td>
            <td className="p-3">30 mins ago</td>
          </tr>

          <tr className="border-t">
            <td className="p-3">Delivery Completed</td>
            <td className="p-3">Buyer Anand – COD ₹2,100</td>
            <td className="p-3">1 hour ago</td>
          </tr>

          <tr className="border-t">
            <td className="p-3">Bill Generated</td>
            <td className="p-3">Invoice #INV-1042</td>
            <td className="p-3">Today</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
