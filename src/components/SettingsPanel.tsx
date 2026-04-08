import type { OAuthCredentials } from "@mariozechner/pi-ai";
import { loginGitHubCopilot } from "@mariozechner/pi-ai/oauth";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CustomProviderConfig } from "../lib/provider/config";
import {
  DEFAULT_PROVIDER,
  getBaseUrlValidationError,
  normaliseCustomProvider,
} from "../lib/provider/config";
import { fetchCopilotModels } from "../lib/provider/copilotModels";
import { listProviderModels } from "../lib/provider/models";
import { useSessionStore } from "../state/sessionStore";

type Tab = "custom" | "github-copilot";

type CopilotFlowState =
  | { step: "idle" }
  | { step: "waiting-for-auth"; url: string; userCode: string }
  | { step: "progress"; message: string }
  | { step: "error"; message: string };

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const provider = useSessionStore((s) => s.provider);
  const customConfig = useSessionStore((s) => s.customConfig);
  const copilotCredentials = useSessionStore((s) => s.copilotCredentials);
  const copilotModelId = useSessionStore((s) => s.copilotModelId);
  const setCustomConfig = useSessionStore((s) => s.setCustomConfig);
  const setCopilotCredentials = useSessionStore((s) => s.setCopilotCredentials);
  const setCopilotModel = useSessionStore((s) => s.setCopilotModel);
  const clearCopilotCredentials = useSessionStore((s) => s.clearCopilotCredentials);
  const switchToCustom = useSessionStore((s) => s.switchToCustom);
  const switchToCopilot = useSessionStore((s) => s.switchToCopilot);

  const isCustomActive = provider.type === "custom";
  const isCopilotActive = provider.type === "github-copilot";
  const [tab, setTab] = useState<Tab>(isCopilotActive ? "github-copilot" : "custom");

  return (
    <div className="settings-overlay">
      <div className="settings-overlay-header">
        <h2>Settings</h2>
        <button className="debug-close-btn" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${tab === "custom" ? "settings-tab--active" : ""}`}
          type="button"
          onClick={() => setTab("custom")}
        >
          Custom {isCustomActive && "(active)"}
        </button>
        <button
          className={`settings-tab ${tab === "github-copilot" ? "settings-tab--active" : ""}`}
          type="button"
          onClick={() => setTab("github-copilot")}
        >
          GitHub Copilot {isCopilotActive && "(active)"}
        </button>
      </div>

      {tab === "custom" && (
        <CustomProviderForm
          config={customConfig}
          isActive={isCustomActive}
          onSave={setCustomConfig}
          onActivate={switchToCustom}
        />
      )}

      {tab === "github-copilot" && (
        <CopilotProviderSection
          credentials={copilotCredentials}
          modelId={copilotModelId}
          isActive={isCopilotActive}
          onCredentials={setCopilotCredentials}
          onModelChange={setCopilotModel}
          onActivate={switchToCopilot}
          onDisconnect={clearCopilotCredentials}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Custom provider form                                                */
/* ------------------------------------------------------------------ */

function CustomProviderForm({
  config,
  isActive,
  onSave,
  onActivate,
}: {
  config: CustomProviderConfig;
  isActive: boolean;
  onSave: (config: CustomProviderConfig) => void;
  onActivate: () => void;
}) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState(config.model);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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
        const discovered = await listProviderModels(baseUrl, apiKey);
        if (!cancelled) {
          setModels(discovered);
          if (!model && discovered[0]) setModel(discovered[0]);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadModels();
    return () => {
      cancelled = true;
    };
  }, [apiKey, baseUrl, model]);

  const handleSave = useCallback(() => {
    const next = normaliseCustomProvider({ type: "custom", apiKey, baseUrl, model });
    const validationError = getBaseUrlValidationError(next.baseUrl);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, [apiKey, baseUrl, model, onSave]);

  return (
    <div className="settings-section">
      <div className="stack-form">
        <label>
          Base URL
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </label>
        <p className="field-hint">
          Use `/api/litellm/v1` for Excel Online sideload. The dev server proxies it to your
          upstream.
        </p>

        <label>
          API Key
          <input
            type="password"
            placeholder="Optional"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>

        <label>
          Model
          <input
            list="settings-models"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          <datalist id="settings-models">
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>

        <div className="status-row">
          <span className="field-hint">
            {loading ? "Discovering models..." : `${models.length} models visible`}
          </span>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setBaseUrl(DEFAULT_PROVIDER.baseUrl);
              setApiKey(DEFAULT_PROVIDER.apiKey);
              setModel(DEFAULT_PROVIDER.model);
            }}
          >
            Reset defaults
          </button>
        </div>

        {error && <p className="error-callout">{error}</p>}

        <button type="button" onClick={handleSave}>
          {saved ? "Saved" : "Save & Apply"}
        </button>

        {!isActive && (
          <button className="ghost-button" type="button" onClick={onActivate}>
            Switch to Custom
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GitHub Copilot provider section                                     */
/* ------------------------------------------------------------------ */

function CopilotProviderSection({
  credentials,
  modelId,
  isActive,
  onCredentials,
  onModelChange,
  onActivate,
  onDisconnect,
}: {
  credentials: OAuthCredentials | null;
  modelId: string;
  isActive: boolean;
  onCredentials: (credentials: OAuthCredentials) => void;
  onModelChange: (modelId: string) => void;
  onActivate: () => void;
  onDisconnect: () => void;
}) {
  const isConnected = credentials != null;
  const [flowState, setFlowState] = useState<CopilotFlowState>({ step: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const [copilotModels, setCopilotModels] = useState<Array<{ id: string; name: string }>>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !credentials) return;
    let cancelled = false;
    setModelsLoading(true);
    fetchCopilotModels(credentials.access)
      .then((models) => {
        if (!cancelled) setCopilotModels(models);
      })
      .catch(() => {
        if (!cancelled) setCopilotModels([]);
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isConnected, credentials]);

  const handleLogin = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const creds = await loginGitHubCopilot({
        onAuth: (url, instructions) => {
          const codeMatch = instructions?.match(/Enter code:\s*(\S+)/);
          setFlowState({
            step: "waiting-for-auth",
            url,
            userCode: codeMatch?.[1] ?? instructions ?? "",
          });
        },
        onPrompt: async () => "",
        onProgress: (message) => {
          setFlowState({ step: "progress", message });
        },
        signal: controller.signal,
      });

      onCredentials(creds);
      setFlowState({ step: "idle" });
    } catch (err) {
      if (controller.signal.aborted) {
        setFlowState({ step: "idle" });
        return;
      }
      setFlowState({
        step: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [onCredentials]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setFlowState({ step: "idle" });
  }, []);

  if (isConnected) {
    return (
      <div className="settings-section">
        <div className="settings-status">
          <span className="settings-status-dot settings-status-dot--connected" />
          <span>Connected to GitHub Copilot</span>
        </div>

        <label className="settings-label">
          Model
          <select
            className="settings-select"
            value={modelId}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={modelsLoading}
          >
            {modelsLoading && <option>Loading models...</option>}
            {copilotModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <p className="field-hint">
          {modelsLoading
            ? "Fetching available models..."
            : `${copilotModels.length} models available`}
        </p>

        {!isActive && (
          <button type="button" onClick={onActivate}>
            Use GitHub Copilot
          </button>
        )}

        <button className="ghost-button settings-disconnect" type="button" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="settings-section">
      {flowState.step === "idle" && (
        <>
          <p className="field-hint">
            Sign in with your GitHub account to use Copilot models. Requires an active GitHub
            Copilot subscription.
          </p>
          <button type="button" onClick={handleLogin}>
            Sign in with GitHub
          </button>
        </>
      )}

      {flowState.step === "waiting-for-auth" && (
        <div className="settings-auth-card">
          <p className="settings-auth-label">Open this URL and enter the code:</p>
          <a
            className="settings-auth-url"
            href={flowState.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {flowState.url}
          </a>
          <div className="settings-auth-code">{flowState.userCode}</div>
          <p className="field-hint">Waiting for authorization...</p>
          <button className="settings-cancel-link" type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      )}

      {flowState.step === "progress" && (
        <div className="settings-auth-card">
          <div className="working-indicator">
            <span className="working-indicator-dot" />
            <span>{flowState.message}</span>
          </div>
        </div>
      )}

      {flowState.step === "error" && (
        <div className="settings-auth-card">
          <p className="error-callout">{flowState.message}</p>
          <button type="button" onClick={handleLogin}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
