import { ModulePage } from "@/components/shared/module-page";
import { InventoryPage } from "@/components/inventory/inventory-page";

export const metadata = { title: "Finished Stock" };

export default function Page() {
  return (
    <ModulePage
      title="Finished Stock"
      description="Track finished bakery stock, monitor freshness, and manage quantity adjustments"
    >
      <InventoryPage />
    </ModulePage>
  );
}
