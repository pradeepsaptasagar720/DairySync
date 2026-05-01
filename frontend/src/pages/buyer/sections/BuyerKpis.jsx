import KpiCard from "../../../components/ui/KpiCard";
import { Droplet, IndianRupee, CreditCard, Truck } from "lucide-react";

export default function BuyerKpis() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Milk Consumed (This Month)"
        value="620 L"
        icon={<Droplet />}
      />
      <KpiCard
        title="Pending Bills"
        value="₹8,400"
        icon={<IndianRupee />}
      />
      <KpiCard
        title="Last Payment"
        value="₹12,500"
        icon={<CreditCard />}
      />
      <KpiCard
        title="Active Delivery Plan"
        value="Daily"
        icon={<Truck />}
      />
    </div>
  );
}
