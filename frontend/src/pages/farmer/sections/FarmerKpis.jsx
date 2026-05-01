import KpiCard from "../../../components/ui/KpiCard";
import { Droplet, IndianRupee, Calendar, Wallet } from "lucide-react";

export default function FarmerKpis() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard title="Milk Supplied Today" value="48 L" icon={<Droplet />} />
      <KpiCard title="This Month Earnings" value="₹36,800" icon={<IndianRupee />} />
      <KpiCard title="Last Payment" value="₹12,400" icon={<Wallet />} />
      <KpiCard title="Active Days" value="26 Days" icon={<Calendar />} />
    </div>
  );
}
