// src/pages/admin/Payments.jsx
import { Link } from "react-router-dom";

export default function Payments() {
  const paymentTypes = [
    {
      title: "Amount Paid to Farmers",
      description: "Manage payments to farmers for milk supply",
      route: "/admin/payments/farmers",
      icon: "🚜",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Amount Paid by Buyers",
      description: "Track payments received from buyers",
      route: "/admin/payments/buyers",
      icon: "🛒",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Employee Salary Management",
      description: "Process employee salary with payment methods",
      route: "/admin/payments/employee-salary",
      icon: "💼",
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: "Feed Payments",
      description: "Track feed stock purchases and sales to farmers",
      route: "/admin/payments/feed",
      icon: "🌾",
      color: "bg-yellow-500 hover:bg-yellow-600"
    },
    {
      title: "Other Payments",
      description: "Handle miscellaneous payments and expenses",
      route: "/admin/payments/others",
      icon: "💰",
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Manage all payment operations from this central hub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {paymentTypes.map((payment, index) => (
          <Link
            key={index}
            to={payment.route}
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-200 group-hover:border-gray-300">
              <div className="flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full ${payment.color} flex items-center justify-center text-white text-2xl mb-4 transition-colors duration-300`}>
                  {payment.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700">
                  {payment.title}
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-gray-500">
                  {payment.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Payment Management Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>All payment records are automatically tracked and audited</li>
                <li>Use the export feature to generate payment reports</li>
                <li>Verify payment details before processing</li>
                <li>Contact support for any payment discrepancies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}