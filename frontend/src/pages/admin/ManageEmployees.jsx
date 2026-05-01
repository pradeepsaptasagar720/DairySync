import { useState, useEffect } from "react";
import { adminService } from "../../services/admin.service";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All Roles");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [showHireModal, setShowHireModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState(null);

  // Employee hiring form state
  const [hireForm, setHireForm] = useState({
    username: "",
    mobile: "",
    email: "",
    address: "",
    employeeRole: ""
  });
  const [hireLoading, setHireLoading] = useState(false);
  const [hireError, setHireError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/employees", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      
      const data = await response.json();
      setEmployees(data.data.employees || []);
    } catch (err) {
      setError(err.message);
      try {
        const response = await adminService.getComprehensiveUserData({ role: "employee" });
        setEmployees(response.data.users || []);
      } catch (fallbackErr) {
        setError(fallbackErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHireEmployee = async (e) => {
    e.preventDefault();
    setHireError("");

    if (!/^\d{10}$/.test(hireForm.mobile)) {
      setHireError("Mobile number must be exactly 10 digits");
      return;
    }

    setHireLoading(true);

    try {
      const response = await fetch("/api/admin/employees", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(hireForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create employee");
      }

      setNewEmployeeCredentials(data.data);
      setShowCredentialsModal(true);
      setShowHireModal(false);
      
      setHireForm({
        username: "",
        mobile: "",
        email: "",
        address: "",
        employeeRole: ""
      });

      fetchEmployees();
    } catch (err) {
      setHireError(err.message);
    } finally {
      setHireLoading(false);
    }
  };

  const handleToggleStatus = async (employeeId, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to toggle employee status");
      }

      fetchEmployees();
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleResetPassword = async (employeeId) => {
    if (!window.confirm("Are you sure you want to reset this employees password?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}/reset-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to reset password");
      }

      setNewEmployeeCredentials(data.data);
      setShowCredentialsModal(true);
    } catch (err) {
      alert("Failed to reset password: " + err.message);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }

      fetchEmployees();
    } catch (err) {
      alert("Failed to delete employee: " + err.message);
    }
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.mobile?.includes(searchTerm) ||
      employee.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "All Roles" || employee.employeeRole === filterRole;
    const matchesStatus = filterStatus === "All Status" || 
                         (filterStatus === "Active" && employee.isActive) ||
                         (filterStatus === "Inactive" && !employee.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    milkCollection: employees.filter(e => e.employeeRole === "milk_collector").length,
    delivery: employees.filter(e => e.employeeRole === "delivery").length,
    total: employees.length
  };

  const clearFilters = () => {
    setFilterRole("All Roles");
    setFilterStatus("All Status");
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading employees: {error}</p>
        <button 
          onClick={fetchEmployees}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Employee Hiring & Management</h1>
            <p className="text-orange-100 mt-1">Hire new staff and manage existing employees</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-orange-100">Total Employees</div>
            </div>
            <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Milk Collection</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.milkCollection}</p>
              <p className="text-xs text-gray-500">Active & Inactive</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Milk Delivery</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.delivery}</p>
              <p className="text-xs text-gray-500">Active & Inactive</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Employees</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">All roles combined</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Employee List</h2>
            <button
              onClick={() => setShowHireModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Hire New Employee</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="All Roles">All Roles</option>
                <option value="milk_collector">Milk Collection</option>
                <option value="delivery">Milk Delivery</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end space-x-2">
              <button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">No employees found</p>
                      <p className="text-sm">No employees have been hired yet or match your filters.</p>
                      <button
                        onClick={() => setShowHireModal(true)}
                        className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                      >
                        Hire First Employee
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 font-medium text-sm">
                            {employee.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.username}</div>
                          <div className="text-sm text-gray-500">{employee.uniqueId || "No ID"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.employeeRole === "milk_collector" 
                          ? "bg-blue-100 text-blue-800" 
                          : employee.employeeRole === "delivery"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {employee.employeeRole === "milk_collector" ? "Milk Collection" :
                         employee.employeeRole === "delivery" ? "Milk Delivery" :
                         employee.employeeRole || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.mobile}</div>
                      <div className="text-sm text-gray-500">{employee.email || "No email"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleStatus(employee._id, employee.isActive)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Toggle Status"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleResetPassword(employee._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Reset Password"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Employee"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Hire Employee Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Hire New Employee</h2>
                <button
                  onClick={() => {
                    setShowHireModal(false);
                    setHireError("");
                    setHireForm({
                      username: "",
                      mobile: "",
                      email: "",
                      address: "",
                      employeeRole: ""
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {hireError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{hireError}</p>
                </div>
              )}

              <form onSubmit={handleHireEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={hireForm.username}
                    onChange={(e) => setHireForm({...hireForm, username: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter employee full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={hireForm.mobile}
                    onChange={(e) => setHireForm({...hireForm, mobile: e.target.value.replace(/\D/g, "")})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={hireForm.email}
                    onChange={(e) => setHireForm({...hireForm, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="employee@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address (Optional)
                  </label>
                  <textarea
                    value={hireForm.address}
                    onChange={(e) => setHireForm({...hireForm, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Employee address"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Role *
                  </label>
                  <select
                    required
                    value={hireForm.employeeRole}
                    onChange={(e) => setHireForm({...hireForm, employeeRole: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select employee role</option>
                    <option value="milk_collector">Milk Collection</option>
                    <option value="delivery">Milk Delivery</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Important:</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Login credentials will be automatically generated and displayed after creating the employee account. 
                        Please provide these credentials to the employee securely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHireModal(false);
                      setHireError("");
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={hireLoading}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {hireLoading ? "Creating..." : "Hire Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Display Modal */}
      {showCredentialsModal && newEmployeeCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Employee Created Successfully!</h2>
                <p className="text-sm text-gray-600 mt-2">
                  Please provide these login credentials to the employee
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-3">Employee Details:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{newEmployeeCredentials.employee?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unique ID:</span>
                    <span className="font-medium">{newEmployeeCredentials.employee?.uniqueId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium capitalize">
                      {newEmployeeCredentials.employee?.employeeRole?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-yellow-800 mb-3">Login Credentials:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-700">Username:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      {newEmployeeCredentials.credentials?.username}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-700">Password:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      {newEmployeeCredentials.credentials?.password}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-800 font-medium">Security Notice:</p>
                    <p className="text-xs text-red-600 mt-1">
                      These credentials will only be shown once. Please save them securely and provide them to the employee. 
                      The employee will be required to change their password on first login.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setNewEmployeeCredentials(null);
                }}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                I have Saved the Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
