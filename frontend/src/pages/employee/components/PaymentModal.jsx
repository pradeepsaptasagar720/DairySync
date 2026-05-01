import { CreditCard } from "lucide-react";

export default function PaymentModal({ 
  isOpen, 
  farmer, 
  paymentData, 
  onPaymentDataChange, 
  onClose, 
  onProcessPayment, 
  loading 
}) {
  if (!isOpen || !farmer) return null;

  const handleInputChange = (key, value) => {
    onPaymentDataChange(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onProcessPayment(paymentData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Process Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Farmer Details */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-800">{paymentData.farmerName}</p>
            <p className="text-sm text-gray-600">Amount: ₹{paymentData.totalAmount.toFixed(2)}</p>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={paymentData.paymentType}
              onChange={(e) => handleInputChange('paymentType', e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows="3"
              placeholder="Add any notes about this payment..."
              value={paymentData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Process Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}