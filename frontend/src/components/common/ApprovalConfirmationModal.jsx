import { AlertTriangle, Check, X } from "lucide-react";

export default function ApprovalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  data
}) {
  if (!isOpen || !data) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Approval</h2>
              <p className="text-gray-600">Please review the details before approving</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Request Details</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Farmer Name:</span>
                  <span className="font-medium text-gray-900">{data.farmerName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Request Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{data.requestType}</span>
                </div>
                
                {data.feedType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Feed Type:</span>
                    <span className="font-medium text-gray-900">{data.feedType}</span>
                  </div>
                )}
                
                {data.quantity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium text-gray-900">{data.quantity} kg</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.amount)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Confirmation Required</p>
                  <p className="text-sm text-blue-700 mt-1">
                    This action will approve the {data.requestType} request and cannot be undone. 
                    Please ensure all details are correct before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}