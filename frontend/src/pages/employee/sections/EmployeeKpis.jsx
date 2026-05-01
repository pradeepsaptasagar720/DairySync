import KpiCard from "../../../components/ui/KpiCard";
import { Droplet, Truck, IndianRupee, Users } from "lucide-react";

export default function EmployeeKpis() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Milk Collected Today"
        value="860 L"
        icon={<Droplet />}
      />
      <KpiCard
        title="Deliveries Pending"
        value="12"
        icon={<Truck />}
      />
      <KpiCard
        title="COD Collected"
        value="₹18,500"
        icon={<IndianRupee />}
      />
      <KpiCard
        title="Active Farmers"
        value="34"
        icon={<Users />}
      />
    </div>
  );
}
