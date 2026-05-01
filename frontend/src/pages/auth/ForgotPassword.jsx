import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ForgotPassword() {
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!mobile.trim()) return "Mobile number is required";
    if (!/^\d{10}$/.test(mobile.trim())) return "Enter a valid 10-digit mobile number";
    return "";
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { mobile: mobile.trim() });
      navigate("/reset-password", { state: { mobile: mobile.trim() } });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-80 space-y-3">
        <h2 className="text-xl font-semibold text-center">Forgot Password</h2>

        <input
          className={`border p-2 w-full rounded ${error ? "border-red-400" : ""}`}
          placeholder="Registered Mobile"
          value={mobile}
          maxLength={10}
          onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "")); setError(""); }}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
}
