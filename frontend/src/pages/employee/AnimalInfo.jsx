import { useState, useEffect } from "react";
import api from "../../services/api";

export default function AnimalInfo() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      const res = await api.get("/api/employee/animals");
      setAnimals(res.data.data || []);
    } catch (err) {
      console.error("Error fetching animals:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnimals = animals.filter(animal => {
    if (filter === "all") return true;
    return animal.animalType === filter;
  });

  const getHealthStatusColor = (status) => {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800";
      case "sick": return "bg-red-100 text-red-800";
      case "pregnant": return "bg-blue-100 text-blue-800";
      case "dry": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading animal information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">🐄 Animal Information</h1>
        <p className="text-green-100">View all animals registered by farmers</p>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "all" 
                ? "bg-green-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Animals ({animals.length})
          </button>
          <button
            onClick={() => setFilter("cow")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "cow" 
                ? "bg-green-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🐄 Cows ({animals.filter(a => a.animalType === "cow").length})
          </button>
          <button
            onClick={() => setFilter("buffalo")}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === "buffalo" 
                ? "bg-green-600 text-white" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🐃 Buffaloes ({animals.filter(a => a.animalType === "buffalo").length})
          </button>
        </div>
      </div>

      {/* Animals Grid */}
      {filteredAnimals.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">🐄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Animals Found</h2>
          <p className="text-gray-600">
            {filter === "all" 
              ? "No animals have been registered by farmers yet." 
              : `No ${filter}s have been registered yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <div key={animal._id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {animal.animalType === "cow" ? "🐄" : "🐃"}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Tag: {animal.tagNumber}</h3>
                    <p className="text-sm text-gray-600">{animal.breed}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(animal.healthStatus)}`}>
                  {animal.healthStatus}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Farmer:</span>
                  <span className="font-medium">{animal.farmer?.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{animal.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{animal.weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Milk Capacity:</span>
                  <span className="font-medium">{animal.milkCapacity} L/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Price:</span>
                  <span className="font-medium">₹{(animal.purchasePrice || 0).toLocaleString()}</span>
                </div>
                {animal.lastVaccination && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Vaccination:</span>
                    <span className="font-medium">
                      {new Date(animal.lastVaccination).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {animal.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{animal.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}