import { Receipt, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaymentHeader() {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Receipt size={32} />
            Farmer Payment Processing
          </h1>
          <p className="text-green-100">Generate bills and process payments efficiently</p>
        </div>
        <button
          onClick={() => navigate('/employee/payment-history')}
          className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <History size={18} />
          History
        </button>
      </div>
    </div>
  );
}