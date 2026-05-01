export default function Billing() {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">
        Billing & Invoices
      </h2>

      <p className="text-sm text-gray-500 mb-4">
        Generated bills for farmers and buyers.
      </p>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Invoice</th>
            <th className="p-3 text-left">Amount</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="p-3">INV-1042</td>
            <td className="p-3">₹8,420</td>
            <td className="p-3 text-green-600">Generated</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
