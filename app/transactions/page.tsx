import { AppShell } from "@/components/app-shell";
import { ManualTransactions } from "@/components/manual-transactions";

export default function TransactionsPage() {
  return (
    <AppShell>
      <ManualTransactions />
    </AppShell>
  );
}
