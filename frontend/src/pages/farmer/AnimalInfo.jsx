import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, PawPrint, Calendar, Weight, Milk, Heart, DollarSign, FileText, Search, Filter } from "lucide-react";
import { FarmerService } from "../../services/farmer.service";

export default function AnimalInfo() {
  const [animals, setAnimals] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    tagNumber: "",
    animalType: "cow",
    breed: "",
    age: "",
    weight: "",
    milkCapacity: "",
    healthStatus: "healthy",
    purchaseDate: "",
    purchasePrice: "",
    lastVaccination: "",
    notes: ""
  });

  useEffect(() => {
    fetchAnimals();
    fetchStats();
  }, []);

  const fetchAnimals = async () => {
    try {
      console.log('📡 Fetching animals...');
      const response = await FarmerService.getAnimals();
      console.log('✅ Animals fetched:', response.data);
      setAnimals(response.data.data || []);
    } catch (error) {
      console.error("❌ Error fetching animals:", error);
      console.error("❌ Error response:", error.response?.data);
      
      if (error.response?.status === 401) {
        alert("Authentication failed. Please login again.");
      } else if (error.response?.status === 403) {
        alert("Access denied. Please ensure you have farmer permissions.");
      } else {
        alert("Failed to fetch animals. Please check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching animal stats...');
      const response = await FarmerService.getAnimalStats();
      console.log('✅ Stats fetched:', response.data);
      setStats(response.data.data || {});
    } catch (error) {
      console.error("❌ Error fetching stats:", error);
      console.error("❌ Error response:", error.response?.data);
    }
  };

  const handleAddAnimal = async (e) => {
    e.preventDefault();
    
    // Debug: Log form data
    console.log('🐄 Adding animal with data:', formData);
    
    try {
      // Validate required fields
      const requiredFields = ['tagNumber', 'animalType', 'breed', 'age', 'weight', 'milkCapacity', 'purchaseDate', 'purchasePrice'];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field] === '');
      
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        console.error('❌ Missing required fields:', missingFields);
        return;
      }
      
      console.log('📡 Sending request to add animal...');
      const response = await FarmerService.addAnimal(formData);
      console.log('✅ Animal added successfully:', response.data);
      
      setShowAddModal(false);
      resetForm();
      fetchAnimals();
      fetchStats();
      alert("Animal added successfully!");
    } catch (error) {
      console.error("❌ Error adding animal:", error);
      console.error("❌ Error response:", error.response?.data);
      
      // More detailed error messages
      if (error.response?.status === 401) {
        alert("Authentication failed. Please login again.");
      } else if (error.response?.status === 403) {
        alert("Access denied. Please ensure you have farmer permissions.");
      } else if (error.response?.data?.error?.code === 'TAG_EXISTS') {
        alert("This tag number already exists. Please use a different tag number.");
      } else if (error.response?.data?.error?.code === 'MISSING_FIELDS') {
        alert("Please fill in all required fields.");
      } else {
        alert(error.response?.data?.error?.message || "Failed to add animal. Please check console for details.");
      }
    }
  };

  const handleEditAnimal = async (e) => {
    e.preventDefault();
    try {
      await FarmerService.updateAnimal(editingAnimal._id, formData);
      setShowEditModal(false);
      setEditingAnimal(null);
      resetForm();
      fetchAnimals();
      fetchStats();
      alert("Animal updated successfully!");
    } catch (error) {
      console.error("Error updating animal:", error);
      alert(error.response?.data?.error?.message || "Failed to update animal");
    }
  };

  const handleDeleteAnimal = async (animalId) => {
    if (!confirm("Are you sure you want to delete this animal?")) return;
    
    try {
      await FarmerService.deleteAnimal(animalId);
      fetchAnimals();
      fetchStats();
      alert("Animal deleted successfully!");
    } catch (error) {
      console.error("Error deleting animal:", error);
      alert("Failed to delete animal");
    }
  };

  const openEditModal = (animal) => {
    setEditingAnimal(animal);
    setFormData({
      tagNumber: animal.tagNumber,
      animalType: animal.animalType,
      breed: animal.breed,
      age: animal.age.toString(),
      weight: animal.weight.toString(),
      milkCapacity: animal.milkCapacity.toString(),
      healthStatus: animal.healthStatus,
      purchaseDate: animal.purchaseDate ? new Date(animal.purchaseDate).toISOString().split('T')[0] : "",
      purchasePrice: animal.purchasePrice.toString(),
      lastVaccination: animal.lastVaccination ? new Date(animal.lastVaccination).toISOString().split('T')[0] : "",
      notes: animal.notes || ""
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      tagNumber: "",
      animalType: "cow",
      breed: "",
      age: "",
      weight: "",
      milkCapacity: "",
      healthStatus: "healthy",
      purchaseDate: "",
      purchasePrice: "",
      lastVaccination: "",
      notes: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case "healthy": return "bg-green-100 text-green-800 border-green-200";
      case "sick": return "bg-red-100 text-red-800 border-red-200";
      case "pregnant": return "bg-blue-100 text-blue-800 border-blue-200";
      case "dry": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredAnimals = animals.filter(animal => {
    const matchesFilter = filter === "all" || animal.animalType === filter || animal.healthStatus === filter;
    const matchesSearch = animal.tagNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading animals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <PawPrint size={32} />
              My Animals
            </h1>
            <p className="text-green-100">Manage your livestock information</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Animal
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <PawPrint className="text-blue-600" size={24} />
            <span className="text-gray-600">Total Animals</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAnimals || 0}</div>
          <div className="text-sm text-gray-500">
            🐄 {stats.totalCows || 0} Cows • 🐃 {stats.totalBuffaloes || 0} Buffaloes
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Milk className="text-purple-600" size={24} />
            <span className="text-gray-600">Daily Capacity</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalMilkCapacity || 0}L</div>
          <div className="text-sm text-gray-500">Total milk production</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="text-red-600" size={24} />
            <span className="text-gray-600">Health Status</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.healthyAnimals || 0}</div>
          <div className="text-sm text-gray-500">
            Healthy animals ({stats.sickAnimals || 0} sick)
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-green-600" size={24} />
            <span className="text-gray-600">Investment</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{(stats.totalInvestment || 0).toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total purchase value</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "cow", "buffalo", "healthy", "sick", "pregnant", "dry"].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === filterOption
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filterOption === "all" ? "All Animals" : filterOption}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by tag or breed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Animals Grid */}
      {filteredAnimals.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">🐄</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Animals Found</h2>
          <p className="text-gray-600 mb-4">
            {animals.length === 0 
              ? "Start by adding your first animal to track your livestock."
              : "No animals match your current filter criteria."
            }
          </p>
          {animals.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Add Your First Animal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <div key={animal._id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {animal.animalType === "cow" ? "🐄" : "🐃"}
                  </span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">#{animal.tagNumber}</h3>
                    <p className="text-sm text-gray-600">{animal.breed}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getHealthStatusColor(animal.healthStatus)}`}>
                  {animal.healthStatus}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar size={14} />
                    Age
                  </span>
                  <span className="font-medium">{animal.age} years</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Weight size={14} />
                    Weight
                  </span>
                  <span className="font-medium">{animal.weight} kg</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Milk size={14} />
                    Daily Milk
                  </span>
                  <span className="font-medium">{animal.milkCapacity} L</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign size={14} />
                    Purchase Price
                  </span>
                  <span className="font-medium">₹{animal.purchasePrice.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Purchase Date</span>
                  <span className="font-medium">
                    {new Date(animal.purchaseDate).toLocaleDateString()}
                  </span>
                </div>
                
                {animal.lastVaccination && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Vaccination</span>
                    <span className="font-medium">
                      {new Date(animal.lastVaccination).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {animal.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 flex items-start gap-1">
                    <FileText size={14} className="mt-0.5 flex-shrink-0" />
                    {animal.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(animal)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAnimal(animal._id)}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Animal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New Animal</h2>
                <button
                  onClick={() => {setShowAddModal(false); resetForm();}}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAnimal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag Number *
                    </label>
                    <input
                      type="text"
                      name="tagNumber"
                      value={formData.tagNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., COW001"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Animal Type *
                    </label>
                    <select
                      name="animalType"
                      value={formData.animalType}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="cow">🐄 Cow</option>
                      <option value="buffalo">🐃 Buffalo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Breed *
                    </label>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      placeholder="e.g., Holstein, Jersey, Murrah"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Milk Capacity (L) *
                    </label>
                    <input
                      type="number"
                      name="milkCapacity"
                      value={formData.milkCapacity}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Health Status
                    </label>
                    <select
                      name="healthStatus"
                      value={formData.healthStatus}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="healthy">✅ Healthy</option>
                      <option value="sick">🤒 Sick</option>
                      <option value="pregnant">🤱 Pregnant</option>
                      <option value="dry">🚫 Dry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Vaccination
                    </label>
                    <input
                      type="date"
                      name="lastVaccination"
                      value={formData.lastVaccination}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional notes about the animal..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {setShowAddModal(false); resetForm();}}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Add Animal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Animal Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Animal</h2>
                <button
                  onClick={() => {setShowEditModal(false); setEditingAnimal(null); resetForm();}}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditAnimal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tag Number *
                    </label>
                    <input
                      type="text"
                      name="tagNumber"
                      value={formData.tagNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., COW001"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Animal Type *
                    </label>
                    <select
                      name="animalType"
                      value={formData.animalType}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="cow">🐄 Cow</option>
                      <option value="buffalo">🐃 Buffalo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Breed *
                    </label>
                    <input
                      type="text"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      placeholder="e.g., Holstein, Jersey, Murrah"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Age (Years) *
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Milk Capacity (L) *
                    </label>
                    <input
                      type="number"
                      name="milkCapacity"
                      value={formData.milkCapacity}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Health Status
                    </label>
                    <select
                      name="healthStatus"
                      value={formData.healthStatus}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="healthy">✅ Healthy</option>
                      <option value="sick">🤒 Sick</option>
                      <option value="pregnant">🤱 Pregnant</option>
                      <option value="dry">🚫 Dry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Vaccination
                    </label>
                    <input
                      type="date"
                      name="lastVaccination"
                      value={formData.lastVaccination}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional notes about the animal..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {setShowEditModal(false); setEditingAnimal(null); resetForm();}}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Update Animal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
