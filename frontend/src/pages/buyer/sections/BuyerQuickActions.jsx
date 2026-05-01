import { Link } from "react-router-dom";

export default function BuyerQuickActions() {
  return (
    <div className="bg-white rounded-xl shadow border p-4 space-y-3">
      <h3 className="text-sm font-semibold">Quick Actions</h3>

      <Link
        to="/buyer/delivery-request"
        className="block w-full text-center bg-blue-600 text-white py-2 rounded"
      >
        Request Home Delivery
      </Link>

      <Link
        to="/buyer/bills"
        className="block w-full text-center bg-gray-100 py-2 rounded"
      >
        View Bills
      </Link>

      <Link
        to="/buyer/payments"
        className="block w-full text-center bg-gray-100 py-2 rounded"
      >
        Payment History
      </Link>
    </div>
  );
}
