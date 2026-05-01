import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function DeliveryRequest() {
  const [form, setForm] = useState({
    quantity: "",
    address: "",
    date: "",
    frequency: "one-time",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = () => {
    alert("Delivery request submitted");
  };

  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Request Milk Delivery</h2>

        <input
          name="quantity"
          type="number"
          placeholder="Quantity (Liters)"
          className="border p-2 w-full mb-3"
          onChange={handleChange}
        />

        <textarea
          name="address"
          placeholder="Delivery Address"
          className="border p-2 w-full mb-3"
          onChange={handleChange}
        />

        <input
          name="date"
          type="date"
          className="border p-2 w-full mb-3"
          onChange={handleChange}
        />

        <select
          name="frequency"
          className="border p-2 w-full mb-4"
          onChange={handleChange}
        >
          <option value="one-time">One Time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </select>

        <button
          onClick={submit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Submit Request
        </button>
      </div>
    </DashboardLayout>
  );
}
