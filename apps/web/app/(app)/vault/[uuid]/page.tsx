import { AppHeader } from "@/components/app/app-header";
import { VaultDetail } from "@/components/app/vault-detail";

export default async function VaultPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return (
    <>
      <AppHeader title="Vault detail" />
      <VaultDetail uuid={Number(uuid)} />
    </>
  );
}
