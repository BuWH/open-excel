import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PROVIDER, normaliseProvider } from "../lib/litellm/provider";
import type { ProviderConfig } from "../lib/types/llm";

type SessionState = {
  provider: ProviderConfig;
  termsAccepted: boolean;
  onboardingCompleted: boolean;
  setProvider(provider: ProviderConfig): void;
  acceptTerms(): void;
  completeOnboarding(): void;
  reset(): void;
};

export const defaultProvider = DEFAULT_PROVIDER;

const LEGACY_DEFAULT_MODELS = new Set(["gpt-4.1", "gpt-5.1", "gpt-5.1-mini"]);

function migrateProvider(provider: ProviderConfig | undefined) {
  const nextProvider = normaliseProvider(provider ?? DEFAULT_PROVIDER);

  if (LEGACY_DEFAULT_MODELS.has(nextProvider.model)) {
    return {
      ...nextProvider,
      model: DEFAULT_PROVIDER.model,
    };
  }

  return nextProvider;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      provider: DEFAULT_PROVIDER,
      termsAccepted: false,
      onboardingCompleted: false,
      setProvider: (provider) => set({ provider: normaliseProvider(provider) }),
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
      name: "claude-in-excel-rebuild",
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<SessionState> | undefined;

        return {
          onboardingCompleted: state?.onboardingCompleted ?? false,
          provider: migrateProvider(state?.provider),
          termsAccepted: state?.termsAccepted ?? false,
        };
      },
    },
  ),
);
