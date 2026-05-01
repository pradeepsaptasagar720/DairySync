import { useState, useEffect, useRef } from "react";
import { X, RefreshCw } from "lucide-react";
import { toast } from 'react-toastify';

export default function OTPEntryModal({ isOpen, onClose, orderId, onVerifySuccess }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  const inputRefs = useRef([]);

  // Timer for OTP expiration
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemaining("Expired");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  // Reset all state when modal opens for a new order
  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setSuccess(false);
      setCooldown(0);
      setExpiresAt(null);
      setTimeRemaining(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [isOpen, orderId]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or next empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          orderId,
          otp: otpString
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        toast.success('✅ Delivery completed successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        setTimeout(() => {
          onVerifySuccess();
          onClose();
        }, 1500);
      } else {
        const errorMessage = data.error?.message || "Invalid OTP. Please try again.";
        setError(errorMessage);
        toast.error(`❌ ${errorMessage}`, {
          position: "top-right",
          autoClose: 4000,
        });
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setResending(true);
    setError("");

    try {
      const response = await fetch("/api/otp/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();

      if (data.success) {
        setExpiresAt(data.data.expiresAt);
        setCooldown(30); // 30 second cooldown
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        
        // Show success toast
        if (data.data.smsSent) {
          toast.success('🎉 OTP sent to buyer successfully!', {
            position: "top-right",
            autoClose: 3000,
          });
        } else if (data.data.fallbackOTP) {
          toast.warning(`⚠️ SMS failed. OTP: ${data.data.fallbackOTP}. Please share with buyer.`, {
            position: "top-right",
            autoClose: 10000,
          });
        }
        
        setError("");
      } else {
        const errorMessage = data.error?.message || "Failed to resend OTP";
        setError(errorMessage);
        toast.error(`❌ ${errorMessage}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  const isOtpComplete = otp.every(digit => digit !== "");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter OTP</h2>
          <p className="text-gray-600 text-sm">
            Ask the buyer for the 6-digit OTP sent to their mobile
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading || success}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
                  ${digit ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                  ${error ? 'border-red-500' : ''}
                  ${success ? 'border-green-500 bg-green-50' : ''}
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>

          {/* Timer */}
          {timeRemaining && (
            <div className="text-center mb-2">
              <span className={`text-sm font-medium ${timeRemaining === "Expired" ? "text-red-600" : "text-gray-600"}`}>
                {timeRemaining === "Expired" ? "⏰ OTP Expired" : `⏱️ Expires in: ${timeRemaining}`}
              </span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-700 text-sm text-center font-medium">
                ✅ OTP Verified Successfully!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleVerify}
            disabled={!isOtpComplete || loading || success}
            className={`w-full py-3 rounded-lg font-medium transition-all
              ${isOtpComplete && !loading && !success
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Verifying...
              </div>
            ) : success ? (
              "Verified ✓"
            ) : (
              "Verify OTP"
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending || success}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
              ${cooldown === 0 && !resending && !success
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <RefreshCw size={18} className={resending ? "animate-spin" : ""} />
            {resending ? "Resending..." : cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
          </button>
        </div>

        {/* Help text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the OTP? Ask the buyer to check their messages or use the resend button.
          </p>
        </div>
      </div>
    </div>
  );
}
