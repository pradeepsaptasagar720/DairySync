import { useState, useEffect } from "react";
import api from "../../services/api";
import { useDairyInfo } from "../../hooks/useDairyInfo";

export default function DairyInfo() {
  const { refreshDairyInfo } = useDairyInfo();
  const [dairyInfo, setDairyInfo] = useState({
    dairyName: "",
    district: "",
    taluka: "",
    post: "",
    pincode: "",
    place: "",
    area: "",
    mobileNo: "",
    email: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDairyInfo();
  }, []);

  const fetchDairyInfo = async () => {
    try {
      const res = await api.get("/api/admin/dairy-info");
      const data = res.data.data;
      
      if (data) {
        setDairyInfo(data);
      } else {
        // No dairy info exists, set empty form
        setDairyInfo({
          dairyName: "",
          district: "",
          taluka: "",
          post: "",
          pincode: "",
          place: "",
          area: "",
          mobileNo: "",
          email: ""
        });
      }
    } catch (err) {
      console.error("Error fetching dairy info:", err);
      // Set empty form on error
      setDairyInfo({
        dairyName: "",
        district: "",
        taluka: "",
        post: "",
        pincode: "",
        place: "",
        area: "",
        mobileNo: "",
        email: ""
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (dairyInfo.mobileNo && !/^\d{10}$/.test(dairyInfo.mobileNo)) {
      setMessage("Mobile number must be exactly 10 digits");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      
      await api.post("/api/admin/dairy-info", dairyInfo);
      setMessage("Dairy information updated successfully!");
      
      // Refresh the dairy info context so all dashboards update
      refreshDairyInfo();
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Failed to update dairy information");
      console.error("Error saving dairy info:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow max-w-2xl">
        <p>Loading dairy information...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Dairy Information</h2>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes("successfully") 
            ? "bg-green-100 text-green-700" 
            : "bg-red-100 text-red-700"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dairy Name *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.dairyName}
            onChange={(e) => setDairyInfo({...dairyInfo, dairyName: e.target.value})}
            placeholder="Enter dairy name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            District *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.district}
            onChange={(e) => setDairyInfo({...dairyInfo, district: e.target.value})}
            placeholder="Enter district"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taluka *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.taluka}
            onChange={(e) => setDairyInfo({...dairyInfo, taluka: e.target.value})}
            placeholder="Enter taluka"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.post}
            onChange={(e) => setDairyInfo({...dairyInfo, post: e.target.value})}
            placeholder="Enter post office"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.pincode}
            onChange={(e) => setDairyInfo({...dairyInfo, pincode: e.target.value})}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Place *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.place}
            onChange={(e) => setDairyInfo({...dairyInfo, place: e.target.value})}
            placeholder="Enter place"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Area *
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.area}
            onChange={(e) => setDairyInfo({...dairyInfo, area: e.target.value})}
            placeholder="Enter area"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.mobileNo}
            onChange={(e) => setDairyInfo({...dairyInfo, mobileNo: e.target.value.replace(/\D/g, '').slice(0, 10)})}
            placeholder="Enter 10-digit mobile number"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.email || ""}
            onChange={(e) => setDairyInfo({...dairyInfo, email: e.target.value})}
            placeholder="Enter email address (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌅 Morning Opening Time
          </label>
          <input
            type="time"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.morningOpenTime || "06:00"}
            onChange={(e) => setDairyInfo({...dairyInfo, morningOpenTime: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌅 Morning Closing Time
          </label>
          <input
            type="time"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.morningCloseTime || "10:00"}
            onChange={(e) => setDairyInfo({...dairyInfo, morningCloseTime: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌇 Evening Opening Time
          </label>
          <input
            type="time"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.eveningOpenTime || "16:00"}
            onChange={(e) => setDairyInfo({...dairyInfo, eveningOpenTime: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌇 Evening Closing Time
          </label>
          <input
            type="time"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dairyInfo.eveningCloseTime || "19:00"}
            onChange={(e) => setDairyInfo({...dairyInfo, eveningCloseTime: e.target.value})}
          />
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Information"}
      </button>
    </div>
  );
}
