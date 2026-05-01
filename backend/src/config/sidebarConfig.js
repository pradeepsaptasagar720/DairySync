export const sidebarConfig = {
  admin: [
    { label: "Overview", path: "/admin" },
    { label: "Manage Farmers", path: "/admin/manage-farmers" },
    { label: "Manage Buyers", path: "/admin/manage-buyers" },
    { label: "Employees", path: "/admin/manage-employees" },
    { label: "Approvals", path: "/admin/approvals" },
    { label: "Analytics", path: "/admin/analytics" },
    { label: "Settings", path: "/admin/settings" },
  ],

  farmer: [
    { label: "Dashboard", path: "/farmer" },
    { label: "Milk Entry", path: "/farmer/milk-entry" },
    { label: "Payments", path: "/farmer/payments" },
  ],

  buyer: [
    { label: "Dashboard", path: "/buyer" },
    { label: "Orders", path: "/buyer/orders" },
    { label: "Invoices", path: "/buyer/invoices" },
  ],

  employee: [
    { label: "Dashboard", path: "/employee" },
    { label: "Attendance", path: "/employee/attendance" },
  ],
};
