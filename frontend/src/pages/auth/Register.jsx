import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [dairyName, setDairyName] = useState("Dairy Management System");

  const navigate = useNavigate();

  // Fetch dairy info for display
  useEffect(() => {
    fetchDairyInfo();
  }, []);

  const fetchDairyInfo = async () => {
    try {
      const response = await api.get("/api/public/landing-stats");
      if (response.data.data?.dairyInfo?.name) {
        setDairyName(response.data.data.dairyInfo.name);
      }
    } catch (error) {
      console.error("Error fetching dairy info:", error);
      // Keep default name if fetch fails
    }
  };

  /* -------------------------
     FRONTEND VALIDATION
  ------------------------- */
  const validate = () => {
    const { username, mobile, password, confirmPassword, role } = form;

    if (!username || !mobile || !password || !confirmPassword || !role) {
      return "All fields are required";
    }

    if (!/^\d{10}$/.test(mobile)) {
      return "Mobile number must be exactly 10 digits";
    }

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@$!%*#?&]/.test(password)
    ) {
      return "Password must be 8+ chars, alphanumeric & 1 special character";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  /* -------------------------
     SUBMIT HANDLER
  ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/api/auth/register", {
        username: form.username,
        mobile: form.mobile,
        password: form.password,
        role: form.role,
      });

      // No unique ID is provided during registration - it will be assigned after admin approval
      setSuccess(response.data.message);

      // Redirect to OTP verification with role context
      setTimeout(() => {
        navigate("/otp-verify", {
          state: { mobile: form.mobile },
        });
      }, 3000);

    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-emerald-100 to-green-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Waves */}
      <div className="absolute inset-0">
        <div className="absolute w-full h-32 bg-gradient-to-r from-green-300/30 to-emerald-200/30 rounded-full top-1/4 left-0 animate-pulse transform -rotate-12" style={{animationDuration: '3s'}}></div>
        <div className="absolute w-full h-24 bg-gradient-to-r from-emerald-300/20 to-green-200/20 rounded-full top-1/2 right-0 animate-bounce transform rotate-6" style={{animationDuration: '4s'}}></div>
        <div className="absolute w-full h-28 bg-gradient-to-r from-green-200/25 to-emerald-300/25 rounded-full bottom-1/4 left-0 animate-pulse transform rotate-3" style={{animationDuration: '2.5s'}}></div>
      </div>

      {/* Animated Geometric Shapes */}
      <div className="absolute inset-0">
        <div className="absolute w-20 h-20 bg-white/15 rotate-45 top-20 left-1/4 animate-spin" style={{animationDuration: '8s'}}></div>
        <div className="absolute w-16 h-16 bg-green-300/20 rotate-45 bottom-32 right-1/4 animate-spin" style={{animationDuration: '6s', animationDirection: 'reverse'}}></div>
        <div className="absolute w-12 h-12 bg-emerald-200/25 rotate-45 top-1/2 right-20 animate-spin" style={{animationDuration: '10s'}}></div>
      </div>

      {/* Floating Animated Farm Elements */}
      <div className="absolute inset-0 opacity-25">
        <div className="absolute top-16 left-16 text-5xl animate-bounce" style={{animationDelay: '0s', animationDuration: '2.8s'}}>🌱</div>
        <div className="absolute top-32 right-24 text-3xl animate-pulse" style={{animationDelay: '1.2s', animationDuration: '3.5s'}}>🍃</div>
        <div className="absolute bottom-24 left-32 text-4xl animate-bounce" style={{animationDelay: '2s', animationDuration: '2.2s'}}>🌿</div>
        <div className="absolute bottom-16 right-16 text-5xl animate-pulse" style={{animationDelay: '0.8s', animationDuration: '3s'}}>🌾</div>
        <div className="absolute top-2/3 left-1/3 text-3xl animate-bounce" style={{animationDelay: '1.8s', animationDuration: '2.6s'}}>🐄</div>
        <div className="absolute top-1/4 right-1/2 text-4xl animate-pulse" style={{animationDelay: '2.2s', animationDuration: '2.4s'}}>🥛</div>
        <div className="absolute bottom-1/3 right-1/3 text-3xl animate-bounce" style={{animationDelay: '1s', animationDuration: '3.2s'}}>🚜</div>
      </div>

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/3 to-transparent animate-pulse" style={{animationDuration: '5s'}}></div>

      <div className="w-full max-w-md relative">
        {/* Main Register Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-center relative">
            {/* Back Button */}
            <Link 
              to="/" 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200 group"
            >
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 rounded-full p-3 animate-pulse" style={{animationDuration: '2.5s'}}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Join Our Dairy</h1>
            <p className="text-green-100 text-sm">Create your account to get started</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Dairy Farm Branding */}
            <div className="text-center mb-6">
              <div className="flex justify-center items-center space-x-2 mb-2">
                <span className="text-2xl">🐄</span>
                <h2 className="text-xl font-semibold text-gray-800">{dairyName}</h2>
                <span className="text-2xl">🥛</span>
              </div>
              <p className="text-gray-600 text-sm">Fresh milk, happy cows, better farming</p>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">{success}</p>
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="text-sm font-medium text-blue-800 flex items-center">
                        <span className="mr-2">📋</span>
                        Next Steps:
                      </div>
                      <div className="text-xs text-blue-600 mt-2 space-y-1">
                        <div className="flex items-center">
                          <span className="mr-2">1️⃣</span>
                          Verify your OTP
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">2️⃣</span>
                          Wait for admin approval
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">3️⃣</span>
                          Your unique ID will be assigned after approval
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                👤 Username
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.trim() })
                }
              />
            </div>

            {/* Mobile Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                📱 Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      mobile: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🔒 Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                8+ characters with letters, numbers & special characters
              </p>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🔐 Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🎯 Select Your Role
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                <option value="">Choose your role...</option>
                <option value="farmer">🚜 Farmer - Milk Producer</option>
                <option value="buyer">🛒 Buyer - Milk Consumer</option>
              </select>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 font-medium">👨‍💼 Looking to join as an employee?</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Employee accounts are created by administrators only. Please contact the dairy management for employment opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                "🌟 Create Dairy Account"
              )}
            </button>

            {/* Links */}
            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
              <div className="text-center">
                <span className="text-sm text-gray-600">Already have an account? </span>
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors duration-200"
                >
                  🚀 Sign In
                </Link>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t">
            <p className="text-xs text-gray-500">
              🌱 Connecting farmers, buyers, and dairy excellence since 2024
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-6 -right-6 bg-white/90 rounded-full p-3 shadow-lg animate-bounce" style={{animationDuration: '2.5s'}}>
          <span className="text-2xl">🌱</span>
        </div>
        <div className="absolute -bottom-6 -left-6 bg-white/90 rounded-full p-3 shadow-lg animate-pulse" style={{animationDuration: '3.5s'}}>
          <span className="text-2xl">🌿</span>
        </div>
      </div>
    </div>
  );
}
