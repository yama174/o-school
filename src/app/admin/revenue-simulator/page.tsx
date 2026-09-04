import { PageHeader } from "@/components/ui";
import { RevenueSimulator } from "@/components/admin/RevenueSimulator";

export default function AdminRevenueSimulatorPage() {
  return (
    <div>
      <PageHeader
        title="収益シミュレーター"
        description="ユーザー数・訪問頻度・広告条件から、想定される広告収益を試算します(実際の数値ではなく試算です)。"
      />
      <RevenueSimulator />
    </div>
  );
}
