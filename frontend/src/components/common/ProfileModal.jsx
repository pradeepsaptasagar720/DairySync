import { useState, useEffect } from "react";
import { User, X, Eye, EyeOff, Phone, Mail, MapPin, Shield, Trash2, AlertTriangle, DollarSign, TrendingUp, Calendar, CheckCircle, Clock, Briefcase, ArrowUp, ArrowDown } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    mobile: "",
    address: "",
    role: "",
    uniqueId: "",
    approved: false,
    createdAt: "",
    updatedAt: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isOpen) {
      // Fetch fresh profile data when modal opens
      const fetchProfileData = async () => {
        try {
          const response = await api.get("/api/auth/profile");
          if (response.data.success) {
            const userData = response.data.data;
            setProfileData({
              username: userData.username || "",
              email: userData.email || "",
              mobile: userData.mobile || "",
              address: userData.address || "",
              role: userData.role || "",
              uniqueId: userData.uniqueId || "",
              approved: userData.approved || false,
              createdAt: userData.createdAt || "",
              updatedAt: userData.updatedAt || ""
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          // Fallback to user data from context if API fails
          if (user) {
            setProfileData({
              username: user.username || "",
              email: user.email || "",
              mobile: user.mobile || "",
              address: user.address || "",
              role: user.role || "",
              uniqueId: user.uniqueId || "",
              approved: user.approved || false,
              createdAt: user.createdAt || "",
              updatedAt: user.updatedAt || ""
            });
          }
        }
      };

      fetchProfileData();
    }
  }, [isOpen, user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.put("/api/auth/profile", {
        username: profileData.username,
        email: profileData.email,
        address: profileData.address
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error?.message || "Failed to update profile" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      setLoading(false);
      return;
    }

    try {
      const response = await api.put("/api/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error?.message || "Failed to change password" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: "error", text: "Please enter your password to confirm account deletion" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.delete("/api/auth/delete-account", {
        data: { password: deletePassword }
      });

      if (response.data.success) {
        setMessage({ type: "success", text: "Account deleted successfully. You will be logged out." });
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error?.message || "Failed to delete account" 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Check if user is admin
  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";

  const fetchSalaryData = async () => {
    if (!isEmployee) return;
    setSalaryLoading(true);
    try {
      const response = await api.get("/api/employee-salary/my-salary");
      console.log("Salary API response:", response.data);
      if (response.data.success) {
        setSalaryData(response.data.data);
      } else {
        // Set empty data structure so the tab renders
        setSalaryData({
          assignedSalary: null,
          currentMonthPayment: 0,
          currentMonthStatus: 'not_paid',
          totalPaid: 0,
          payments: [],
          monthlyData: []
        });
      }
    } catch (error) {
      console.error("Error fetching salary data:", error.response?.status, error.response?.data);
      // Set empty data so tab renders with "no salary assigned" message
      setSalaryData({
        assignedSalary: null,
        currentMonthPayment: 0,
        currentMonthStatus: 'not_paid',
        totalPaid: 0,
        payments: [],
        monthlyData: []
      });
    } finally {
      setSalaryLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="text-blue-600" size={28} />
            Profile Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Change Password
          </button>
          {!isAdmin && (
            <button
              onClick={() => setActiveTab("delete")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "delete"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Delete Account
            </button>
          )}
          {isEmployee && (
            <button
              onClick={() => { setActiveTab("salary"); fetchSalaryData(); }}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "salary"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Salary Details
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message Display */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === "success" 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-red-100 text-red-700 border border-red-200"
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Account Status - Different for Admin vs Others */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="text-blue-600" size={20} />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <span className="ml-2 font-medium capitalize">{profileData.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Unique ID:</span>
                    <span className="ml-2 font-medium">{profileData.uniqueId || "Not assigned"}</span>
                  </div>
                  {isAdmin && (
                    <>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 font-medium ${
                          profileData.approved ? "text-green-600" : "text-orange-600"
                        }`}>
                          {profileData.approved ? "Approved" : "Pending Approval"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Member Since:</span>
                        <span className="ml-2 font-medium">{formatDate(profileData.createdAt)}</span>
                      </div>
                    </>
                  )}
                  {!isAdmin && (
                    <div>
                      <span className="text-gray-600">Approved On:</span>
                      <span className="ml-2 font-medium">{formatDate(profileData.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline mr-1" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={isAdmin ? (e) => setProfileData({...profileData, username: e.target.value}) : undefined}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      !isAdmin ? "bg-gray-100" : ""
                    }`}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Username cannot be changed" : ""}
                    required={isAdmin}
                  />
                  {!isAdmin && <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-1" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.mobile}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                    disabled
                    title="Mobile number cannot be changed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mobile number cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Address
                  </label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                    placeholder="Enter your address..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Profile"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </form>
          )}

          {/* Salary Details Tab - Only for employees */}
          {activeTab === "salary" && isEmployee && (
            <div className="space-y-4">
              {salaryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                </div>
              ) : salaryData ? (
                <>
                  {/* Assigned Salary Structure */}
                  {salaryData.assignedSalary ? (
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Briefcase size={14} className="text-blue-600" />
                        Assigned Salary Structure
                        <span className="ml-auto text-xs text-gray-400 capitalize bg-white px-2 py-0.5 rounded-full border">
                          {salaryData.assignedSalary.paymentType}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Base Salary</span>
                          <span className="font-semibold text-gray-800">₹{salaryData.assignedSalary.baseSalary.toLocaleString('en-IN')}</span>
                        </div>
                        {salaryData.assignedSalary.allowances.length > 0 && (
                          <>
                            {salaryData.assignedSalary.allowances.map((a, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-green-600 flex items-center gap-1">
                                  <ArrowUp size={11} /> {a.name}
                                  {a.calculationMethod === 'percentage' && <span className="text-xs text-gray-400">({a.percentage}%)</span>}
                                </span>
                                <span className="text-green-700 font-medium">+₹{a.amount.toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </>
                        )}
                        {salaryData.assignedSalary.deductions.length > 0 && (
                          <>
                            {salaryData.assignedSalary.deductions.map((d, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-red-500 flex items-center gap-1">
                                  <ArrowDown size={11} /> {d.name}
                                  {d.calculationMethod === 'percentage' && <span className="text-xs text-gray-400">({d.percentage}%)</span>}
                                </span>
                                <span className="text-red-600 font-medium">-₹{d.amount.toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="border-t border-blue-100 pt-2 mt-1 flex justify-between text-sm font-bold">
                          <span className="text-gray-700">Net Salary</span>
                          <span className="text-blue-700 text-base">₹{salaryData.assignedSalary.netSalary.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700 text-center">
                      No salary structure assigned yet. Contact admin.
                    </div>
                  )}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={14} className="text-green-600" />
                        <span className="text-xs font-semibold text-green-700">This Month</span>
                      </div>
                      <div className="text-xl font-bold text-green-700">
                        ₹{(salaryData.currentMonthPayment || 0).toLocaleString('en-IN')}
                      </div>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        salaryData.currentMonthStatus === 'completed' ? 'text-green-600' : 'text-orange-500'
                      }`}>
                        {salaryData.currentMonthStatus === 'completed'
                          ? <><CheckCircle size={11} /> Paid</>
                          : <><Clock size={11} /> {salaryData.currentMonthStatus === 'not_paid' ? 'Not Paid Yet' : 'Pending'}</>
                        }
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-blue-600" />
                        <span className="text-xs font-semibold text-blue-700">Total Earned</span>
                      </div>
                      <div className="text-xl font-bold text-blue-700">
                        ₹{(salaryData.totalPaid || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-blue-500 mt-1">All time</div>
                    </div>
                  </div>

                  {/* Monthly Trend */}
                  {salaryData.monthlyData && salaryData.monthlyData.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar size={14} />
                        Last 6 Months
                      </h4>
                      <div className="flex items-end gap-2 h-16">
                        {salaryData.monthlyData.map((m, i) => {
                          const max = Math.max(...salaryData.monthlyData.map(x => x.amount), 1);
                          const height = m.amount > 0 ? Math.max((m.amount / max) * 100, 8) : 4;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className={`w-full rounded-t-md transition-all ${m.amount > 0 ? 'bg-green-400' : 'bg-gray-200'}`}
                                style={{ height: `${height}%` }}
                                title={`₹${m.amount.toLocaleString('en-IN')}`}
                              />
                              <span className="text-xs text-gray-500">{m.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
                    {salaryData.payments && salaryData.payments.length > 0 ? (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {salaryData.payments.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {new Date(p.paymentDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">{p.paymentMethod?.replace('_', ' ')}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-700">₹{(p.netPay || 0).toLocaleString('en-IN')}</div>
                              <div className={`text-xs ${p.status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>
                                {p.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-5 text-sm bg-gray-50 rounded-xl">
                        No payment records yet
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-10 text-sm">
                  No salary data available
                </div>
              )}
            </div>
          )}

          {/* Delete Account Tab - Only for non-admin users */}
          {activeTab === "delete" && !isAdmin && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  <h3 className="font-semibold text-red-800">Danger Zone</h3>
                </div>
                <p className="text-red-700 text-sm">
                  Once you delete your account, there is no going back. This action cannot be undone.
                  All your data including orders, history, and profile information will be permanently deleted.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete My Account
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800 text-sm font-medium">
                      Are you absolutely sure? This action cannot be undone.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter your password to confirm account deletion
                    </label>
                    <div className="relative">
                      <input
                        type={showDeletePassword ? "text" : "password"}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showDeletePassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword("");
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading || !deletePassword}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={20} />
                          Yes, Delete Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}