import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { resolveWorkbookAdapter } from "../lib/adapters/host";
import { useSessionStore } from "../state/sessionStore";

export function OnboardingPage() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const provider = useSessionStore((state) => state.provider);
  const navigate = useNavigate();
  const [adapterLabel, setAdapterLabel] = useState("Resolving host…");

  useEffect(() => {
    let cancelled = false;

    void resolveWorkbookAdapter()
      .then((adapter) => {
        if (!cancelled) {
          setAdapterLabel(`${adapter.label} (${adapter.kind})`);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAdapterLabel(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!provider.model || !provider.baseUrl) {
    return <Navigate replace to="/auth/login" />;
  }

  return (
    <main className="route-shell">
      <section className="hero-card slim-card">
        <p className="eyebrow">Boot flow parity</p>
        <h1>Prototype host initialization</h1>
        <p className="lead">
          The original add-in gates users through auth, terms, and onboarding before opening the
          main workbench. This rebuild keeps the same route shape, but replaces OAuth with local
          provider config and targets the Excel Office.js host only.
        </p>
        <dl className="facts-grid">
          <div>
            <dt>Provider</dt>
            <dd>{provider.model}</dd>
          </div>
          <div>
            <dt>Endpoint</dt>
            <dd>{provider.baseUrl}</dd>
          </div>
          <div>
            <dt>Workbook runtime</dt>
            <dd>{adapterLabel}</dd>
          </div>
          <div>
            <dt>Surface</dt>
            <dd>Excel-first taskpane clone</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => {
            completeOnboarding();
            navigate("/app");
          }}
        >
          Launch workbench
        </button>
      </section>
    </main>
  );
}
