export default function BuyerActivity() {
  return (
    <div className="bg-white rounded-xl shadow border">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold">Recent Activity</h3>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Type</th>
            <th className="p-3 text-left">Details</th>
            <th className="p-3 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3">Bill Generated</td>
            <td className="p-3">₹4,200</td>
            <td className="p-3">2 days ago</td>
          </tr>
          <tr className="border-t">
            <td className="p-3">Payment</td>
            <td className="p-3">₹12,500 Paid</td>
            <td className="p-3">1 week ago</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
