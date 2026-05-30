"use client";

import { SubscribeButton } from "@cdr-kit/react-ui";
import { DocsMockProvider } from "@/components/docs/providers";

const FIVE_IP = BigInt(5) * BigInt(10) ** BigInt(18);

export function SubscribeButtonDemo() {
  return (
    <DocsMockProvider>
      <SubscribeButton uuid={4200} priceWei={FIVE_IP} priceLabel="5 $IP" />
    </DocsMockProvider>
  );
}
