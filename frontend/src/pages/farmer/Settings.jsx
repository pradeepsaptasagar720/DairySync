export default function Settings() {
  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-xl">
      <h2 className="text-lg font-semibold mb-4">Account Settings</h2>

      <input
        type="password"
        className="w-full border p-2 rounded mb-3"
        placeholder="New Password"
      />

      <button className="bg-green-600 text-white w-full py-2 rounded">
        Update Password
      </button>
    </div>
  );
}
