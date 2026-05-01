import { useState, useEffect } from "react";
import { ShoppingCart, Milk, IndianRupee, MapPin, Calendar, Clock, CreditCard, Smartphone } from "lucide-react";
import api from "../../services/api";

export default function Orders() {
  const [milkType, setMilkType] = useState("cow");
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [milkRates, setMilkRates] = useState({ cow: 50, buffalo: 60 });
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchMilkRates();
    // Set minimum delivery date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const fetchMilkRates = async () => {
    try {
      // Use the same endpoint as BuyerOverview for consistency
      const response = await api.get("/api/buyer/milk-availability");
      const milkData = response.data.data;
      
      if (milkData?.milkRates) {
        setMilkRates(milkData.milkRates);
      } else {
        // Fallback to default rates
        setMilkRates({ cow: 50, buffalo: 60, mixed: 55 });
      }
    } catch (error) {
      console.error("Error fetching milk rates:", error);
      // Set default rates on error
      setMilkRates({ cow: 50, buffalo: 60, mixed: 55 });
    }
  };

  const calculateTotal = () => {
    const rate = milkRates[milkType];
    return quantity * rate;
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      alert("Please enter delivery address");
      return;
    }

    if (!deliveryDate) {
      alert("Please select delivery date");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        milkType,
        quantity,
        rate: milkRates[milkType],
        totalAmount: calculateTotal(),
        address: address.trim(),
        deliveryDate,
        paymentMethod
      };

      const response = await api.post("/api/buyer/place-order", orderData);
      
      if (response.data.success) {
        alert("Order placed successfully! You will receive confirmation once approved.");
        // Reset form
        setQuantity(1);
        setAddress("");
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);
        setPaymentMethod("cod");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    const upiId = "dairy@upi"; // Replace with actual UPI ID
    const amount = calculateTotal();
    const upiUrl = `upi://pay?pa=${upiId}&pn=Dairy&am=${amount}&cu=INR&tn=Milk Order Payment`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <ShoppingCart size={32} />
          Place New Order
        </h1>
        <p className="text-green-100">Order fresh milk for delivery</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Form */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Milk className="text-blue-600" size={24} />
            Order Details
          </h2>

          <div className="space-y-6">
            {/* Milk Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Milk Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMilkType("cow")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    milkType === "cow"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">🐄</div>
                  <div className="font-medium">Cow Milk</div>
                  <div className="text-sm text-gray-600">₹{milkRates.cow}/L</div>
                </button>
                <button
                  onClick={() => setMilkType("buffalo")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    milkType === "buffalo"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">🐃</div>
                  <div className="font-medium">Buffalo Milk</div>
                  <div className="text-sm text-gray-600">₹{milkRates.buffalo}/L</div>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity (Liters)
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Delivery Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your complete delivery address..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none"
                required
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-600"
                  />
                  <CreditCard size={20} className="text-green-600" />
                  <div>
                    <div className="font-medium">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">Pay when you receive the milk</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600"
                  />
                  <Smartphone size={20} className="text-blue-600" />
                  <div>
                    <div className="font-medium">UPI Payment</div>
                    <div className="text-sm text-gray-600">Pay now using UPI</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <IndianRupee className="text-green-600" size={24} />
            Order Summary
          </h2>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">
                  {milkType === "cow" ? "🐄" : "🐃"}
                </div>
                <div>
                  <div className="font-medium capitalize">{milkType} Milk</div>
                  <div className="text-sm text-gray-600">₹{milkRates[milkType]} per liter</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{quantity} L</span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span className="font-medium">₹{milkRates[milkType]}/L</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold text-green-600">
                  <span>Total Amount:</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Clock size={16} />
                Delivery Information
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>📅 Date: {deliveryDate ? new Date(deliveryDate).toLocaleDateString() : "Not selected"}</p>
                <p>🕐 Time: Morning (6:00 AM - 10:00 AM)</p>
                <p>💳 Payment: {paymentMethod === "cod" ? "Cash on Delivery" : "UPI Payment"}</p>
              </div>
            </div>

            {/* UPI QR Code */}
            {paymentMethod === "upi" && (
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <h3 className="font-medium text-purple-800 mb-3">Scan to Pay</h3>
                <img
                  src={generateQRCode()}
                  alt="UPI QR Code"
                  className="mx-auto mb-3 border rounded-lg"
                />
                <p className="text-sm text-purple-700">
                  Scan this QR code with any UPI app to pay ₹{calculateTotal()}
                </p>
              </div>
            )}

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading || !address.trim() || !deliveryDate}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Placing Order...
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Place Order - ₹{calculateTotal()}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Your order will be confirmed once approved by the dairy admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}