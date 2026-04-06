import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listLiteLlmModels } from "../lib/litellm/models";
import { getBaseUrlValidationError, normaliseProvider } from "../lib/litellm/provider";
import { defaultProvider, useSessionStore } from "../state/sessionStore";

export function LoginPage() {
  const navigate = useNavigate();
  const provider = useSessionStore((state) => state.provider);
  const setProvider = useSessionStore((state) => state.setProvider);
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl);
  const [apiKey, setApiKey] = useState(provider.apiKey);
  const [model, setModel] = useState(provider.model);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      const validationError = getBaseUrlValidationError(baseUrl);
      if (validationError) {
        setModels([]);
        setError(validationError);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const discovered = await listLiteLlmModels(baseUrl, apiKey);
        if (!cancelled) {
          setModels(discovered);
          if (!model && discovered[0]) {
            setModel(discovered[0]);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, [apiKey, baseUrl, model]);

  return (
    <main className="route-shell">
      <section className="hero-card">
        <p className="eyebrow">Reverse-Engineered Prototype</p>
        <h1>Claude in Excel rebuild</h1>
        <p className="lead">
          This prototype recreates the taskpane boot flow, routed UI shell, workbook tool surface,
          and tool-calling loop, but swaps Anthropic auth for a local LiteLLM endpoint.
        </p>

        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            const nextProvider = normaliseProvider({ apiKey, baseUrl, model });
            const validationError = getBaseUrlValidationError(nextProvider.baseUrl);

            if (validationError) {
              setError(validationError);
              return;
            }

            setProvider(nextProvider);
            navigate("/terms");
          }}
        >
          <label>
            LiteLLM base URL
            <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </label>
          <p className="field-hint">
            Use the default `/api/litellm/v1` path for Excel Online sideload. The dev server proxies
            it to your local LiteLLM upstream.
          </p>
          <label>
            API key
            <input
              placeholder="Optional"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>
          <label>
            Model
            <input
              list="litellm-models"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
            <datalist id="litellm-models">
              {models.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>

          <div className="status-row">
            <span>{loading ? "Discovering models…" : `${models.length} models visible`}</span>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setBaseUrl(defaultProvider.baseUrl);
                setApiKey(defaultProvider.apiKey);
                setModel(defaultProvider.model);
              }}
            >
              Reset defaults
            </button>
          </div>

          {error ? <p className="error-callout">{error}</p> : null}

          <button type="submit">Continue with LiteLLM</button>
        </form>
      </section>
    </main>
  );
}
