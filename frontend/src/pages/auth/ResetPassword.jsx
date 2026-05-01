import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../services/api";

export default function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError("Please enter the OTP"); return; }
    if (!/^\d{4,6}$/.test(otp.trim())) { setError("Enter a valid OTP"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/verify-reset-otp", { mobile: state?.mobile, otp: otp.trim() });
      setOtpVerified(true);
    } catch (e) {
      setError(e.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password) { setError("Password is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        mobile: state?.mobile,
        otp: otp.trim(),
        newPassword: password,
      });
      navigate("/login");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-80 space-y-3">
        <h2 className="text-xl font-semibold text-center">Reset Password</h2>

        {/* Step 1: OTP entry */}
        <div>
          <input
            className={`border p-2 w-full rounded ${error && !otpVerified ? "border-red-400" : ""}`}
            placeholder="Enter OTP"
            value={otp}
            maxLength={6}
            disabled={otpVerified}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
          />
          {otpVerified && (
            <p className="text-green-600 text-xs mt-1">✓ OTP verified</p>
          )}
        </div>

        {!otpVerified && (
          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        )}

        {/* Step 2: New password — only shown after OTP verified */}
        {otpVerified && (
          <>
            <input
              type="password"
              className={`border p-2 w-full rounded ${error ? "border-red-400" : ""}`}
              placeholder="New Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
            />
            <input
              type="password"
              className={`border p-2 w-full rounded ${error ? "border-red-400" : ""}`}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            />
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    </div>
  );
}
