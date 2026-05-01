import { useState, useEffect } from "react";
import { adminService } from "../../services/admin.service";
import api from "../../services/api";

export default function EmployeeHiring() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewInfoModal, setShowViewInfoModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(true);
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    mobile: '',
    email: '',
    employeeRole: 'milk_collector',
    address: '',
    education: '',
    password: '',
    salary: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/employees');
      setEmployees(response.data.data.employees || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      // Fallback to old API if new one fails
      try {
        const response = await adminService.getComprehensiveUserData({ role: "employee" });
        setEmployees(response.data.users || []);
      } catch (fallbackErr) {
        setError(fallbackErr.response?.data?.error?.message || fallbackErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHireEmployee = async (e) => {
    e.preventDefault();
    
    // Validate mobile number
    if (!/^\d{10}$/.test(newEmployee.mobile)) {
      alert('Mobile number must be exactly 10 digits');
      return;
    }
    
    // Validate password strength
    if (newEmployee.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newEmployee.password)) {
      alert('Password must contain at least one letter, one number, and one special character (@$!%*?&)');
      return;
    }
    
    // Check for existing mobile number before submitting
    const existingEmployee = employees.find(emp => emp.mobile === newEmployee.mobile);
    if (existingEmployee) {
      alert(`This mobile number is already registered!\n\nEmployee: ${existingEmployee.username}\nStatus: ${existingEmployee.isActive !== false ? 'Active' : 'Inactive'}\nRole: ${existingEmployee.employeeRole}\n\nPlease use a different mobile number.`);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/api/admin/employees', newEmployee);
      
      const data = response.data;
      alert(`Employee hired successfully!\n\nLogin Credentials:\nMobile: ${data.data.credentials.mobile}\nPassword: ${data.data.credentials.password}\n\n${data.data.credentials.loginInstructions}`);
      setShowHireModal(false);
      setNewEmployee({
        username: '',
        mobile: '',
        email: '',
        employeeRole: 'milk_collector',
        address: '',
        education: '',
        password: '',
        salary: ''
      });
      fetchEmployees();
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      if (err.response?.data?.error?.code === 'MOBILE_EXISTS') {
        alert(`Mobile Number Already Registered!\n\n${errorMessage}`);
      } else if (err.response?.data?.error?.code === 'WEAK_PASSWORD' || 
                 err.response?.data?.error?.code === 'INVALID_PASSWORD_FORMAT') {
        alert(`Password Error!\n\n${errorMessage}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      await api.delete(`/api/admin/employees/${employeeId}`);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    }
  };

  const handleEditEmployee = async (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    if (employee) {
      setEditingEmployee({
        id: employee._id,
        username: employee.username,
        mobile: employee.mobile,
        email: employee.email || '',
        employeeRole: employee.employeeRole,
        address: employee.address || '',
        education: employee.education || '',
        salary: employee.salary || ''
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/api/admin/employees/${editingEmployee.id}`, {
        username: editingEmployee.username,
        email: editingEmployee.email,
        employeeRole: editingEmployee.employeeRole,
        address: editingEmployee.address,
        education: editingEmployee.education,
        salary: editingEmployee.salary
      });
      
      alert('Employee updated successfully!');
      setShowEditModal(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmployeeInfo = async (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    if (employee) {
      setViewingEmployee(employee);
      setShowViewInfoModal(true);
    }
  };

  const handleReactivateEmployee = async (employeeId) => {
    if (!confirm('Are you sure you want to reactivate this employee?')) return;
    
    try {
      await api.patch(`/api/admin/employees/${employeeId}/reactivate`);
      alert('Employee reactivated successfully!');
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    }
  };

  // Filter employees based on role, status, and search term
  const filteredActiveEmployees = employees.filter(employee => {
    const isActive = employee.isActive !== false;
    const matchesRole = filterRole === 'all' || employee.employeeRole === filterRole;
    const matchesSearch = searchTerm === '' || 
      employee.mobile.includes(searchTerm) ||
      employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return isActive && matchesRole && matchesSearch;
  });

  const filteredInactiveEmployees = employees.filter(employee => {
    const isInactive = employee.isActive === false;
    const matchesRole = filterRole === 'all' || employee.employeeRole === filterRole;
    const matchesSearch = searchTerm === '' || 
      employee.mobile.includes(searchTerm) ||
      employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return isInactive && matchesRole && matchesSearch;
  });

  // Calculate statistics (only active employees)
  const stats = {
    milkCollection: employees.filter(emp => emp.employeeRole === 'milk_collector' && emp.isActive !== false).length,
    milkDelivery: employees.filter(emp => emp.employeeRole === 'delivery_boy' && emp.isActive !== false).length,
    loanAndFeedManager: employees.filter(emp => emp.employeeRole === 'loan_feed_manager' && emp.isActive !== false).length,
    total: employees.filter(emp => emp.isActive !== false).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
    <div className="space-y-6">
      {/* Orange Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Employee Hiring & Management</h1>
          <p className="text-orange-100 mt-1">Hire new staff and manage existing employees</p>
        </div>
        <div className="text-6xl opacity-20">
          👥
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Milk Collectors</p>
              <p className="text-3xl font-bold text-gray-900">{stats.milkCollection}</p>
              <p className="text-xs text-gray-500">Collection team members</p>
            </div>
            <div className="text-4xl">🥛</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivery Partners</p>
              <p className="text-3xl font-bold text-gray-900">{stats.milkDelivery}</p>
              <p className="text-xs text-gray-500">Delivery team members</p>
            </div>
            <div className="text-4xl">🚚</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Loan & Feed Managers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.loanAndFeedManager}</p>
              <p className="text-xs text-gray-500">Financial & feed specialists</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">All roles combined</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Employee List Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Employee List</h2>
            <button
              onClick={() => setShowHireModal(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Hire New Employee
            </button>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Mobile/Name</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter mobile number or name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-64"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Roles</option>
                <option value="milk_collector">Milk Collection</option>
                <option value="delivery_boy">Milk Delivery</option>
                <option value="loan_feed_manager">Loan & Feed Manager</option>
              </select>
            </div>

            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto">
          {filteredActiveEmployees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No active employees found</p>
              <p>No active employees match your current search or filters.</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredActiveEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              {employee.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.username}</div>
                          <div className="text-sm text-gray-500">{employee.uniqueId || 'EMP001'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.employeeRole === 'milk_collector' ? 'bg-blue-100 text-blue-800' :
                        employee.employeeRole === 'delivery_boy' ? 'bg-green-100 text-green-800' :
                        employee.employeeRole === 'loan_feed_manager' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.employeeRole === 'milk_collector' ? 'Milk Collection' :
                         employee.employeeRole === 'delivery_boy' ? 'Milk Delivery' :
                         employee.employeeRole === 'loan_feed_manager' ? 'Loan & Feed Manager' : 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.email || employee.mobile}</div>
                      <div className="text-sm text-gray-500">{employee.mobile}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.education || 'Not specified'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.salary ? `₹${employee.salary.toLocaleString()}` : 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(employee.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEmployee(employee._id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Employee"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleViewEmployeeInfo(employee._id)}
                          className="text-green-600 hover:text-green-900"
                          title="View Info"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Employee"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inactive Employees Section */}
      {filteredInactiveEmployees.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-red-600">Inactive Employees ({filteredInactiveEmployees.length})</h2>
              <button
                onClick={() => setShowInactiveEmployees(!showInactiveEmployees)}
                className="text-gray-600 hover:text-gray-800"
              >
                {showInactiveEmployees ? '🔼 Hide' : '🔽 Show'}
              </button>
            </div>
          </div>

          {showInactiveEmployees && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Education
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Deleted Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInactiveEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-red-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-red-600">
                                {employee.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.username}</div>
                            <div className="text-sm text-gray-500">{employee.uniqueId || 'EMP001'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.employeeRole === 'milk_collector' ? 'bg-blue-100 text-blue-800' :
                          employee.employeeRole === 'delivery_boy' ? 'bg-green-100 text-green-800' :
                          employee.employeeRole === 'loan_feed_manager' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {employee.employeeRole === 'milk_collector' ? 'Milk Collection' :
                           employee.employeeRole === 'delivery_boy' ? 'Milk Delivery' :
                           employee.employeeRole === 'loan_feed_manager' ? 'Loan & Feed Manager' : 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.email || employee.mobile}</div>
                        <div className="text-sm text-gray-500">{employee.mobile}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.education || 'Not specified'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.salary ? `₹${employee.salary.toLocaleString()}` : 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.deletedAt ? new Date(employee.deletedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewEmployeeInfo(employee._id)}
                            className="text-green-600 hover:text-green-900"
                            title="View Info"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleReactivateEmployee(employee._id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Make Active"
                          >
                            ✅
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hire Employee Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Hire New Employee</h3>
                <button
                  onClick={() => setShowHireModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleHireEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newEmployee.username}
                    onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newEmployee.mobile}
                    onChange={(e) => setNewEmployee({...newEmployee, mobile: e.target.value.replace(/\D/g, '')})}
                    placeholder="Enter 10-digit mobile number"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">This will be used as login credential</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    value={newEmployee.employeeRole}
                    onChange={(e) => setNewEmployee({...newEmployee, employeeRole: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="milk_collector">Milk Collection</option>
                    <option value="delivery_boy">Milk Delivery</option>
                    <option value="loan_feed_manager">Loan & Feed Manager</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Education</label>
                  <input
                    type="text"
                    value={newEmployee.education}
                    onChange={(e) => setNewEmployee({...newEmployee, education: e.target.value})}
                    placeholder="e.g., 10th Pass, 12th Pass, Graduate"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newEmployee.salary}
                    onChange={(e) => setNewEmployee({...newEmployee, salary: e.target.value})}
                    placeholder="Enter monthly salary amount"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={newEmployee.address}
                    onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newEmployee.password}
                    onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
                    placeholder="Enter secure password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 8 characters with letters, numbers, and special characters (@$!%*?&)
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHireModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? 'Hiring...' : 'Hire Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Employee</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateEmployee} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.username}
                    onChange={(e) => setEditingEmployee({...editingEmployee, username: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <input
                    type="tel"
                    disabled
                    value={editingEmployee.mobile}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Mobile number cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editingEmployee.email}
                    onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    value={editingEmployee.employeeRole}
                    onChange={(e) => setEditingEmployee({...editingEmployee, employeeRole: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="milk_collector">Milk Collection</option>
                    <option value="delivery_boy">Milk Delivery</option>
                    <option value="loan_feed_manager">Loan & Feed Manager</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Education</label>
                  <input
                    type="text"
                    value={editingEmployee.education}
                    onChange={(e) => setEditingEmployee({...editingEmployee, education: e.target.value})}
                    placeholder="e.g., 10th Pass, 12th Pass, Graduate"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salary *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingEmployee.salary}
                    onChange={(e) => setEditingEmployee({...editingEmployee, salary: e.target.value})}
                    placeholder="Enter monthly salary amount"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={editingEmployee.address}
                    onChange={(e) => setEditingEmployee({...editingEmployee, address: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingEmployee(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Info Modal */}
      {showViewInfoModal && viewingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Employee Information</h3>
                <button
                  onClick={() => {
                    setShowViewInfoModal(false);
                    setViewingEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-orange-600">
                      {viewingEmployee.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">{viewingEmployee.username}</h4>
                  <p className="text-sm text-gray-500">{viewingEmployee.uniqueId || 'EMP001'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingEmployee.mobile}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingEmployee.email || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingEmployee.employeeRole === 'milk_collector' ? 'bg-blue-100 text-blue-800' :
                      viewingEmployee.employeeRole === 'delivery_boy' ? 'bg-green-100 text-green-800' :
                      viewingEmployee.employeeRole === 'loan_feed_manager' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingEmployee.employeeRole === 'milk_collector' ? 'Milk Collection' :
                       viewingEmployee.employeeRole === 'delivery_boy' ? 'Milk Delivery' :
                       viewingEmployee.employeeRole === 'loan_feed_manager' ? 'Loan & Feed Manager' : 'General'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingEmployee.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {viewingEmployee.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Education</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingEmployee.education || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Salary</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {viewingEmployee.salary ? `₹${viewingEmployee.salary.toLocaleString()}` : 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingEmployee.address || 'Not provided'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(viewingEmployee.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {viewingEmployee.deletedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Deleted Date</label>
                      <p className="mt-1 text-sm text-red-600">
                        {new Date(viewingEmployee.deletedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setShowViewInfoModal(false);
                      setViewingEmployee(null);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
