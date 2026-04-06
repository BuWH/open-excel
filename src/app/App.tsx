import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "../routes/LoginPage";
import { OnboardingPage } from "../routes/OnboardingPage";
import { RootGate } from "../routes/RootGate";
import { TermsPage } from "../routes/TermsPage";
import { WorkbenchPage } from "../routes/WorkbenchPage";

export function App() {
  const initialEntry = typeof window === "undefined" ? "/" : window.location.pathname || "/";

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<RootGate />} path="/" />
        <Route element={<LoginPage />} path="/auth/login" />
        <Route element={<TermsPage />} path="/terms" />
        <Route element={<OnboardingPage />} path="/onboarding" />
        <Route element={<WorkbenchPage />} path="/app" />
      </Routes>
    </MemoryRouter>
  );
}
