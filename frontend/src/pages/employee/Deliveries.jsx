export default function Deliveries() {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">
        Delivery Management
      </h2>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Buyer</th>
            <th className="p-3 text-left">Quantity</th>
            <th className="p-3 text-left">Payment</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3">Anand</td>
            <td className="p-3">10 L</td>
            <td className="p-3">COD ₹420</td>
            <td className="p-3 text-yellow-600">Pending</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
