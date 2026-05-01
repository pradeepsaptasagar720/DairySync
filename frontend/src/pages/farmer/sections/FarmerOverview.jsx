import PageHeader from "../../../components/common/PageHeader";
import DairyTimeStatus from "../../../components/common/DairyTimeStatus";
import FarmerKpis from "./FarmerKpis";
import FarmerCharts from "./FarmerCharts";
import FarmerActivity from "./FarmerActivity";

export default function FarmerOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">Farmer Dashboard</h1>
        <p className="text-green-100">Milk supply, earnings & payment overview</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compact Dairy Time Status */}
        <DairyTimeStatus compact={true} />
        
        {/* KPIs - spans 2 columns */}
        <div className="lg:col-span-2">
          <FarmerKpis />
        </div>
      </div>
      
      <FarmerCharts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FarmerActivity />
      </div>
    </div>
  );
}
