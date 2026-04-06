import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveWorkbookAdapter } from "../lib/adapters/host";
import { useSessionStore } from "../state/sessionStore";

export function OnboardingPage() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const navigate = useNavigate();
  const [adapterLabel, setAdapterLabel] = useState("Resolving host...");

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

  return (
    <main className="route-shell">
      <section className="hero-card slim-card">
        <p className="eyebrow">Host initialization</p>
        <h1>Workbook runtime</h1>
        <dl className="facts-grid">
          <div>
            <dt>Workbook runtime</dt>
            <dd>{adapterLabel}</dd>
          </div>
          <div>
            <dt>Surface</dt>
            <dd>Excel-first taskpane</dd>
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
