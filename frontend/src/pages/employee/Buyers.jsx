export default function Buyers() {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">Buyers List</h2>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Buyer</th>
            <th className="p-3 text-left">Area</th>
            <th className="p-3 text-left">Delivery Type</th>
            <th className="p-3 text-left">Payment Mode</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3">Anand</td>
            <td className="p-3">Bangalore</td>
            <td className="p-3">Daily</td>
            <td className="p-3">COD</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
