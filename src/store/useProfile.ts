import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EMPTY_PROFILE, type Profile, isComplete, sanitizeProfile } from "@/lib/profile/types";
import { emit } from "./useGame";

interface ProfileState {
  profile: Profile | null;
  cvText?: string; // Only kept when the user opts in
  update: (changes: Partial<Profile>) => void;
  setCvText: (text: string | undefined) => void;
  clear: () => void;
}

/**
 * The user's profile, used to rank jobs and personalise the sponsorship check.
 * Stored in this browser only; hydrated after mount (see ShortlistHydrator).
 */
export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      update: (changes) => {
        const profile = sanitizeProfile({ ...(get().profile ?? EMPTY_PROFILE), ...changes });
        set({ profile });
        if (isComplete(profile)) emit({ type: "profile" });
      },
      setCvText: (cvText) => set({ cvText }),
      clear: () => set({ profile: null, cvText: undefined }),
    }),
    {
      name: "horus-profile",
      version: 1,
      skipHydration: true,
      partialize: ({ profile, cvText }) => ({ profile, cvText }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProfileState>;
        return {
          ...current,
          profile: p.profile ? sanitizeProfile(p.profile) : null,
          cvText: typeof p.cvText === "string" ? p.cvText : undefined,
        };
      },
    }
  )
);

export function useProfileHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useProfile.persist.onFinishHydration(onChange),
    () => useProfile.persist.hasHydrated(),
    () => false
  );
}
