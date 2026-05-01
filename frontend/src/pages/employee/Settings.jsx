import DashboardLayout from "../../components/layout/DashboardLayout";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="bg-white p-6 rounded-xl shadow max-w-md">
        <h2 className="text-xl font-semibold mb-4">Employee Settings</h2>

        <button className="bg-red-600 text-white px-4 py-2 rounded">
          Update Profile
        </button>
      </div>
    </DashboardLayout>
  );
}
