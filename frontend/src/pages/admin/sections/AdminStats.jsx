import KpiCard from "../../../components/ui/KpiCard";
import {
  Users,
  UserCheck,
  Truck,
  IndianRupee,
  Droplet,
  AlertCircle,
} from "lucide-react";

export default function AdminStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      <KpiCard title="Farmers" value="128" icon={<Users />} />
      <KpiCard title="Buyers" value="84" icon={<UserCheck />} />
      <KpiCard title="Employees" value="14" icon={<Truck />} />
      <KpiCard title="Milk Collected Today" value="1,420 L" icon={<Droplet />} />
      <KpiCard title="Revenue Today" value="₹86,300" icon={<IndianRupee />} />
      <KpiCard title="Pending Approvals" value="6" icon={<AlertCircle />} />
    </div>
  );
}
