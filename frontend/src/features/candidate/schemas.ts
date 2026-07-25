import { z } from "zod";

export const newInterviewSchema = z.object({
  interview_type: z.string().min(1, "Choose an interview type."),
  domain: z.string().min(1, "Tell us the role or domain."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic_count: z.coerce.number().int().min(2, "At least 2 topics.").max(15, "15 topics max."),
  use_primary_resume: z.boolean(),
});
export type NewInterviewFormValues = z.infer<typeof newInterviewSchema>;

export const candidateProfileSchema = z.object({
  headline: z.string().max(150, "Keep it under 150 characters.").optional().or(z.literal("")),
  target_role: z.string().max(120, "Keep it under 120 characters.").optional().or(z.literal("")),
  experience_level: z.string().optional().or(z.literal("")),
});
export type CandidateProfileFormValues = z.infer<typeof candidateProfileSchema>;
