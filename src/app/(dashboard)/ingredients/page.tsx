import { ModulePage } from "@/components/shared/module-page";
import { IngredientsPage } from "@/components/ingredients/ingredients-page";

export const metadata = { title: "Raw Ingredients & Supplies | Codeles POS" };

export default function Page() {
  return (
    <ModulePage
      title="Raw Ingredients & Supplies"
      description="Track bakery raw materials, units, weighted-average costing, and reorder levels"
    >
      <IngredientsPage />
    </ModulePage>
  );
}
