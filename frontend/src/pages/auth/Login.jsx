import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const [form, setForm] = useState({
    mobile: "",
    password: "",
    role: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dairyName, setDairyName] = useState("Dairy Management System");
  const [dairyInfo, setDairyInfo] = useState(null);

  const { login } = useAuth();
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
    if (!form.mobile || !form.password || !form.role) {
      return "All fields are required";
    }

    if (!/^\d{10}$/.test(form.mobile)) {
      return "Mobile number must be exactly 10 digits";
    }

    return null;
  };

  /* -------------------------
     SUBMIT HANDLER
  ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/auth/login", {
        mobile: form.mobile,
        password: form.password,
        role: form.role,
      });

      // 🧪 Debug (safe to keep during dev)
      console.log("LOGIN RESPONSE:", res.data);

      // ✅ SAVE AUTH STATE (CORRECT FORMAT)
      const responseData = res.data.data || res.data;
      login({
        token: responseData.token,
        id: responseData.id,
        role: responseData.role,
        employeeRole: responseData.employeeRole,
        uniqueId: responseData.uniqueId,
        username: responseData.username
      });

      // ✅ ROLE-BASED REDIRECT (VALID ROUTES ONLY)
      switch (responseData.role) {
        case "admin":
          navigate("/admin");
          break;
        case "farmer":
          navigate("/farmer");
          break;
        case "buyer":
          navigate("/buyer");
          break;
        case "employee":
          // Handle employee role-based redirection
          if (responseData.employeeRole === "delivery_boy") {
            navigate("/delivery");
          } else if (responseData.employeeRole === "loan_feed_manager") {
            navigate("/loanfeed");
          } else {
            navigate("/employee"); // Default for milk_collector
          }
          break;
        default:
          setError("Invalid role");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err.response?.data || err.message);
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
          "Login failed. Please check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-cyan-100 to-blue-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Circles */}
      <div className="absolute inset-0">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-80 h-80 bg-blue-300/20 rounded-full top-1/4 -right-40 animate-bounce" style={{animationDuration: '3s'}}></div>
        <div className="absolute w-64 h-64 bg-cyan-200/15 rounded-full bottom-1/4 left-1/4 animate-ping" style={{animationDuration: '4s'}}></div>
        <div className="absolute w-72 h-72 bg-white/8 rounded-full -bottom-36 -right-36 animate-pulse" style={{animationDuration: '2s'}}></div>
      </div>

      {/* Floating Animated Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{animationDelay: '0s', animationDuration: '2s'}}>🐄</div>
        <div className="absolute top-20 right-20 text-4xl animate-pulse" style={{animationDelay: '1s', animationDuration: '3s'}}>🥛</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-bounce" style={{animationDelay: '2s', animationDuration: '2.5s'}}>🌾</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-pulse" style={{animationDelay: '0.5s', animationDuration: '2.8s'}}>🚜</div>
        <div className="absolute top-1/2 left-1/4 text-3xl animate-bounce" style={{animationDelay: '1.5s', animationDuration: '3.2s'}}>🐄</div>
        <div className="absolute top-1/3 right-1/3 text-4xl animate-pulse" style={{animationDelay: '2.5s', animationDuration: '2.2s'}}>🥛</div>
      </div>

      {/* Moving Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" style={{animationDuration: '4s'}}></div>

      <div className="w-full max-w-md relative">
        {/* Main Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 text-center relative">
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
              <div className="bg-white/20 rounded-full p-3 animate-pulse" style={{animationDuration: '2s'}}>
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
            <p className="text-blue-100 text-sm">Sign in to your dairy account</p>
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
                  className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                👤 Select Your Role
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                <option value="">Choose your role...</option>
                <option value="admin">🔧 Admin - System Administrator</option>
                <option value="farmer">🚜 Farmer - Milk Producer</option>
                <option value="buyer">🛒 Buyer - Milk Consumer</option>
                <option value="employee">👨‍💼 Employee - Dairy Staff</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </div>
              ) : (
                "🚀 Sign In to Dairy"
              )}
            </button>

            {/* Links */}
            <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200">
              <Link 
                to="/forgot-password" 
                className="text-center text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                🔑 Forgot your password?
              </Link>
              
              <div className="text-center">
                <span className="text-sm text-gray-600">New to our dairy? </span>
                <Link 
                  to="/register" 
                  className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors duration-200"
                >
                  🌟 Create Account
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
        <div className="absolute -top-6 -right-6 bg-white/90 rounded-full p-3 shadow-lg animate-bounce" style={{animationDuration: '2s'}}>
          <span className="text-2xl">🥛</span>
        </div>
        <div className="absolute -bottom-6 -left-6 bg-white/90 rounded-full p-3 shadow-lg animate-pulse" style={{animationDuration: '3s'}}>
          <span className="text-2xl">🐄</span>
        </div>
      </div>
    </div>
  );
}
