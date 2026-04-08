import type { OAuthCredentials } from "@mariozechner/pi-ai";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CopilotProviderConfig, CustomProviderConfig, ProviderConfig } from "../lib/provider/config";
import { DEFAULT_PROVIDER, normaliseProvider } from "../lib/provider/config";

type SessionState = {
  provider: ProviderConfig;
  customConfig: CustomProviderConfig;
  copilotCredentials: OAuthCredentials | null;
  copilotModelId: string;
  termsAccepted: boolean;
  onboardingCompleted: boolean;
  setProvider(provider: ProviderConfig): void;
  setCustomConfig(config: CustomProviderConfig): void;
  setCopilotCredentials(credentials: OAuthCredentials): void;
  setCopilotModel(modelId: string): void;
  clearCopilotCredentials(): void;
  switchToCustom(): void;
  switchToCopilot(): void;
  acceptTerms(): void;
  completeOnboarding(): void;
  reset(): void;
};

export const defaultProvider = DEFAULT_PROVIDER;

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      provider: DEFAULT_PROVIDER,
      customConfig: DEFAULT_PROVIDER,
      copilotCredentials: null,
      copilotModelId: "claude-sonnet-4.6",
      termsAccepted: false,
      onboardingCompleted: false,
      setProvider: (provider) => set({ provider: normaliseProvider(provider) }),
      setCustomConfig: (config) => {
        set({
          customConfig: config,
          provider: config,
        });
      },
      setCopilotCredentials: (credentials) => {
        const { copilotModelId } = get();
        set({
          copilotCredentials: credentials,
          provider: {
            type: "github-copilot",
            modelId: copilotModelId,
            credentials,
          },
        });
      },
      setCopilotModel: (modelId) => {
        const { copilotCredentials } = get();
        set({
          copilotModelId: modelId,
          provider: {
            type: "github-copilot",
            modelId,
            credentials: copilotCredentials,
          },
        });
      },
      clearCopilotCredentials: () => {
        const { customConfig } = get();
        set({
          copilotCredentials: null,
          provider: customConfig,
        });
      },
      switchToCustom: () => {
        const { customConfig } = get();
        set({ provider: customConfig });
      },
      switchToCopilot: () => {
        const { copilotCredentials, copilotModelId } = get();
        if (!copilotCredentials) return;
        set({
          provider: {
            type: "github-copilot",
            modelId: copilotModelId,
            credentials: copilotCredentials,
          },
        });
      },
      acceptTerms: () => set({ termsAccepted: true }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      reset: () =>
        set({
          onboardingCompleted: false,
          provider: DEFAULT_PROVIDER,
          customConfig: DEFAULT_PROVIDER,
          copilotCredentials: null,
          copilotModelId: "claude-sonnet-4.6",
          termsAccepted: false,
        }),
    }),
    {
      name: "open-excel",
      version: 7,
      migrate: (persistedState) => {
        const state = persistedState as Record<string, unknown> | undefined;
        const rawProvider = state?.["provider"] as Record<string, unknown> | undefined;

        let provider: ProviderConfig;
        let customConfig: CustomProviderConfig = DEFAULT_PROVIDER;
        let copilotCredentials: OAuthCredentials | null =
          (state?.["copilotCredentials"] as OAuthCredentials) ?? null;
        let copilotModelId = (state?.["copilotModelId"] as string) ?? "claude-sonnet-4.6";

        if (rawProvider?.["type"] === "github-copilot") {
          const creds = rawProvider["credentials"] as OAuthCredentials | null;
          const modelId = (rawProvider["modelId"] as string) ?? "claude-sonnet-4.6";
          copilotCredentials = creds ?? copilotCredentials;
          copilotModelId = modelId;
          provider = {
            type: "github-copilot",
            modelId,
            credentials: copilotCredentials,
          } as CopilotProviderConfig;
        } else {
          customConfig = normaliseProvider({
            type: "custom",
            apiKey: (rawProvider?.["apiKey"] as string) ?? DEFAULT_PROVIDER.apiKey,
            baseUrl: (rawProvider?.["baseUrl"] as string) ?? DEFAULT_PROVIDER.baseUrl,
            model: (rawProvider?.["model"] as string) ?? DEFAULT_PROVIDER.model,
          }) as CustomProviderConfig;
          provider = customConfig;
        }

        return {
          onboardingCompleted: (state?.["onboardingCompleted"] as boolean) ?? false,
          provider,
          customConfig,
          copilotCredentials,
          copilotModelId,
          termsAccepted: (state?.["termsAccepted"] as boolean) ?? false,
        };
      },
    },
  ),
);
