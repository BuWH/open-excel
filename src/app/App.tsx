import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "../routes/LoginPage";
import { OnboardingPage } from "../routes/OnboardingPage";
import { TermsPage } from "../routes/TermsPage";
import { WorkbenchPage } from "../routes/WorkbenchPage";

export function App() {
  return (
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route element={<WorkbenchPage />} path="/app" />
        <Route element={<LoginPage />} path="/auth/login" />
        <Route element={<TermsPage />} path="/terms" />
        <Route element={<OnboardingPage />} path="/onboarding" />
      </Routes>
    </MemoryRouter>
  );
}
