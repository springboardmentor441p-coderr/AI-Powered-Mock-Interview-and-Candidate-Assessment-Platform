import { get, patch } from "@/api/client";
import type { CandidateProfile } from "@/types/api";

export const candidateApi = {
  async getProfile(): Promise<CandidateProfile | null> {
    return get<CandidateProfile | null>("/candidates/profile/");
  },
  async updateProfile(payload: Partial<CandidateProfile>): Promise<CandidateProfile> {
    return patch<CandidateProfile>("/candidates/profile/", payload);
  },
};
