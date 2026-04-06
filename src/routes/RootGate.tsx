import { Navigate } from "react-router-dom";
import { useSessionStore } from "../state/sessionStore";

export function RootGate() {
  const onboardingCompleted = useSessionStore((state) => state.onboardingCompleted);
  const provider = useSessionStore((state) => state.provider);
  const termsAccepted = useSessionStore((state) => state.termsAccepted);

  if (!provider.model || !provider.baseUrl) {
    return <Navigate replace to="/auth/login" />;
  }

  if (!termsAccepted) {
    return <Navigate replace to="/terms" />;
  }

  if (!onboardingCompleted) {
    return <Navigate replace to="/onboarding" />;
  }

  return <Navigate replace to="/app" />;
}
