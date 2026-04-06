import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../state/sessionStore";

export function TermsPage() {
  const acceptTerms = useSessionStore((state) => state.acceptTerms);
  const navigate = useNavigate();

  return (
    <main className="route-shell">
      <section className="hero-card slim-card">
        <p className="eyebrow">Local-only mode</p>
        <h1>Execution constraints</h1>
        <ul className="plain-list">
          <li>Prompts are sent to your configured LLM endpoint.</li>
          <li>Structured workbook tools are implemented only for the Excel Office.js host.</li>
          <li>
            MCP, conductor, third-party auth, telemetry, and Office cross-app features are not
            enabled.
          </li>
          <li>`execute_office_js` is available for Excel-host formatting and layout work.</li>
        </ul>
        <button
          type="button"
          onClick={() => {
            acceptTerms();
            navigate("/onboarding");
          }}
        >
          I understand the current scope
        </button>
      </section>
    </main>
  );
}
