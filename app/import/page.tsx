import { AppShell } from "@/components/app-shell";
import { ImportCentre } from "@/components/import-centre";
import { isVerifiedPreviewRuntime } from "@/src/server/preview-runtime";

export default function ImportPage() {
  return (
    <AppShell>
      <ImportCentre importUndoAvailable={isVerifiedPreviewRuntime()} />
    </AppShell>
  );
}
