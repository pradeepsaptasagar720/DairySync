import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function OtpVerify() {
  const navigate = useNavigate();
  const location = useLocation();

  const mobile = location.state?.mobile;

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🚫 HARD GUARD: No mobile → cannot access OTP page
  useEffect(() => {
    if (!mobile) {
      navigate("/register", { replace: true });
    }
  }, [mobile, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be exactly 6 digits");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/auth/verify-otp", {
        mobile,
        otp,
      });

      // ✅ OTP VERIFIED → GO TO LOGIN
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleVerify}
        className="bg-white p-6 rounded-xl shadow w-96 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">
          OTP Verification
        </h2>

        <p className="text-sm text-gray-600 text-center">
          OTP sent to <strong>{mobile}</strong>
        </p>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          className="border p-2 w-full rounded"
          placeholder="Enter 6-digit OTP"
          maxLength={6}
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, ""))
          }
        />

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
