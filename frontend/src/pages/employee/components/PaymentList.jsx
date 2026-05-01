import { useState } from "react";
import { CheckCircle, Clock, CreditCard, Calendar, Download, Printer, ChevronDown, ChevronUp } from "lucide-react";

export default function PaymentList({ 
  billData, 
  paymentStatus, 
  pendingFarmers, 
  onProcessPayment, 
  getPaymentStatus,
  filters 
}) {
  const [expandedFarmers, setExpandedFarmers] = useState({});

  const toggleExpand = (farmerId) => {
    setExpandedFarmers(prev => ({ ...prev, [farmerId]: !prev[farmerId] }));
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const printBill = () => {
    window.print();
  };

  const downloadBill = () => {
    alert('PDF download functionality will be implemented');
  };

  const renderPaymentButton = (farmer) => {
    const status = getPaymentStatus(farmer);
    
    if (status.status === 'paid') {
      return (
        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <CheckCircle size={16} />
          Paid
        </div>
      );
    } else if (status.status === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Clock size={16} />
            Pending
          </div>
          <button
            onClick={() => onProcessPayment(farmer)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <CreditCard size={16} />
            Pay Now
          </button>
        </div>
      );
    } else {
      const paidAmount = paymentStatus.get(farmer.farmerId) || 0;
      const isPartiallyPaid = paidAmount > 0;
      
      return (
        <div className="flex items-center gap-2">
          {isPartiallyPaid && (
            <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
              Paid: ₹{paidAmount.toFixed(2)}
            </div>
          )}
          <button
            onClick={() => onProcessPayment(farmer)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <CreditCard size={16} />
            Pay ₹{status.remainingAmount.toFixed(2)}
          </button>
        </div>
      );
    }
  };
  const renderDayByDayTable = (transactions) => {
    if (!transactions || transactions.length === 0) return null;
    const sorted = [...transactions]
      .filter(e => e && e.date)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="border border-gray-200 px-2 py-1 text-left">Date</th>
              <th className="border border-gray-200 px-2 py-1 text-left">Session</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Cow L</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Cow Fat%</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Cow Rate</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Cow Amt</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Buf L</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Buf Fat%</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Buf Rate</th>
              <th className="border border-gray-200 px-2 py-1 text-right">Buf Amt</th>
              <th className="border border-gray-200 px-2 py-1 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-200 px-2 py-1">{entry.date}</td>
                <td className="border border-gray-200 px-2 py-1">{entry.session}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{(entry.cow?.quantity || 0).toFixed(1)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{(entry.cow?.fat || 0).toFixed(1)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{(entry.cow?.rate || 0).toFixed(2)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right text-blue-600">₹{(entry.cow?.amount || 0).toFixed(2)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{(entry.buffalo?.quantity || 0).toFixed(1)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{(entry.buffalo?.fat || 0).toFixed(1)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right">{(entry.buffalo?.rate || 0).toFixed(2)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right text-orange-600">₹{(entry.buffalo?.amount || 0).toFixed(2)}</td>
                <td className="border border-gray-200 px-2 py-1 text-right font-semibold text-green-600">₹{(entry.totalAmount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {/* Bill Header */}
      <div className="bg-green-50 p-4 border-b">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-xl font-bold text-green-800 mb-1">
              🥛 Dairy Management System
            </h2>
            <p className="text-green-600 text-sm">Farmer Payment Bill</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-gray-600">Bill Date: {formatDate(new Date())}</p>
            <p className="text-gray-600">Period: {formatDate(filters.dateFrom)} to {formatDate(filters.dateTo)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={printBill}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Printer size={14} />
            Print
          </button>
          <button
            onClick={downloadBill}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* Bill Content */}
      <div className="p-4">
        {filters.farmerType === 'all' ? (
          // All Farmers Bill
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">All Farmers Payment Summary</h3>
            
            {billData.farmers?.map((farmer, index) => (
              <div key={farmer.farmerId || index} className="border border-gray-200 rounded-lg p-4">
                {/* Farmer Header */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-semibold text-base">{farmer.farmerName}</h4>
                    <p className="text-xs text-gray-600">ID: {farmer.farmerUniqueId} | Mobile: {farmer.farmerMobile}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-base font-bold text-green-600">₹{farmer.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-600">{farmer.totalEntries} entries</p>
                    </div>
                    {renderPaymentButton(farmer)}
                  </div>
                </div>

                {/* Milk Type Summary */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-sm">🐄</span>
                      <span className="text-xs font-medium">Cow</span>
                    </div>
                    <p className="text-xs">{farmer.cowMilk.quantity.toFixed(1)}L</p>
                    <p className="text-xs font-semibold text-blue-600">₹{farmer.cowMilk.amount.toFixed(2)}</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-sm">🐃</span>
                      <span className="text-xs font-medium">Buffalo</span>
                    </div>
                    <p className="text-xs">{farmer.buffaloMilk.quantity.toFixed(1)}L</p>
                    <p className="text-xs font-semibold text-orange-600">₹{farmer.buffaloMilk.amount.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-sm">💰</span>
                      <span className="text-xs font-medium">Total</span>
                    </div>
                    <p className="text-xs">{(farmer.cowMilk.quantity + farmer.buffaloMilk.quantity).toFixed(1)}L</p>
                    <p className="text-xs font-bold text-green-600">₹{farmer.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Day-by-day toggle */}
                <button
                  onClick={() => toggleExpand(farmer.farmerId)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  {expandedFarmers[farmer.farmerId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expandedFarmers[farmer.farmerId] ? 'Hide' : 'Show'} day-by-day details
                </button>
                {expandedFarmers[farmer.farmerId] && renderDayByDayTable(farmer.transactions)}
              </div>
            ))}

            {/* Grand Total */}
            <div className="border-t-2 border-green-600 pt-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Farmers</p>
                    <p className="text-lg font-bold text-green-600">{billData.summary?.totalFarmers || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Entries</p>
                    <p className="text-lg font-bold text-green-600">{billData.summary?.totalEntries || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Liters</p>
                    <p className="text-lg font-bold text-green-600">{billData.summary?.totalLiters?.toFixed(1) || '0.0'}L</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Grand Total</p>
                    <p className="text-xl font-bold text-green-600">₹{billData.summary?.grandTotal?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Single Farmer Bill
          billData.farmer && (
            <div className="space-y-4">
              {/* Farmer Details */}
              <div className="border-b pb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Farmer Details</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {billData.farmer.farmerName}</p>
                      <p><strong>ID:</strong> {billData.farmer.farmerUniqueId}</p>
                      <p><strong>Mobile:</strong> {billData.farmer.farmerMobile}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill Summary</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Entries:</strong> {billData.farmer.totalEntries}</p>
                      <p><strong>Liters:</strong> {(billData.farmer.cowMilk.quantity + billData.farmer.buffaloMilk.quantity).toFixed(1)}L</p>
                      <p><strong>Amount:</strong> <span className="text-green-600 font-bold">₹{billData.farmer.totalAmount.toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milk Type Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🐄</span>
                    <h4 className="font-semibold text-base">Cow Milk</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Quantity:</strong> {billData.farmer.cowMilk.quantity.toFixed(1)}L</p>
                    <p><strong>Avg Fat:</strong> {billData.farmer.cowMilk.avgFat.toFixed(2)}%</p>
                    <p><strong>Avg Rate:</strong> ₹{billData.farmer.cowMilk.avgRate.toFixed(2)}/L</p>
                    <p><strong>Amount:</strong> <span className="font-bold text-blue-600">₹{billData.farmer.cowMilk.amount.toFixed(2)}</span></p>
                  </div>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🐃</span>
                    <h4 className="font-semibold text-base">Buffalo Milk</h4>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>Quantity:</strong> {billData.farmer.buffaloMilk.quantity.toFixed(1)}L</p>
                    <p><strong>Avg Fat:</strong> {billData.farmer.buffaloMilk.avgFat.toFixed(2)}%</p>
                    <p><strong>Avg Rate:</strong> ₹{billData.farmer.buffaloMilk.avgRate.toFixed(2)}/L</p>
                    <p><strong>Amount:</strong> <span className="font-bold text-orange-600">₹{billData.farmer.buffaloMilk.amount.toFixed(2)}</span></p>
                  </div>
                </div>
              </div>

              {/* Transactions Detail */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Day-by-Day Details</h3>
                {renderDayByDayTable(billData.farmer.transactions)}
              </div>

              {/* Payment Summary */}
              <div className="border-t-2 border-green-600 pt-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-semibold text-green-800">Payment Summary</h3>
                    {renderPaymentButton(billData.farmer)}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-600">Cow Milk</p>
                      <p className="text-sm font-bold text-blue-600">₹{billData.farmer.cowMilk.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Buffalo Milk</p>
                      <p className="text-sm font-bold text-orange-600">₹{billData.farmer.buffaloMilk.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Grand Total</p>
                      <p className="text-lg font-bold text-green-600">₹{billData.farmer.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Bill Footer */}
      <div className="bg-gray-50 p-3 border-t text-center text-xs text-gray-600">
        <p>This is a computer-generated bill. Thank you for your business!</p>
        <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
      </div>
    </div>
  );
}