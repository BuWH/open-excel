import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProviderConfig } from "../lib/provider/config";
import { DEFAULT_PROVIDER, normaliseProvider } from "../lib/provider/config";

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
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<SessionState> | undefined;

        return {
          onboardingCompleted: state?.onboardingCompleted ?? false,
          provider: normaliseProvider(state?.provider ?? DEFAULT_PROVIDER),
          termsAccepted: state?.termsAccepted ?? false,
        };
      },
    },
  ),
);
