export const INTERVIEW_TYPES = [
  { value: "technical", label: "Technical" },
  { value: "hr", label: "HR" },
  { value: "behavioral", label: "Behavioral" },
  { value: "aptitude", label: "Aptitude" },
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Staff" },
  { value: "executive", label: "Executive" },
] as const;

export const HUMAN_VERDICTS = [
  { value: "strong_hire", label: "Strong hire" },
  { value: "hire", label: "Hire" },
  { value: "no_hire", label: "No hire" },
  { value: "strong_no_hire", label: "Strong no hire" },
] as const;
