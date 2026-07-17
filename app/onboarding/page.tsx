import { AppShell } from "@/components/app-shell";
import { OnboardingFlow } from "@/components/onboarding-flow";

export default function OnboardingPage() {
  return (
    <AppShell publicAccess>
      <OnboardingFlow />
    </AppShell>
  );
}
