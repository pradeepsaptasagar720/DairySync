import DashboardLayout from "../../components/layout/DashboardLayout";

export default function Reports() {
  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Reports</h2>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded mr-3">
          Download PDF
        </button>
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Export CSV
        </button>
      </div>
    </DashboardLayout>
  );
}
