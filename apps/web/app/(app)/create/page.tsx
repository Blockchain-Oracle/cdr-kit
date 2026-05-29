import { AppHeader } from "@/components/app/app-header";
import { CreateWizard } from "@/components/app/create-wizard";

export default function CreatePage() {
  return (
    <>
      <AppHeader title="Create vault" />
      <CreateWizard />
    </>
  );
}
