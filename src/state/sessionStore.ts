import type { OAuthCredentials } from "@mariozechner/pi-ai";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProviderConfig } from "../lib/provider/config";
import { DEFAULT_PROVIDER, normaliseProvider } from "../lib/provider/config";

type SessionState = {
  provider: ProviderConfig;
  termsAccepted: boolean;
  onboardingCompleted: boolean;
  setProvider(provider: ProviderConfig): void;
  setCopilotCredentials(credentials: OAuthCredentials, enterpriseDomain?: string): void;
  setCopilotModel(modelId: string): void;
  acceptTerms(): void;
  completeOnboarding(): void;
  reset(): void;
};

export const defaultProvider = DEFAULT_PROVIDER;

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      provider: DEFAULT_PROVIDER,
      termsAccepted: false,
      onboardingCompleted: false,
      setProvider: (provider) => set({ provider: normaliseProvider(provider) }),
      setCopilotCredentials: (credentials, enterpriseDomain) =>
        set({
          provider: {
            type: "github-copilot",
            modelId: "claude-sonnet-4.5",
            credentials,
            enterpriseDomain,
          },
        }),
      setCopilotModel: (modelId) =>
        set((state) => {
          if (state.provider.type !== "github-copilot") return state;
          return { provider: { ...state.provider, modelId } };
        }),
      acceptTerms: () => set({ termsAccepted: true }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      reset: () =>
        set({
          onboardingCompleted: false,
          provider: DEFAULT_PROVIDER,
          termsAccepted: false,
        }),
    }),
    {
      name: "open-excel",
      version: 6,
      migrate: (persistedState) => {
        const state = persistedState as Partial<SessionState> | undefined;
        const rawProvider = state?.provider as Record<string, unknown> | undefined;

        let provider: ProviderConfig;
        if (rawProvider?.["type"] === "github-copilot") {
          provider = rawProvider as unknown as ProviderConfig;
        } else {
          provider = normaliseProvider({
            type: "custom",
            apiKey: (rawProvider?.["apiKey"] as string) ?? DEFAULT_PROVIDER.apiKey,
            baseUrl: (rawProvider?.["baseUrl"] as string) ?? DEFAULT_PROVIDER.baseUrl,
            model: (rawProvider?.["model"] as string) ?? DEFAULT_PROVIDER.model,
          });
        }

        return {
          onboardingCompleted: state?.onboardingCompleted ?? false,
          provider,
          termsAccepted: state?.termsAccepted ?? false,
        };
      },
    },
  ),
);
